import express, { Request, Response } from 'express';

interface Task {
  id: number;
  title: string;
  description: string;
  completed: boolean;
}

interface CreateTaskPayload {
  title?: unknown;
  description?: unknown;
  completed?: unknown;
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

  app.get('/tasks', (_req: Request, res: Response<Task[]>) => {
    res.json(Array.from(tasks.values()));
  });

  app.get('/tasks/:id', (req: Request<{ id: string }>, res: Response<Task | { error: string }>) => {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'Task id must be a positive integer.' });
    }

    const task = tasks.get(id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    return res.json(task);
  });

  app.post('/tasks', (req: Request, res: Response<Task | { error: string }>) => {
    const { title, description, completed } = req.body as CreateTaskPayload;

    if (typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ error: 'Task title is required.' });
    }

    if (description !== undefined && typeof description !== 'string') {
      return res.status(400).json({ error: 'Task description must be a string when provided.' });
    }

    if (completed !== undefined && typeof completed !== 'boolean') {
      return res.status(400).json({ error: 'Task completed flag must be boolean when provided.' });
    }

    const normalizedDescription = typeof description === 'string' ? description.trim() : '';
    const normalizedCompleted = typeof completed === 'boolean' ? completed : false;

    const task: Task = {
      id: nextId++,
      title: title.trim(),
      description: normalizedDescription,
      completed: normalizedCompleted,
    };

    tasks.set(task.id, task);
    return res.status(201).json(task);
  });

  app.put('/tasks/:id', (req: Request<{ id: string }>, res: Response<Task | { error: string }>) => {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'Task id must be a positive integer.' });
    }

    const existing = tasks.get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    const { title, description, completed } = req.body as UpdateTaskPayload;
    const hasUpdatableField =
      title !== undefined || description !== undefined || completed !== undefined;

    if (!hasUpdatableField) {
      return res.status(400).json({ error: 'Provide at least one field to update.' });
    }

    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim() === '') {
        return res.status(400).json({ error: 'Task title must be a non-empty string.' });
      }
      existing.title = title.trim();
    }

    if (description !== undefined) {
      if (typeof description !== 'string') {
        return res.status(400).json({ error: 'Task description must be a string.' });
      }
      existing.description = description.trim();
    }

    if (completed !== undefined) {
      if (typeof completed !== 'boolean') {
        return res.status(400).json({ error: 'Task completed flag must be boolean.' });
      }
      existing.completed = completed;
    }

    tasks.set(id, existing);
    return res.json(existing);
  });

  app.delete('/tasks/:id', (req: Request<{ id: string }>, res: Response<void | { error: string }>) => {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'Task id must be a positive integer.' });
    }

    if (!tasks.has(id)) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    tasks.delete(id);
    return res.status(204).send();
  });

  return app;
};

export { createApp, Task };
