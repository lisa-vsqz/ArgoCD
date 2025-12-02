import { createApp } from "./app";
import { checkFeatureFlag } from "./flags";

const rawPort = process.env.PORT;
const port = rawPort ? Number.parseInt(rawPort, 10) : 3000;
const PORT = Number.isFinite(port) && port > 0 ? port : 3000;

const app = createApp();

// --- Nueva ruta controlada por Feature Flag ---
app.get("/nueva-funcion", async (req, res) => {
  const enabled = await checkFeatureFlag("nueva-funcion");

  if (!enabled) {
    return res.status(403).send("Feature disabled");
  }

  res.send("Bienvenido a la nueva función");
});
// ---------------------------------------------

app.listen(PORT, () => {
  console.log(`Tasks service listening on port ${PORT}`);
});
