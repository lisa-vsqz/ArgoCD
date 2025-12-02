import LaunchDarkly from "launchdarkly-node-server-sdk";

const client = LaunchDarkly.init("sdk-9c5ff1c2-d81e-4dc5-9245-a89d1d4819f3");

export async function checkFeatureFlag(
  flagName: string,
  user = { key: "default" }
) {
  await client.waitForInitialization();
  const value = await client.variation(flagName, user, false);
  return value;
}
