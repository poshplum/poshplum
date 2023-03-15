import dts from "rollup-plugin-dts";
import typescript from "rollup-plugin-ts";
import externals from "rollup-plugin-node-externals";
import resolve from "@rollup/plugin-node-resolve";

const sass = require("sass");
import postcss from "rollup-plugin-postcss";

const name = require("./package.json").main.replace(/\.js$/, "");

const bundledModules = [];
const forcedExternals = [];

const watchDeps = {
    name: "dev-deps",
    async buildStart() {
        this.addWatchFile("./rollup.config.js");
    }
}

const bundle = (config) => ({
    ...config,
    input: "src/index.ts",
    external: (id) => {
        if (bundledModules.includes(id)) return false;
        if (forcedExternals.includes(id)) return true;
        // console.warn("---ext detect ---", id)

        return !/^[./]/.test(id);
    },
});

const cssOpts = {
    extract: true,
    preprocessor: (content, id) =>
        new Promise((resolve, reject) => {
            // const result = sass.renderSync({ file: id });
            const result = sass.compile({ file: id });
            resolve({ code: result.css.toString() });
        }),
    sourceMap: true,

    extensions: [".scss", ".css"],
    // extract: "plum.css",
};

export default [
    // {
    //     input: "src/scss/app.scss",
    //     plugins: [postcss(cssOpts)],
    //     output: { file: "dist/plum.css" },
    // },
    // {
    //     input: "src/scss/plum.scss",
    //     plugins: [postcss(cssOpts)],
    //     output: {file: "dist/plum.css"},
    // },
    bundle({
        plugins: [
            watchDeps,
            externals(),
            resolve({ browser: true }),
            typescript({
                transpiler: {
                    typescriptSyntax: "typescript",
                    otherSyntax: "typescript", // "swc",
                },
                tsconfig(existing) {
                    // console.warn(existing)
                    return existing
                },
                swcConfig: {
                    "jsc": {
                        "parser": {
                          "syntax": "ecmascript",
                          "jsx": false,
                          "dynamicImport": false,
                          "privateMethod": false,
                          "functionBind": false,
                          "exportDefaultFrom": false,
                          "exportNamespaceFrom": false,
                          "decorators": true,
                          "decoratorsBeforeExport": true,
                          "topLevelAwait": false,
                          "importMeta": false,
                          "preserveAllComments": false
                        },
                        "transform": null,
                        "target": "es5",
                        "loose": false,
                        "externalHelpers": false,
                        // Requires v1.2.50 or upper and requires target to be es2016 or upper.
                        "keepClassNames": true
                      },
                      "isModule": false                                    },
            }),
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
    bundle({
        plugins: [dts()],
        output: {
            file: `${name}.d.ts`,
            format: "es",
        },
    }),
];
