import { lazy } from "react";
import type { ModuleRoute, ModuleNav } from "src/common/types/router";

const DatabasesListPage = lazy(() => import("./pages/DatabasesListPage"));
const DatabaseDetailPage = lazy(() => import("./pages/DatabaseDetailPage"));
const TableDetailPage = lazy(() => import("./pages/TableDetailPage"));

export const routes: ModuleRoute[] = [
  {
    path: "/databases",
    element: DatabasesListPage,
  },
  {
    path: "/databases/:id",
    element: DatabaseDetailPage,
  },
  {
    path: "/databases/:dbId/tables/:id",
    element: TableDetailPage,
  },
];

export const nav: ModuleNav = {
  label: "Databases",
  icon: "database",
  order: 4,
};
