// NOTE: playwright is loaded lazily via getChromium() to avoid crashing the
// server when the package is not installed. All browser operations call
// getChromium() which will throw a clear error if playwright is missing.
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { createServer } from "node:net";
import { getDb } from "../../common/db/client.js";
import { browserProfiles, users } from "../../common/db/schema.js";
import { eq, like, and, sql } from "drizzle-orm";
import { genId } from "../../common/utils.js";
import type {
  CreateProfileBody,
  UpdateProfileBody,
  ListProfilesQuery,
  ProxyConfig,
  FingerprintConfig,
  ControlProfileBody,
  RunStepsBody,
} from "./browser.schema.js";

// ── Lazy Playwright loader ──────────────────────────────────────────────────────
// Playwright is an optional dependency. If not installed, all non-browser
// features continue working. Browser endpoints return a friendly error.
let _chromium: any = null;

async function getChromium() {
  if (_chromium) return _chromium;
  try {
    const pw = await import("playwright");
    _chromium = pw.chromium;
    return _chromium;
  } catch {
    throw new Error(
      "Browser feature requires the 'playwright' package.\n" +
      "Install it with:\n" +
      "  bun add playwright && npx playwright install --with-deps chromium\n" +
      "Then restart the server."
    );
  }
}

/** Check if playwright is available without throwing */
export async function isPlaywrightAvailable(): Promise<boolean> {
  try {
    await getChromium();
    return true;
  } catch {
    return false;
  }
}

// Cache for active contexts in memory
interface ActiveProfile {
  context: any; // playwright BrowserContext — typed as any for lazy import
  cdpPort: number;
  wsEndpoint: string;
  lastActivityAt: number;
}
export const activeProfiles = new Map<string, ActiveProfile>();

// Max concurrent browsers limit (defaults to 3, configurable via env)
const MAX_CONCURRENT_BROWSERS = Number(process.env.MAX_CONCURRENT_BROWSERS || 3);

// Idle auto-stop: stop browsers with no activity for N minutes (default 5)
const BROWSER_IDLE_TIMEOUT_MS = (Number(process.env.BROWSER_IDLE_TIMEOUT_MIN) || 5) * 60 * 1000;

/** Touch the lastActivityAt timestamp for a running profile */
function touchActivity(id: string) {
  const active = activeProfiles.get(id);
  if (active) active.lastActivityAt = Date.now();
}

/** Get runtime stats for a running profile */
export function getProfileStats(id: string): { tabCount: number; memoryMB: number } | null {
  const active = activeProfiles.get(id);
  if (!active) return null;
  const tabCount = active.context.pages().length;
  // Report process-level RSS divided by active browser count as a rough per-profile estimate
  const totalRssMB = Math.round(process.memoryUsage().rss / 1024 / 1024);
  const profileCount = activeProfiles.size || 1;
  const memoryMB = Math.round(totalRssMB / profileCount);
  return { tabCount, memoryMB };
}

// ── Idle Auto-Stop Sweeper ──────────────────────────────────────────────────────
setInterval(async () => {
  const now = Date.now();
  const toStop: string[] = [];
  activeProfiles.forEach((active, id) => {
    const idleMs = now - active.lastActivityAt;
    if (idleMs >= BROWSER_IDLE_TIMEOUT_MS) {
      toStop.push(id);
    }
  });
  for (const id of toStop) {
    console.log(
      `[browser-sweeper] Auto-stopping idle browser ${id}`,
    );
    try {
      await stopBrowser(id);
    } catch (err) {
      console.error(`[browser-sweeper] Failed to stop browser ${id}:`, err);
    }
  }
}, 60_000);

// Base directory for profile storage
const dataDir = process.env.DATA_DIR ?? `${process.env.HOME}/.agent-hands`;
const PROFILES_BASE_DIR = join(dataDir, "browser-profiles");

/** Find an available random port for CDP debugging */
async function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "string" ? 0 : address?.port ?? 0;
      server.close(() => {
        if (port) resolve(port);
        else reject(new Error("Failed to allocate dynamic port"));
      });
    });
  });
}

