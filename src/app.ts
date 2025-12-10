import express, { Request, Response } from "express";
import {
  checkFeatureFlag,
  getAllFeatureFlags,
  FeatureFlags,
  UserContext,
} from "./flags";

interface Task {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  priority?: "low" | "medium" | "high";
  tags?: string[];
  createdAt?: string;
}

interface CreateTaskPayload {
  title?: unknown;
  description?: unknown;
  completed?: unknown;
  priority?: unknown;
  tags?: unknown;
}

interface UpdateTaskPayload extends CreateTaskPayload {}

const createApp = (): express.Application => {
  const app = express();
  app.use(express.json());

  // In-memory store scoped to this app instance; restarting wipes state.
  const tasks = new Map<number, Task>();
  let nextId = 1;

  const parseId = (rawId: string): number | null => {
    const id = Number.parseInt(rawId, 10);
    return Number.isInteger(id) && id > 0 ? id : null;
  };

  // Get user context from request headers
  const getUserContext = (req: Request): UserContext => {
    const userId = (req.headers["x-user-id"] as string) || "anonymous";
    const userName = req.headers["x-user-name"] as string;
    const userEmail = req.headers["x-user-email"] as string;

    return {
      key: userId,
      name: userName,
      email: userEmail,
    };
  };

  app.get("/tasks", async (_req: Request, res: Response<Task[]>) => {
    res.json(Array.from(tasks.values()));
  });

  app.get(
    "/tasks/:id",
    (req: Request<{ id: string }>, res: Response<Task | { error: string }>) => {
      const id = parseId(req.params.id);
      if (!id) {
        return res
          .status(400)
          .json({ error: "Task id must be a positive integer." });
      }

      const task = tasks.get(id);
      if (!task) {
        return res.status(404).json({ error: "Task not found." });
      }

      return res.json(task);
    }
  );

  app.post(
    "/tasks",
    async (req: Request, res: Response<Task | { error: string }>) => {
      const { title, description, completed, priority, tags } =
        req.body as CreateTaskPayload;
      const userContext = getUserContext(req);

      if (typeof title !== "string" || title.trim() === "") {
        return res.status(400).json({ error: "Task title is required." });
      }

      if (description !== undefined && typeof description !== "string") {
        return res
          .status(400)
          .json({ error: "Task description must be a string when provided." });
      }

      if (completed !== undefined && typeof completed !== "boolean") {
        return res
          .status(400)
          .json({
            error: "Task completed flag must be boolean when provided.",
          });
      }

      const normalizedDescription =
        typeof description === "string" ? description.trim() : "";
      const normalizedCompleted =
        typeof completed === "boolean" ? completed : false;

      // Handle priority feature flag
      let normalizedPriority: "low" | "medium" | "high" | undefined;
      if (priority !== undefined) {
        const prioritiesEnabled = await checkFeatureFlag(
          FeatureFlags.TASK_PRIORITIES,
          userContext
        );
        if (
          prioritiesEnabled &&
          ["low", "medium", "high"].includes(String(priority))
        ) {
          normalizedPriority = priority as "low" | "medium" | "high";
        } else if (priority !== undefined) {
          return res
            .status(400)
            .json({
              error: "Task priorities feature is not enabled for your user",
            });
        }
      }

      // Handle tags feature flag
      let normalizedTags: string[] | undefined;
      if (tags !== undefined) {
        const advancedFilteringEnabled = await checkFeatureFlag(
          FeatureFlags.ADVANCED_FILTERING,
          userContext
        );
        if (
          advancedFilteringEnabled &&
          Array.isArray(tags) &&
          tags.every((t) => typeof t === "string")
        ) {
          normalizedTags = tags as string[];
        } else if (tags !== undefined) {
          return res
            .status(400)
            .json({
              error: "Advanced filtering feature is not enabled for your user.",
            });
        }
      }

      const task: Task = {
        id: nextId++,
        title: title.trim(),
        description: normalizedDescription,
        completed: normalizedCompleted,
        ...(normalizedPriority && { priority: normalizedPriority }),
        ...(normalizedTags && { tags: normalizedTags }),
        createdAt: new Date().toISOString(),
      };

      tasks.set(task.id, task);
      return res.status(201).json(task);
    }
  );

  app.put(
    "/tasks/:id",
    async (
      req: Request<{ id: string }>,
      res: Response<Task | { error: string }>
    ) => {
      const id = parseId(req.params.id);
      if (!id) {
        return res
          .status(400)
          .json({ error: "Task id must be a positive integer." });
      }

      const existing = tasks.get(id);
      if (!existing) {
        return res.status(404).json({ error: "Task not found." });
      }

      const { title, description, completed, priority, tags } =
        req.body as UpdateTaskPayload;
      const userContext = getUserContext(req);
      const hasUpdatableField =
        title !== undefined ||
        description !== undefined ||
        completed !== undefined ||
        priority !== undefined ||
        tags !== undefined;

      if (!hasUpdatableField) {
        return res
          .status(400)
          .json({ error: "Provide at least one field to update." });
      }

      if (title !== undefined) {
        if (typeof title !== "string" || title.trim() === "") {
          return res
            .status(400)
            .json({ error: "Task title must be a non-empty string." });
        }
        existing.title = title.trim();
      }

      if (description !== undefined) {
        if (typeof description !== "string") {
          return res
            .status(400)
            .json({ error: "Task description must be a string." });
        }
        existing.description = description.trim();
      }

      if (completed !== undefined) {
        if (typeof completed !== "boolean") {
          return res
            .status(400)
            .json({ error: "Task completed flag must be boolean." });
        }
        existing.completed = completed;
      }

      if (priority !== undefined) {
        const prioritiesEnabled = await checkFeatureFlag(
          FeatureFlags.TASK_PRIORITIES,
          userContext
        );
        if (!prioritiesEnabled) {
          return res
            .status(400)
            .json({
              error: "Task priorities feature is not enabled for your user.",
            });
        }
        if (!["low", "medium", "high"].includes(String(priority))) {
          return res
            .status(400)
            .json({ error: "Priority must be low, medium, or high." });
        }
        existing.priority = priority as "low" | "medium" | "high";
      }

      if (tags !== undefined) {
        const advancedFilteringEnabled = await checkFeatureFlag(
          FeatureFlags.ADVANCED_FILTERING,
          userContext
        );
        if (!advancedFilteringEnabled) {
          return res
            .status(400)
            .json({
              error: "Advanced filtering feature is not enabled for your user.",
            });
        }
        if (!Array.isArray(tags) || !tags.every((t) => typeof t === "string")) {
          return res
            .status(400)
            .json({ error: "Tags must be an array of strings." });
        }
        existing.tags = tags;
      }

      tasks.set(id, existing);
      return res.json(existing);
    }
  );

  app.delete(
    "/tasks/:id",
    (req: Request<{ id: string }>, res: Response<void | { error: string }>) => {
      const id = parseId(req.params.id);
      if (!id) {
        return res
          .status(400)
          .json({ error: "Task id must be a positive integer." });
      }

      if (!tasks.has(id)) {
        return res.status(404).json({ error: "Task not found." });
      }

      tasks.delete(id);
      return res.status(204).send();
    }
  );

  // Feature flags endpoint to check which features are enabled
  app.get("/feature-flags", async (req: Request, res: Response) => {
    const userContext = getUserContext(req);
    const flags = await getAllFeatureFlags(userContext);
    res.json({
      user: userContext,
      features: flags,
    });
  });

  return app;
};

export { createApp, Task };
