import { lazy } from "react";
import type { ModuleRoute, ModuleNav } from "src/common/types/router";

const StoragePage = lazy(() => import("./pages/StoragePage"));

export const routes: ModuleRoute[] = [
  {
    path: "/storage",
    element: StoragePage,
  },
];

export const nav: ModuleNav = {
  label: "Storage",
  icon: "hard-drive",
  order: 5,
};
