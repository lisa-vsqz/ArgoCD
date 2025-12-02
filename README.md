# Tasks Microservice

A lightweight in-memory tasks microservice built with Express.js and TypeScript. The service exposes CRUD endpoints to manage tasks without any external persistence layer.

## Getting Started

```bash
npm install
npm run build
npm start
```

`npm start` recompiles the TypeScript sources before launching the compiled server from `dist/`. By default the server listens on `http://localhost:3000`. Set the `PORT` environment variable to override the port.

## API Endpoints

All endpoints emit and accept JSON. Task payloads use the following shape:

```json
{
  "id": 1,
  "title": "Example",
  "description": "Optional details",
  "completed": false
}
```

### `GET /tasks`
- Returns an array with all tasks currently stored in memory.

### `POST /tasks`
- Creates a new task.
- Required body fields: `title` (non-empty string).
- Optional fields: `description` (string), `completed` (boolean, defaults to `false`).
- Responds with `201 Created` and the persisted task.

### `GET /tasks/:id`
- Fetches a task by numeric identifier.
- Responds with `200 OK` and the task when found.
- Responds with `404 Not Found` when the task does not exist.

### `PUT /tasks/:id`
- Updates an existing task. Accepts any combination of `title`, `description`, and `completed` fields.
- All provided fields are validated; invalid values yield `400 Bad Request`.
- Responds with the updated task on success.

### `DELETE /tasks/:id`
- Removes a task by identifier.
- Responds with `204 No Content` on success.

## Validation Errors

- Non-numeric or non-positive IDs result in `400 Bad Request`.
- Missing or invalid payload fields also trigger `400 Bad Request` with an explanatory message.
- Requests for unknown tasks yield `404 Not Found`.

## Testing

Run the Jest test suite (uses ts-jest and Supertest for HTTP assertions):

```bash
npm test
```

Run ESLint checks:

```bash
npm run lint
```

## Notes

- Data is stored in memory per process; restarting the service clears all tasks.
- For persistence or multi-instance deployments, replace the in-memory storage with a database-backed repository.
