import { lazy } from "react";
import type { ModuleRoute, ModuleNav } from "src/common/types/router";

const McpServersListPage = lazy(() => import("./pages/McpServersListPage"));
const McpServerDetailPage = lazy(() => import("./pages/McpServerDetailPage"));

export const routes: ModuleRoute[] = [
  {
    path: "/mcp-servers",
    element: McpServersListPage,
  },
  {
    path: "/mcp-servers/:id",
    element: McpServerDetailPage,
  },
];

export const nav: ModuleNav = {
  label: "MCP Servers",
  icon: "plug",
  order: 5,
};
