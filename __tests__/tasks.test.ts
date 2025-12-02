import request from 'supertest';
import { createApp, Task } from '../src/app';

describe('Tasks API', () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    app = createApp();
  });

  it('creates a task and returns defaults when not provided', async () => {
    const createResponse = await request(app)
      .post('/tasks')
      .send({ title: 'First task' })
      .expect(201);

    expect(createResponse.body).toEqual({
      id: expect.any(Number),
      title: 'First task',
      description: '',
      completed: false,
    });

    const listResponse = await request(app).get('/tasks').expect(200);
    expect(listResponse.body).toEqual([createResponse.body]);
  });

  it('validates payload when creating a task', async () => {
    await request(app).post('/tasks').send({}).expect(400);
    await request(app).post('/tasks').send({ title: '' }).expect(400);
    await request(app).post('/tasks').send({ title: 'Valid', completed: 'yes' }).expect(400);
  });

  it('retrieves a task by id', async () => {
    const createResponse = await request(app)
      .post('/tasks')
      .send({ title: 'Lookup', description: 'Find me' })
      .expect(201);

    const { id } = createResponse.body as Task;

    const getResponse = await request(app).get(`/tasks/${id}`).expect(200);
    expect(getResponse.body).toEqual(createResponse.body);
  });

  it('responds with errors for invalid task ids', async () => {
    await request(app).get('/tasks/abc').expect(400);
    await request(app).get('/tasks/999').expect(404);
  });

  it('updates existing tasks with provided fields', async () => {
    const createResponse = await request(app)
      .post('/tasks')
      .send({ title: 'Update me', description: 'Before' })
      .expect(201);

    const { id } = createResponse.body as Task;

    const updateResponse = await request(app)
      .put(`/tasks/${id}`)
      .send({ title: 'Updated', completed: true })
      .expect(200);

    expect(updateResponse.body).toEqual({
      id,
      title: 'Updated',
      description: 'Before',
      completed: true,
    });
  });

  it('rejects updates without valid fields', async () => {
    const createResponse = await request(app)
      .post('/tasks')
      .send({ title: 'No-op' })
      .expect(201);

    const { id } = createResponse.body as Task;

    await request(app).put(`/tasks/${id}`).send({}).expect(400);
    await request(app).put(`/tasks/${id}`).send({ completed: 'yes' }).expect(400);
  });

  it('deletes tasks', async () => {
    const createResponse = await request(app)
      .post('/tasks')
      .send({ title: 'Remove me' })
      .expect(201);

    const { id } = createResponse.body as Task;

    await request(app).delete(`/tasks/${id}`).expect(204);
    await request(app).get(`/tasks/${id}`).expect(404);
  });
});