/** Retrieve standard WS debugger endpoint from a local port */
async function getWsEndpoint(port: number): Promise<string> {
  const maxRetries = 40;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) {
        const data = (await res.json()) as { webSocketDebuggerUrl?: string };
        if (data.webSocketDebuggerUrl) {
          return data.webSocketDebuggerUrl;
        }
      }
    } catch {
      // Ignore errors and retry as browser may still be starting up
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`CDP debug endpoint on port ${port} did not become ready`);
}

/** Automatically generate a highly realistic modern fingerprint */
function generateDefaultFingerprint(name: string, proxy?: ProxyConfig | null): FingerprintConfig {
  // Common macOS user agents
  const uas = [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  ];
  // Select a semi-stable user agent based on profile name length
  const userAgent = uas[name.length % uas.length];

  // Viewports
  const viewports = [
    { width: 1280, height: 800 },
    { width: 1440, height: 900 },
    { width: 1920, height: 1080 },
  ];
  const viewport = viewports[name.length % viewports.length];

  // Try to infer standard language/locale
  const locale = "en-US";
  const timezoneId = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

  return {
    userAgent,
    viewport,
    locale,
    timezoneId,
  };
}

export async function listBrowserProfiles(query: ListProfilesQuery, userId?: string) {
  const db = getDb();
  const { page, limit, search } = query;
  const offset = (page - 1) * limit;

  let whereClause: any = undefined;
  if (userId) {
    whereClause = eq(browserProfiles.createdBy, userId);
  }
  if (search) {
    const searchFilter = like(browserProfiles.name, `%${search}%`);
    whereClause = whereClause ? and(whereClause, searchFilter) : searchFilter;
  }

  const items = db
    .select()
    .from(browserProfiles)
    .where(whereClause)
    .limit(limit)
    .offset(offset)
    .all();

  // Enrich running profiles with runtime stats (tab count + memory)
  const enrichedItems = items.map((item) => {
    const stats = getProfileStats(item.id);
    return {
      ...item,
      tabCount: stats?.tabCount ?? 0,
      memoryMB: stats?.memoryMB ?? 0,
    };
  });

  const countRes = db
    .select({ count: sql<number>`COUNT(*)` })
    .from(browserProfiles)
    .where(whereClause)
    .get();

  const total = countRes?.count ?? 0;

  return {
    items: enrichedItems,
    meta: {
      total,
      page,
      limit,
      hasMore: offset + limit < total,
    },
  };
}

export async function getBrowserProfileById(id: string) {
  const db = getDb();
  const profile = db.select().from(browserProfiles).where(eq(browserProfiles.id, id)).get();
  return profile || null;
}

export async function createBrowserProfile(body: CreateProfileBody, userId?: string) {
  const db = getDb();
  const id = genId("bpr");
  const userDataDir = join(PROFILES_BASE_DIR, id);

  // Generate beautiful organic fingerprint defaults if missing
  const fingerprintConfig = body.fingerprintConfig || generateDefaultFingerprint(body.name, body.proxyConfig);

  let creatorId = userId;
  if (!creatorId) {
    const firstUser = db.select().from(users).limit(1).get();
    if (!firstUser) {
      throw new Error("No users found in database. Please register a user first.");
    }
    creatorId = firstUser.id;
  }

  const insertData = {
    id,
    name: body.name,
    description: body.description || null,
    userDataDir,
    proxyConfig: body.proxyConfig ? JSON.stringify(body.proxyConfig) : null,
    fingerprintConfig: JSON.stringify(fingerprintConfig),
    status: "idle" as const,
    createdBy: creatorId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await db.insert(browserProfiles).values(insertData);
  return getBrowserProfileById(id);
}

export async function updateBrowserProfile(id: string, body: UpdateProfileBody) {
  const db = getDb();
  const profile = await getBrowserProfileById(id);
  if (!profile) throw new Error("Profile not found");

  if (profile.status !== "idle") {
    throw new Error("Cannot update configuration while the browser profile is running");
  }

  const updateData: Partial<typeof browserProfiles.$inferInsert> = {
    updatedAt: Date.now(),
  };

  if (body.name !== undefined) updateData.name = body.name;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.proxyConfig !== undefined) {
    updateData.proxyConfig = body.proxyConfig ? JSON.stringify(body.proxyConfig) : null;
  }
  if (body.fingerprintConfig !== undefined) {
    updateData.fingerprintConfig = body.fingerprintConfig ? JSON.stringify(body.fingerprintConfig) : null;
  }

  await db.update(browserProfiles).set(updateData).where(eq(browserProfiles.id, id));
  return getBrowserProfileById(id);
}

