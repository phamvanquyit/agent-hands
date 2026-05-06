import { lazy } from "react";
import type { ModuleRoute, ModuleNav } from "src/common/types/router";

const ProjectsPage = lazy(() => import("./pages/ProjectsPage"));
const DocumentsListPage = lazy(() => import("./pages/DocumentsListPage"));
const DocumentEditorPage = lazy(() => import("./pages/DocumentEditorPage"));

export const routes: ModuleRoute[] = [
  {
    path: "/documents",
    element: ProjectsPage,
  },
  {
    path: "/documents/project/:projectId",
    element: DocumentsListPage,
  },
  {
    path: "/documents/:id",
    element: DocumentEditorPage,
  },
];

export const nav: ModuleNav = {
  label: "Documents",
  icon: "file-text",
  order: 2,
};
