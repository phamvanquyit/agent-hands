import { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import type { ModuleRoute, ModuleNav } from "src/common/types/router";
import { AuthGuard, GuestGuard } from "src/common/components/AuthGuard";
import LoadingScreen from "src/common/components/LoadingScreen";
import AppLayout from "src/layouts/AppLayout";

// Vite glob import — auto scan all module index files
const moduleFiles = import.meta.glob<{
  routes: ModuleRoute[];
  nav?: ModuleNav;
}>("./modules/*/index.ts", { eager: true });

// Collect all routes & nav items
interface LoadedModule {
  routes: ModuleRoute[];
  nav?: ModuleNav;
  moduleName: string;
}

export const loadedModules: LoadedModule[] = Object.entries(moduleFiles)
  .map(([path, mod]) => ({
    routes: mod.routes,
    nav: mod.nav,
    moduleName: path.match(/\.\/modules\/(.+)\/index\.ts/)![1],
  }))
  .sort((a, b) => (a.nav?.order ?? 99) - (b.nav?.order ?? 99));

// For AppLayout / Sidebar — grouped
const allNavItems = loadedModules
  .filter((m) => m.nav)
  .map((m) => ({
    ...m.nav!,
    path: m.nav!.path ?? m.routes[0]?.path ?? "/",
  }));

export const mainNavItems = allNavItems
  .filter((item) => (item.group ?? "main") === "main")
  .sort((a, b) => a.order - b.order);

export const adminNavItems = allNavItems
  .filter((item) => item.group === "admin")
  .sort((a, b) => a.order - b.order);

// Combined for backwards compat
export const navItems = [...mainNavItems, ...adminNavItems];

// Render routes
export function AppRoutes() {
  const authRoutes = loadedModules.flatMap((m) =>
    m.routes.filter(
      (r) => (r.guard ?? "auth") === "auth" && (r.layout ?? "app") === "app"
    )
  );
  const guestRoutes = loadedModules.flatMap((m) =>
    m.routes.filter((r) => r.guard === "guest")
  );
  const noLayoutRoutes = loadedModules.flatMap((m) =>
    m.routes.filter((r) => r.layout === "none" && r.guard !== "guest")
  );

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Guest routes (no layout, redirect if authed) */}
        {guestRoutes.map((r) => (
          <Route
            key={r.path}
            path={r.path}
            element={
              <GuestGuard>
                <r.element />
              </GuestGuard>
            }
          />
        ))}

        {/* Protected routes with AppLayout */}
        <Route
          element={
            <AuthGuard>
              <AppLayout />
            </AuthGuard>
          }
        >
          {authRoutes.map((r) => (
            <Route key={r.path} path={r.path} element={<r.element />} />
          ))}
        </Route>

        {/* No layout routes */}
        {noLayoutRoutes.map((r) => (
          <Route
            key={r.path}
            path={r.path}
            element={
              <AuthGuard>
                <r.element />
              </AuthGuard>
            }
          />
        ))}

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
