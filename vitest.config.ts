import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    testTimeout: 15000,
  },
  define: {
    __APP_VERSION__: JSON.stringify("test-v1"),
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
