import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["server/**/*.test.ts", "tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["server/**/*.ts"],
      exclude: [
        "server/**/*.test.ts",
        "server/**/*.d.ts",
        "server/index.ts",
        "server/config.ts",
        "server/db/**",
        "server/socket/**",
        "server/api/**",
        "server/shared/protocol.ts",
        "server/room/types.ts",
        "server/dice/types.ts",
      ],
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "./coverage",
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
  },
});
