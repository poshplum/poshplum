import dts from "rollup-plugin-dts";
import typescript from "rollup-plugin-ts";
import commonjs from "@rollup/plugin-commonjs";
import replace from "@rollup/plugin-replace";

// not needed for browser
import externals from "rollup-plugin-node-externals";

import { join } from "path";
const modulePaths = [join(process.cwd(), "platform/browser/")];

// used for finding modules to bundle, using Node's resolution algo
import resolve from "@rollup/plugin-node-resolve";
import alias from "@rollup/plugin-alias";

const name = require("./package.json").main.replace(/\.js$/, "-browser");

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
const forcedExternals = [];

//! see rollup.browser.config.js for the browser build
const browserBundle = (config) => ({
    ...config,
    input: "./src/index-browser.ts",
    external: (id) => {
        if (bundledModules.includes(id)) return false;
        if (forcedExternals.includes(id)) return true;
        // console.warn("---ext detect ---", id)
        
        return !/^[./]/.test(id);
    },
});

const watchDeps = {
    name: "dev-deps",
    async buildStart() {
        this.addWatchFile("./rollup.browser.config.js");
    }
}

export default [
    browserBundle({
        plugins: [
            watchDeps,
            externals(),
            resolve({
                browser: true,
                modulePaths,
            }),
            replace({
                preventAssignment: true,
                'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
                'process.env.WIDE_OPEN_UNSAFE': JSON.stringify(process.env.WIDE_OPEN_UNSAFE || false),
            }),
            commonjs({
                include: "../../zoned-cls/dist/zoned-cls.js",
            }),
            typescript(),
        ],
        output: [
            {
                file: `${name}.js`,
                format: "cjs",
                sourcemap: true,
            },
            {
                file: `${name}.mjs`,
                format: "es",
                sourcemap: true,
            },
        ],
    }),
    browserBundle({
        plugins: [dts()],
        output: {
            file: `${name}.d.ts`,
            format: "es",
        },
    }),
];
