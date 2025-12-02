import { createApp } from './app';

const rawPort = process.env.PORT;
const port = rawPort ? Number.parseInt(rawPort, 10) : 3000;
const PORT = Number.isFinite(port) && port > 0 ? port : 3000;

const app = createApp();

app.listen(PORT, () => {
  console.log(`Tasks service listening on port ${PORT}`);
});
