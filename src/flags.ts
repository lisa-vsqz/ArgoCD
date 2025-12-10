import LaunchDarkly from "launchdarkly-node-server-sdk";

const client = LaunchDarkly.init(
  process.env.LAUNCHDARKLY_SDK_KEY || "sdk-9c5ff1c2-d81e-4dc5-9245-a89d1d4819f3"
);

// Feature flag names
export enum FeatureFlags {
  TASK_PRIORITIES = "task-priorities",
  TASK_ANALYTICS = "task-analytics",
  ADVANCED_FILTERING = "advanced-filtering",
  TASK_SHARING = "task-sharing",
}

// User context for LaunchDarkly
export interface UserContext {
  key: string;
  name?: string;
  email?: string;
  attributes?: Record<string, unknown>;
}

/**
 * Check if a feature flag is enabled for a user
 * @param flagName - The feature flag key
 * @param userContext - The user context (optional, defaults to anonymous)
 * @returns The feature flag value (boolean or default value)
 */
export async function checkFeatureFlag(
  flagName: string,
  userContext: UserContext = { key: "anonymous" }
): Promise<boolean> {
  try {
    await client.waitForInitialization();
    const value = await client.variation(flagName, userContext, false);
    return typeof value === "boolean" ? value : false;
  } catch (error) {
    console.error(`Error checking feature flag '${flagName}':`, error);
    return false;
  }
}

/**
 * Get all feature flag variations for a user
 * @param userContext - The user context
 * @returns Object with all feature flags and their values
 */
export async function getAllFeatureFlags(
  userContext: UserContext = { key: "anonymous" }
): Promise<Record<string, boolean>> {
  try {
    await client.waitForInitialization();
    const flags: Record<string, boolean> = {};

    for (const flagKey of Object.values(FeatureFlags)) {
      const value = await client.variation(flagKey, userContext, false);
      flags[flagKey] = typeof value === "boolean" ? value : false;
    }

    return flags;
  } catch (error) {
    console.error("Error getting all feature flags:", error);
    return Object.values(FeatureFlags).reduce(
      (acc, flag) => ({ ...acc, [flag]: false }),
      {}
    );
  }
}

/**
 * Get the LaunchDarkly client instance
 */
export function getLaunchDarklyClient() {
  return client;
}

export default { checkFeatureFlag, getAllFeatureFlags, getLaunchDarklyClient };
