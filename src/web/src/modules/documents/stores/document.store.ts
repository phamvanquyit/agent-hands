import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type { DocumentItem, DocumentDetail, Project } from "src/lib/types";
import { client } from "src/lib/client";

interface DocumentsState {
  // Projects
  projects: Project[];
  projectsLoading: boolean;

  // Documents list (within a project)
  activeProject: Project | null;
  documents: DocumentItem[];
  docsLoading: boolean;

  // Active document (editor)
  activeDoc: DocumentDetail | null;
  docLoading: boolean;
  saving: boolean;
  saveStatus: "idle" | "saving" | "saved" | "error";

  // Project actions
  fetchProjects: () => Promise<void>;
  fetchProject: (id: string) => Promise<Project | null>;
  createProject: (name: string) => Promise<Project | null>;
  updateProject: (id: string, data: { name?: string; description?: string | null; icon?: string | null }) => Promise<Project | null>;
  deleteProject: (id: string) => Promise<void>;

  // Document actions
  fetchDocuments: (projectId: string) => Promise<void>;
  fetchDocument: (projectId: string, id: string) => Promise<void>;
  resolveDocument: (id: string) => Promise<DocumentDetail | null>;
  createDocument: (projectId: string) => Promise<DocumentDetail | null>;
  updateDocument: (projectId: string, id: string, data: { title?: string; content?: string; icon?: string | null }) => Promise<void>;
  deleteDocument: (projectId: string, id: string) => Promise<void>;
  clearActiveDoc: () => void;
  setActiveProject: (project: Project | null) => void;
}

export const useDocumentsStore = create<DocumentsState>()(
  devtools(
    immer((set, get) => ({
      projects: [],
      projectsLoading: false,

      activeProject: null,
      documents: [],
      docsLoading: false,

      activeDoc: null,
      docLoading: false,
      saving: false,
      saveStatus: "idle" as const,

      // ── Project actions ─────────────────────────────────────────────────────

      fetchProjects: async () => {
        set((s) => { s.projectsLoading = true; });
        try {
          const projects = await client.projects.list();
          set((s) => { s.projects = projects; s.projectsLoading = false; });
        } catch {
          set((s) => { s.projectsLoading = false; });
        }
      },

      fetchProject: async (id: string) => {
        try {
          const project = await client.projects.get(id);
          return project;
        } catch {
          return null;
        }
      },

      createProject: async (name: string) => {
        try {
          const project = await client.projects.create({ name });
          await get().fetchProjects();
          return project;
        } catch {
          return null;
        }
      },

      updateProject: async (id, data) => {
        try {
          const project = await client.projects.update(id, data);
          set((s) => {
            if (s.activeProject?.id === id) {
              s.activeProject = project;
            }
          });
          await get().fetchProjects();
          return project;
        } catch {
          return null;
        }
      },

      deleteProject: async (id: string) => {
        try {
          await client.projects.delete(id);
          set((s) => {
            if (s.activeProject?.id === id) {
              s.activeProject = null;
              s.documents = [];
              s.activeDoc = null;
            }
          });
          await get().fetchProjects();
        } catch {
          // ignore
        }
      },

      setActiveProject: (project: Project | null) => {
        set((s) => { s.activeProject = project; });
      },

      // ── Document actions ────────────────────────────────────────────────────

      fetchDocuments: async (projectId: string) => {
        set((s) => { s.docsLoading = true; });
        try {
          const docs = await client.documents.list(projectId);
          set((s) => { s.documents = docs; s.docsLoading = false; });
        } catch {
          set((s) => { s.docsLoading = false; });
        }
      },

      fetchDocument: async (projectId: string, id: string) => {
        set((s) => { s.docLoading = true; });
        try {
          const doc = await client.documents.get(projectId, id);
          set((s) => { s.activeDoc = doc; s.docLoading = false; });
        } catch {
          set((s) => { s.docLoading = false; s.activeDoc = null; });
        }
      },

      /** Resolve a document by ID only — used for direct URL navigation */
      resolveDocument: async (id: string) => {
        set((s) => { s.docLoading = true; });
        try {
          const doc = await client.documents.resolve(id);
          set((s) => { s.activeDoc = doc; s.docLoading = false; });
          return doc;
        } catch {
          set((s) => { s.docLoading = false; s.activeDoc = null; });
          return null;
        }
      },

      createDocument: async (projectId: string) => {
        try {
          const doc = await client.documents.create(projectId, { title: "Untitled" });
          await get().fetchDocuments(projectId);
          return doc;
        } catch {
          return null;
        }
      },

      updateDocument: async (projectId, id, data) => {
        set((s) => { s.saving = true; s.saveStatus = "saving"; });
        try {
          const doc = await client.documents.update(projectId, id, data);
          set((s) => {
            s.activeDoc = doc;
            s.saving = false;
            s.saveStatus = "saved";
          });
          // Refresh list if title changed
          if (data.title !== undefined) {
            await get().fetchDocuments(projectId);
          }
        } catch {
          set((s) => { s.saving = false; s.saveStatus = "error"; });
        }
      },

      deleteDocument: async (projectId: string, id: string) => {
        try {
          await client.documents.delete(projectId, id);
          set((s) => {
            if (s.activeDoc?.id === id) s.activeDoc = null;
          });
          await get().fetchDocuments(projectId);
        } catch {
          // ignore
        }
      },

      clearActiveDoc: () => {
        set((s) => { s.activeDoc = null; });
      },
    })),
    { name: "documents" },
  ),
);
