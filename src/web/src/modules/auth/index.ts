import { lazy } from "react";
import type { ModuleRoute } from "src/common/types/router";

const LoginPage = lazy(() => import("./pages/LoginPage"));

export const routes: ModuleRoute[] = [
  {
    path: "/login",
    element: LoginPage,
    guard: "guest",
    layout: "none",
  },
];
