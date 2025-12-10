import {
  checkFeatureFlag,
  getAllFeatureFlags,
  FeatureFlags,
} from "../src/flags";

describe("Feature Flags", () => {
  describe("checkFeatureFlag", () => {
    it("returns a boolean value for a feature flag", async () => {
      const result = await checkFeatureFlag(FeatureFlags.TASK_PRIORITIES);
      expect(typeof result).toBe("boolean");
    });

    it("handles missing flags gracefully", async () => {
      const result = await checkFeatureFlag("non-existent-flag");
      expect(typeof result).toBe("boolean");
      // Should return false as default
      expect(result).toBe(false);
    });

    it("accepts user context", async () => {
      const userContext = {
        key: "test-user-123",
        name: "Test User",
        email: "test@example.com",
      };

      const result = await checkFeatureFlag(
        FeatureFlags.TASK_PRIORITIES,
        userContext
      );
      expect(typeof result).toBe("boolean");
    });

    it("uses default user context when not provided", async () => {
      const result = await checkFeatureFlag(FeatureFlags.TASK_PRIORITIES);
      expect(typeof result).toBe("boolean");
    });

    it("handles errors gracefully", async () => {
      // Even if something goes wrong, it should return a boolean
      const result = await checkFeatureFlag("any-flag");
      expect(typeof result).toBe("boolean");
    });
  });

  describe("getAllFeatureFlags", () => {
    it("returns an object with all feature flags", async () => {
      const flags = await getAllFeatureFlags();
      expect(typeof flags).toBe("object");
      expect(flags).not.toBeNull();
    });

    it("contains all defined feature flags", async () => {
      const flags = await getAllFeatureFlags();
      const expectedFlags = Object.values(FeatureFlags);

      expectedFlags.forEach((flagKey) => {
        expect(flagKey in flags).toBe(true);
      });
    });

    it("all flag values are boolean", async () => {
      const flags = await getAllFeatureFlags();

      Object.values(flags).forEach((value) => {
        expect(typeof value).toBe("boolean");
      });
    });

    it("accepts user context", async () => {
      const userContext = {
        key: "test-user-456",
        name: "Another User",
      };

      const flags = await getAllFeatureFlags(userContext);
      expect(typeof flags).toBe("object");
      expect(Object.keys(flags).length).toBeGreaterThan(0);
    });

    it("returns consistent keys for different users", async () => {
      const user1Flags = await getAllFeatureFlags({ key: "user1" });
      const user2Flags = await getAllFeatureFlags({ key: "user2" });

      expect(Object.keys(user1Flags).sort()).toEqual(
        Object.keys(user2Flags).sort()
      );
    });
  });

  describe("FeatureFlags enum", () => {
    it("contains expected flag names", () => {
      expect(FeatureFlags.TASK_PRIORITIES).toBe("task-priorities");
      expect(FeatureFlags.TASK_ANALYTICS).toBe("task-analytics");
      expect(FeatureFlags.ADVANCED_FILTERING).toBe("advanced-filtering");
      expect(FeatureFlags.TASK_SHARING).toBe("task-sharing");
    });
  });
});
