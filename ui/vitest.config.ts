import { defineConfig, mergeConfig } from "vitest/config";
import path from "path";
import viteConfig from "./vite.config";

export default mergeConfig(
  viteConfig,
  defineConfig({
    resolve: {
      alias: {
        // @docker/extension-api-client only exports via the "browser" field,
        // which Vitest/jsdom cannot resolve. Point to the dist entry directly.
        "@docker/extension-api-client": path.resolve(
          __dirname,
          "node_modules/@docker/extension-api-client/dist/index.js",
        ),
      },
    },
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: "./src/test-setup.ts",
    },
  })
);