export async function deleteBrowserProfile(id: string) {
  const db = getDb();
  const profile = await getBrowserProfileById(id);
  if (!profile) throw new Error("Profile not found");

  // Force stop browser if running
  try {
    await stopBrowser(id);
  } catch {
    // Ignore stop errors during deletion
  }

  // Delete DB record
  await db.delete(browserProfiles).where(eq(browserProfiles.id, id));

  // Clean up persistent directory recursively
  try {
    if (existsSync(profile.userDataDir)) {
      rmSync(profile.userDataDir, { recursive: true, force: true });
    }
  } catch (err) {
    console.error(`Failed to delete userDataDir for profile ${id}:`, err);
  }

  return { id, deleted: true };
}

export async function startBrowser(id: string) {
  const db = getDb();
  const profile = await getBrowserProfileById(id);
  if (!profile) throw new Error("Profile not found");

  // If already running in memory, return it
  if (activeProfiles.has(id)) {
    return activeProfiles.get(id)!;
  }

  // Enforce global concurrency check
  const runningCount = activeProfiles.size;
  if (runningCount >= MAX_CONCURRENT_BROWSERS) {
    throw new Error(`Maximum concurrent running browsers limit (${MAX_CONCURRENT_BROWSERS}) reached. Please stop another profile first.`);
  }

  // Ensure persistent data dir exists
  mkdirSync(profile.userDataDir, { recursive: true });

  const cdpPort = await getFreePort();

  const proxy: ProxyConfig | null = profile.proxyConfig ? JSON.parse(profile.proxyConfig) : null;
  const fingerprint: FingerprintConfig | null = profile.fingerprintConfig ? JSON.parse(profile.fingerprintConfig) : null;

  const args = [
    `--remote-debugging-port=${cdpPort}`,
    `--remote-debugging-address=127.0.0.1`,
    `--disable-blink-features=AutomationControlled`,
  ];

  const launchOptions: any = {
    args,
    headless: true, // Default to headless mode for reliable background running
  };

  // Bind custom stealth path (CloakBrowser custom compiled Chromium) if configured
  if (process.env.CLOAK_BROWSER_PATH && existsSync(process.env.CLOAK_BROWSER_PATH)) {
    launchOptions.executablePath = process.env.CLOAK_BROWSER_PATH;
  }

  if (proxy) {
    launchOptions.proxy = {
      server: proxy.server,
      username: proxy.username || undefined,
      password: proxy.password || undefined,
    };
  }

  if (fingerprint) {
    if (fingerprint.userAgent) launchOptions.userAgent = fingerprint.userAgent;
    if (fingerprint.viewport) launchOptions.viewport = fingerprint.viewport;
    if (fingerprint.locale) {
      launchOptions.locale = fingerprint.locale;
      launchOptions.args.push(`--lang=${fingerprint.locale}`);
    }
    if (fingerprint.timezoneId) launchOptions.timezoneId = fingerprint.timezoneId;
    if (fingerprint.geolocation) {
      launchOptions.geolocation = fingerprint.geolocation;
      launchOptions.permissions = ["geolocation"];
    }
  }

  // Launch persistent context via Playwright (lazy-loaded)
  const chromium = await getChromium();
  const context = await chromium.launchPersistentContext(profile.userDataDir, launchOptions);

  try {
    const wsEndpoint = await getWsEndpoint(cdpPort);

    // Save context to active memory map
    const activeInfo = { context, cdpPort, wsEndpoint, lastActivityAt: Date.now() };
    activeProfiles.set(id, activeInfo);

    // Update DB status to running
    await db
      .update(browserProfiles)
      .set({
        status: "running",
        cdpPort,
        wsEndpoint,
        updatedAt: Date.now(),
      })
      .where(eq(browserProfiles.id, id));

    return activeInfo;
  } catch (err) {
    // If starting up failed, make sure we close the browser context safely
    await context.close().catch(() => {});
    throw err;
  }
}

