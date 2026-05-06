import { lazy } from "react";
import type { ModuleRoute, ModuleNav } from "src/common/types/router";

const ApiDocsPage = lazy(() => import("./pages/ApiDocsPage"));

export const routes: ModuleRoute[] = [
  {
    path: "/docs",
    element: ApiDocsPage,
  },
];

export const nav: ModuleNav = {
  label: "API Docs",
  icon: "book-open",
  order: 3,
  group: "admin",
};
