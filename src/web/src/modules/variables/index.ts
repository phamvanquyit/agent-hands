import { lazy } from "react";
import type { ModuleRoute, ModuleNav } from "src/common/types/router";

const VariablesNamespacesPage = lazy(() => import("./pages/VariablesNamespacesPage"));
const VariablesPage = lazy(() => import("./pages/VariablesPage"));

export const routes: ModuleRoute[] = [
  {
    path: "/variables",
    element: VariablesNamespacesPage,
  },
  {
    path: "/variables/namespace/:namespaceId",
    element: VariablesPage,
  },
];

export const nav: ModuleNav = {
  label: "Variables",
  icon: "key",
  order: 3,
};
