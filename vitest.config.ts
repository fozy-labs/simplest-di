import { fileURLToPath, URL } from "node:url";

import sharedConfig from "@fozy-labs/js-configs/vitest";
import { defineConfig, mergeConfig } from "vitest/config";

export default mergeConfig(
    sharedConfig,
    defineConfig({
        resolve: {
            alias: {
                "@": fileURLToPath(new URL("./src", import.meta.url)),
            },
        },
        oxc: {
            decorator: { legacy: true },
        },
        test: {
            coverage: {
                include: ["src/core/**", "src/react/**"],
            },
        },
    }),
);
