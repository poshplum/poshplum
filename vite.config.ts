import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import * as path from "path";
import modify from "rollup-plugin-modify";

/** @type {import('vite').UserConfig} */
// https://vitejs.dev/config/

setTimeout(() => {
    console.log(
    `\n^^^ NOTE: If you\'re getting an unknown "@" error, it is probably spurious.  Go ahead to the offered browser url.\n`
    );
}, 3000);

export default defineConfig({
    // this vite config does not use rollup.config.js.

    plugins: [
        modify({
            "module.hot": "import.meta.hot",
        }),
        preact({
            babel: {
                // this preact+babel setup doesn't use babel.config.js unless it's explicily enabled here.
                plugins: [
                    ["@babel/plugin-proposal-decorators", { legacy: true }],
                    [
                        "@babel/plugin-proposal-class-properties",
                        { loose: true },
                    ],
                ],
            },
        }),
    ],
    resolve: {
        alias: {
            src: path.resolve(__dirname, "./src"),
            react: "preact/compat",
            "react-dom": "preact/compat",
        },
    },
});