export async function stopBrowser(id: string) {
  const db = getDb();
  const profile = await getBrowserProfileById(id);
  if (!profile) throw new Error("Profile not found");

  const active = activeProfiles.get(id);
  if (active) {
    try {
      await active.context.close();
    } catch (err) {
      console.error(`Error closing context for profile ${id}:`, err);
    }
    activeProfiles.delete(id);
  }

  // Clean up database state regardless
  await db
    .update(browserProfiles)
    .set({
      status: "idle",
      cdpPort: null,
      wsEndpoint: null,
      pid: null,
      updatedAt: Date.now(),
    })
    .where(eq(browserProfiles.id, id));

  return { id, stopped: true };
}

export async function getActiveTabs(id: string) {
  const active = activeProfiles.get(id);
  if (!active) return [];

  touchActivity(id);

  const pages = active.context.pages();
  const tabs = [];
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    tabs.push({
      index: i,
      url: page.url(),
      title: await page.title().catch(() => "Untitled"),
    });
  }
  return tabs;
}

export async function captureScreenshot(id: string, tabIndex?: number): Promise<Buffer> {
  const active = activeProfiles.get(id);
  if (!active) {
    throw new Error("Browser profile is not running. Please start it first.");
  }

  touchActivity(id);

  const idx = tabIndex ?? 0;
  let page = active.context.pages()[idx];
  if (!page) {
    page = active.context.pages()[0] || (await active.context.newPage());
  }

  // Capture PNG screenshot of current viewport
  return await page.screenshot({ type: "png" });
}

export async function executeBrowserAction(id: string, body: ControlProfileBody) {
  const active = activeProfiles.get(id);
  if (!active) {
    throw new Error("Browser profile is not running. Please start it first.");
  }

  touchActivity(id);

  const { action, url, selector, text, code, tabIndex } = body;
  const idx = tabIndex ?? 0;
  const pagesList = active.context.pages();

  if (action !== "open_tab" && action !== "close_tab" && idx >= pagesList.length) {
    throw new Error(`Tab index ${idx} is out of bounds (total open tabs: ${pagesList.length})`);
  }

  let page = pagesList[idx];
  if (!page && action !== "open_tab") {
    page = pagesList[0] || (await active.context.newPage());
  }

  switch (action) {
    case "open_tab": {
      const newPage = await active.context.newPage();
      if (url) {
        await newPage.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
      }
      return {
        success: true,
        tabIndex: active.context.pages().length - 1,
        url: newPage.url(),
        title: await newPage.title().catch(() => "Untitled"),
      };
    }

    case "close_tab": {
      if (pagesList.length <= 1) {
        throw new Error("Cannot close the only open tab");
      }
      if (idx >= pagesList.length) {
        throw new Error(`Tab index ${idx} is out of bounds (total open tabs: ${pagesList.length})`);
      }
      await pagesList[idx].close();
      return { success: true };
    }

    case "navigate": {
      if (!url) throw new Error("URL is required for navigation");
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
      return { url: page.url(), title: await page.title() };
    }

    case "click": {
      if (!selector) throw new Error("Selector is required for click action");
      await page.click(selector, { timeout: 10000 });
      return { success: true };
    }

    case "type": {
      if (!selector) throw new Error("Selector is required for type action");
      if (text === undefined) throw new Error("Text is required for type action");
      await page.type(selector, text, { delay: 50, timeout: 10000 });
      return { success: true };
    }

    case "screenshot": {
      const screenshotBuf = await page.screenshot({ type: "png" });
      return { base64: screenshotBuf.toString("base64") };
    }

    case "get_content": {
      const content = await page.content();
      return {
        url: page.url(),
        title: await page.title(),
        content,
      };
    }

    case "eval": {
      if (!code) throw new Error("Javascript code is required for evaluate action");
      const result = await page.evaluate(code);
      return { result };
    }

    default:
      throw new Error(`Unsupported browser action: ${action}`);
  }
}

