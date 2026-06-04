const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:18080";

async function login() {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ login: "admin", password: "admin123" }),
  });
  if (!res.ok) {
    throw new Error(`Login failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json() as any;
  return data.access_token;
}

async function createProfile(token: string) {
  const res = await fetch(`${BASE_URL}/api/browsers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      name: "Docker Test Profile",
      description: "A profile created during Docker tests",
      fingerprint: {
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        screenResolution: "1920x1080",
        language: "en-US",
        platform: "Win32"
      }
    }),
  });
  if (!res.ok) {
    throw new Error(`Create profile failed: ${res.status} ${await res.text()}`);
  }
  return await res.json() as any;
}

async function verifyNoPlaywright() {
  console.log("Logging in...");
  const token = await login();
  console.log("Creating profile...");
  const profile = await createProfile(token);
  console.log(`Profile created: ${profile.id}`);

  console.log("Attempting to start profile (should fail)...");
  const res = await fetch(`${BASE_URL}/api/browsers/${profile.id}/start`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  const status = res.status;
  console.log(`Status: ${status}`);
  const body = await res.json() as any;
  console.log("Response body:", JSON.stringify(body));

  // Assert status is 500 or error contains "playwright"
  if (status !== 500) {
    throw new Error(`Expected status 500, got ${status}`);
  }
  if (!body.message || !body.message.toLowerCase().includes("playwright")) {
    throw new Error(`Expected error message to mention 'playwright', got: ${JSON.stringify(body)}`);
  }
  console.log("Graceful error check passed! Server handles missing Playwright correctly.");

  // Delete the profile to keep DB clean
  const delRes = await fetch(`${BASE_URL}/api/browsers/${profile.id}`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${token}` }
  });
  if (!delRes.ok) {
    throw new Error(`Failed to clean up profile: ${delRes.status}`);
  }
  console.log("Cleanup successful.");
}

async function verifyWithPlaywright() {
  console.log("Logging in...");
  const token = await login();
  console.log("Creating profile...");
  const profile = await createProfile(token);
  console.log(`Profile created: ${profile.id}`);

  console.log("Starting profile (should succeed)...");
  const res = await fetch(`${BASE_URL}/api/browsers/${profile.id}/start`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  if (!res.ok) {
    throw new Error(`Failed to start browser: ${res.status} ${await res.text()}`);
  }
  const startInfo = await res.json() as any;
  console.log("Browser started successfully:", startInfo);

  if (startInfo.status !== "running") {
    throw new Error(`Expected status 'running', got '${startInfo.status}'`);
  }
  if (!startInfo.cdpPort || !startInfo.wsEndpoint) {
    throw new Error("Missing cdpPort or wsEndpoint in start response");
  }

  // Verify list/get profile contains running status
  const getRes = await fetch(`${BASE_URL}/api/browsers/${profile.id}`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  const getInfo = await getRes.json() as any;
  if (getInfo.status !== "running") {
    throw new Error(`Expected profile status to be 'running', got '${getInfo.status}'`);
  }

  // Get active tabs
  console.log("Getting active tabs...");
  const tabsRes = await fetch(`${BASE_URL}/api/browsers/${profile.id}/tabs`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  const tabs = await tabsRes.json() as any;
  console.log("Active tabs:", tabs);
  if (!Array.isArray(tabs) || tabs.length === 0) {
    throw new Error("Expected at least one active tab");
  }

  // Navigate the browser via control API
  console.log("Navigating browser via control API...");
  const controlRes = await fetch(`${BASE_URL}/api/browsers/${profile.id}/control`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      steps: [
        { action: "navigate", url: "https://example.com" }
      ]
    })
  });
  if (!controlRes.ok) {
    throw new Error(`Control API failed: ${controlRes.status} ${await controlRes.text()}`);
  }
  const controlResult = await controlRes.json() as any;
  console.log("Control result:", controlResult);

  // Take a screenshot
  console.log("Capturing screenshot...");
  const ssRes = await fetch(`${BASE_URL}/api/browsers/${profile.id}/screenshot`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  if (!ssRes.ok) {
    throw new Error(`Screenshot API failed: ${ssRes.status} ${await ssRes.text()}`);
  }
  const buffer = await ssRes.arrayBuffer();
  console.log(`Screenshot size: ${buffer.byteLength} bytes`);
  if (buffer.byteLength < 1000) {
    throw new Error(`Screenshot size too small: ${buffer.byteLength} bytes`);
  }

  // Stop browser
  console.log("Stopping browser...");
  const stopRes = await fetch(`${BASE_URL}/api/browsers/${profile.id}/stop`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}` }
  });
  if (!stopRes.ok) {
    throw new Error(`Stop API failed: ${stopRes.status} ${await stopRes.text()}`);
  }
  console.log("Browser stopped successfully.");

  // Delete profile
  const delRes = await fetch(`${BASE_URL}/api/browsers/${profile.id}`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${token}` }
  });
  if (!delRes.ok) {
    throw new Error(`Delete profile failed: ${delRes.status}`);
  }
  console.log("Profile deleted successfully.");
  console.log("All active browser checks passed! 🎉");
}

// Run verification directly
await verifyWithPlaywright();
