import dts from "rollup-plugin-dts";
import typescript from "rollup-plugin-ts";
import externals from "rollup-plugin-node-externals";
import resolve from "@rollup/plugin-node-resolve";

const name = require("./package.json").main.replace(/\.js$/, "");

import { join } from "path";
const modulePaths = [join(process.cwd(), "platform/server/")];

const bundledModules = [
    "zoned-cls",
    "@platform/child_process",
    "@platform/Config",
    "@platform/logDestination",
    "@platform/os",
    "@platform/stdout",
    "@platform/os",
    "@platform/TextEncoder",
    "@platform/SubtleCrypto",
];
const forcedExternals = ["util"];

const watchDeps = {
    name: "dev-deps",
    async buildStart() {
        this.addWatchFile("./rollup.config.js");
    }
}


//! see rollup.browser.config.js for the browser build
const serverBundle = (config) => ({
    ...config,
    input: "src/index.ts",
    external: (id) => {
        if (bundledModules.includes(id)) return false;
        if (forcedExternals.includes(id)) return true;
        // console.warn("---ext detect ---", id)
        return !/^[./]/.test(id);
    },
});

export default [
    serverBundle({
        plugins: [
            watchDeps,
            externals(), 
            resolve({ modulePaths }), 
            typescript()
        ],
        output: [
            // {
            //     file: `${name}.js`,
            //     format: "cjs",
            //     sourcemap: true,
            // },
            {
                file: `${name}.mjs`,
                format: "es",
                sourcemap: true,
            },
        ],
    }),
    serverBundle({
        plugins: [dts()],
        output: {
            file: `${name}.d.ts`,
            format: "es",
        },
    }),
];
