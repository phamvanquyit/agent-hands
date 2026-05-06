import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { requireAuth } from "../../common/auth/middleware.js";
import {
  createProjectBodySchema,
  updateProjectBodySchema,
} from "./project.schema.js";
import type { CreateProjectBody, UpdateProjectBody } from "./project.schema.js";
import {
  listProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} from "./project.service.js";

export function registerProjectRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();

  // GET / — list all projects
  r.get("/", { preHandler: [requireAuth] }, async (_req, reply) => {
    const data = await listProjects();
    return reply.send({
      items: data,
      meta: { total: data.length },
    });
  });

  // POST / — create project
  r.post(
    "/",
    { preHandler: [requireAuth], schema: { body: createProjectBodySchema } },
    async (req, reply) => {
      const project = await createProject(req.body as CreateProjectBody, req.auth!.userId);
      return reply.code(201).send(project);
    },
  );

  // GET /:projectId — get project
  r.get("/:projectId", { preHandler: [requireAuth] }, async (req, reply) => {
    const { projectId } = req.params as { projectId: string };
    const project = await getProjectById(projectId);
    if (!project) return reply.code(400).send({ error: "not_found", message: "Project not found" });
    return reply.send(project);
  });

  // PATCH /:projectId — update project
  r.patch(
    "/:projectId",
    { preHandler: [requireAuth], schema: { body: updateProjectBodySchema } },
    async (req, reply) => {
      const { projectId } = req.params as { projectId: string };
      const existing = await getProjectById(projectId);
      if (!existing) return reply.code(400).send({ error: "not_found", message: "Project not found" });
      const project = await updateProject(projectId, req.body as UpdateProjectBody);
      return reply.send(project);
    },
  );

  // DELETE /:projectId — delete project
  r.delete("/:projectId", { preHandler: [requireAuth] }, async (req, reply) => {
    const { projectId } = req.params as { projectId: string };
    const existing = await getProjectById(projectId);
    if (!existing) return reply.code(400).send({ error: "not_found", message: "Project not found" });
    await deleteProject(projectId);
    return reply.send({ id: projectId, deleted: true });
  });
}