export async function runBatchSteps(body: RunStepsBody) {
  const { profileId, tabIndex, steps } = body;
  const defaultTimeout = 10000;

  if (profileId) {
    // Persistent Mode (with Profile)
    // 1. Ensure profile is running
    let active = activeProfiles.get(profileId);
    if (!active) {
      active = await startBrowser(profileId);
    }

    // Keep alive — prevent idle sweeper from killing us mid-execution
    touchActivity(profileId);

    // 2. Resolve target page
    let page: Awaited<ReturnType<typeof active.context.newPage>>;
    let shouldClosePage = false;

    if (tabIndex !== undefined && tabIndex !== null) {
      // Reuse an existing tab
      const pages = active.context.pages();
      if (pages.length === 0) {
        throw new Error("Browser has no open tabs. Omit tabIndex to create a new tab.");
      }
      if (tabIndex >= pages.length) {
        throw new Error(
          `Tab index ${tabIndex} is out of bounds (open tabs: ${pages.length}, valid range: 0–${pages.length - 1})`
        );
      }
      page = pages[tabIndex];
    } else {
      // Create a dedicated new tab for this execution session
      page = await active.context.newPage();
      shouldClosePage = true;
    }

    page.setDefaultTimeout(defaultTimeout);

    // Determine the actual tab index used (for response)
    const usedTabIndex = active.context.pages().indexOf(page);

    try {
      const results = [];
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const stepTimeout = step.timeout ?? defaultTimeout;

        // Keep alive per-step for long-running sequences
        touchActivity(profileId);

        try {
          let stepResult: any = null;
          switch (step.action) {
            case "navigate": {
              if (!step.url) throw new Error("URL is required for navigate action");
              await page.goto(step.url, { waitUntil: "domcontentloaded", timeout: stepTimeout });
              stepResult = { url: page.url(), title: await page.title().catch(() => "Untitled") };
              break;
            }
            case "click": {
              if (!step.selector && !step.text) throw new Error("selector or text is required for click action");
              if (step.text) {
                const locator = page.getByText(step.text, { exact: false }).first();
                await locator.waitFor({ state: "visible", timeout: stepTimeout });
                await locator.click({ timeout: stepTimeout });
              } else {
                const locator = page.locator(step.selector!).first();
                await locator.waitFor({ state: "visible", timeout: stepTimeout });
                await locator.click({ timeout: stepTimeout });
              }
              stepResult = { success: true };
              break;
            }
            case "type": {
              if (!step.selector) throw new Error("selector is required for type action");
              if (step.text === undefined) throw new Error("text is required for type action");
              const locator = page.locator(step.selector).first();
              await locator.waitFor({ state: "visible", timeout: stepTimeout });
              await locator.fill(step.text);
              stepResult = { success: true };
              break;
            }
            case "wait": {
              if (!step.selector && !step.text) throw new Error("selector or text is required for wait action");
              if (step.text) {
                await page.getByText(step.text, { exact: false }).first().waitFor({ state: "visible", timeout: stepTimeout });
              } else {
                await page.locator(step.selector!).first().waitFor({ state: "visible", timeout: stepTimeout });
              }
              stepResult = { success: true };
              break;
            }
            case "screenshot": {
              const buf = await page.screenshot({ type: "png" });
              stepResult = { base64: buf.toString("base64") };
              break;
            }
            case "get_content": {
              stepResult = { url: page.url(), title: await page.title().catch(() => "Untitled"), content: await page.content() };
              break;
            }
            case "eval": {
              if (!step.code) throw new Error("code is required for eval action");
              const evalResult = await page.evaluate(step.code);
              stepResult = { result: evalResult };
              break;
            }
            default:
              throw new Error(`Unsupported step action: ${step.action}`);
          }
          results.push({ step: i + 1, action: step.action, success: true, result: stepResult });
        } catch (err: any) {
          results.push({ step: i + 1, action: step.action, success: false, error: err.message });
          break; // Stop execution on error
        }
      }
      return { profileId, persistent: true, tabIndex: usedTabIndex, results };
    } finally {
      // Only close the tab if WE created it (new tab mode)
      if (shouldClosePage) {
        await page.close().catch(() => {});
      }
    }
  } else {
    // Ephemeral Mode (Incognito / No Profile)
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const tempDir = join(PROFILES_BASE_DIR, tempId);
    mkdirSync(tempDir, { recursive: true });

    const cdpPort = await getFreePort();
    const args = [
      `--remote-debugging-port=${cdpPort}`,
      `--remote-debugging-address=127.0.0.1`,
      `--disable-blink-features=AutomationControlled`,
    ];
    const launchOptions: any = {
      args,
      headless: true,
    };
    if (process.env.CLOAK_BROWSER_PATH && existsSync(process.env.CLOAK_BROWSER_PATH)) {
      launchOptions.executablePath = process.env.CLOAK_BROWSER_PATH;
    }

    const chromium = await getChromium();
    const context = await chromium.launchPersistentContext(tempDir, launchOptions);
    const page = context.pages()[0] || (await context.newPage());
    page.setDefaultTimeout(defaultTimeout);

    try {
      const results = [];
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const stepTimeout = step.timeout ?? defaultTimeout;
        try {
          let stepResult: any = null;
          switch (step.action) {
            case "navigate": {
              if (!step.url) throw new Error("URL is required for navigate action");
              await page.goto(step.url, { waitUntil: "domcontentloaded", timeout: stepTimeout });
              stepResult = { url: page.url(), title: await page.title().catch(() => "Untitled") };
              break;
            }
            case "click": {
              if (!step.selector && !step.text) throw new Error("selector or text is required for click action");
              if (step.text) {
                const locator = page.getByText(step.text, { exact: false }).first();
                await locator.waitFor({ state: "visible", timeout: stepTimeout });
                await locator.click({ timeout: stepTimeout });
              } else {
                const locator = page.locator(step.selector!).first();
                await locator.waitFor({ state: "visible", timeout: stepTimeout });
                await locator.click({ timeout: stepTimeout });
              }
              stepResult = { success: true };
              break;
            }
            case "type": {
              if (!step.selector) throw new Error("selector is required for type action");
              if (step.text === undefined) throw new Error("text is required for type action");
              const locator = page.locator(step.selector).first();
              await locator.waitFor({ state: "visible", timeout: stepTimeout });
              await locator.fill(step.text);
              stepResult = { success: true };
              break;
            }
            case "wait": {
              if (!step.selector && !step.text) throw new Error("selector or text is required for wait action");
              if (step.text) {
                await page.getByText(step.text, { exact: false }).first().waitFor({ state: "visible", timeout: stepTimeout });
              } else {
                await page.locator(step.selector!).first().waitFor({ state: "visible", timeout: stepTimeout });
              }
              stepResult = { success: true };
              break;
            }
            case "screenshot": {
              const buf = await page.screenshot({ type: "png" });
              stepResult = { base64: buf.toString("base64") };
              break;
            }
            case "get_content": {
              stepResult = { url: page.url(), title: await page.title().catch(() => "Untitled"), content: await page.content() };
              break;
            }
            case "eval": {
              if (!step.code) throw new Error("code is required for eval action");
              const evalResult = await page.evaluate(step.code);
              stepResult = { result: evalResult };
              break;
            }
            default:
              throw new Error(`Unsupported step action: ${step.action}`);
          }
          results.push({ step: i + 1, action: step.action, success: true, result: stepResult });
        } catch (err: any) {
          results.push({ step: i + 1, action: step.action, success: false, error: err.message });
          break; // Stop execution on error
        }
      }
      return { profileId: null, persistent: false, results };
    } finally {
      // Shutdown completely and delete temporary directory
      await context.close().catch(() => {});
      try {
        rmSync(tempDir, { recursive: true, force: true });
      } catch (err) {
        console.error(`Failed to clean up ephemeral directory ${tempDir}:`, err);
      }
    }
  }
}

