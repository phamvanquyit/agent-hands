/**
 * Suppress Monaco-editor's harmless lifecycle errors that occur during
 * React unmount / transitions. These are internal Monaco timing issues
 * and don't affect functionality.
 *
 * This module is side-effect only — import it once and the listeners
 * are registered. Subsequent imports are no-ops.
 */

let installed = false;

const MONACO_ERROR_PATTERNS = [
  "TextModel got disposed before DiffEditorWidget",
  "Cannot read properties of undefined (reading 'isVisible')",
  "Cannot set properties of undefined (setting 'orientation')",
];

function isMonacoError(msg: string | undefined | null): boolean {
  return msg != null && MONACO_ERROR_PATTERNS.some((p) => msg.includes(p));
}

export function installMonacoErrorSuppressor() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  window.addEventListener("error", (e) => {
    if (isMonacoError(e.message) || isMonacoError(e.error?.message)) {
      e.preventDefault();
      e.stopPropagation();
    }
  });

  window.addEventListener("unhandledrejection", (e) => {
    const msg = e.reason?.message || (typeof e.reason === "string" ? e.reason : "");
    if (isMonacoError(msg)) {
      e.preventDefault();
      e.stopPropagation();
    }
  });
}
