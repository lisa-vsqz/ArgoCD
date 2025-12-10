import { createApp } from "./app";
import { checkFeatureFlag, FeatureFlags } from "./flags";

const rawPort = process.env.PORT;
const port = rawPort ? Number.parseInt(rawPort, 10) : 3000;
const PORT = Number.isFinite(port) && port > 0 ? port : 3000;

const app = createApp();

// Health check endpoint
app.get("/health", (_req, res) => {
  res
    .status(200)
    .json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Feature flag status endpoint
app.get("/feature-flags/status", async (_req, res) => {
  try {
    const flags = {
      [FeatureFlags.TASK_PRIORITIES]: await checkFeatureFlag(
        FeatureFlags.TASK_PRIORITIES
      ),
      [FeatureFlags.TASK_ANALYTICS]: await checkFeatureFlag(
        FeatureFlags.TASK_ANALYTICS
      ),
      [FeatureFlags.ADVANCED_FILTERING]: await checkFeatureFlag(
        FeatureFlags.ADVANCED_FILTERING
      ),
      [FeatureFlags.TASK_SHARING]: await checkFeatureFlag(
        FeatureFlags.TASK_SHARING
      ),
    };

    res.json({
      status: "Feature flags loaded successfully",
      flags,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: "Error loading feature flags",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Tasks service listening on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(
    `Feature flags status: http://localhost:${PORT}/feature-flags/status`
  );
  console.log(
    `Feature flags per user: http://localhost:${PORT}/feature-flags (with x-user-id header)`
  );
});
