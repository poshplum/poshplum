import { defineConfig } from "vite";
import preact from "@preact/preset-vite";


// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
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
    // Enable these if you're creating a new templated package INSIDE the plum monorepo
    //         "@poshplum/utils": "utils/dist/utils.js",
    //         "@poshplum/ui": "ui/dist/ui.js",
    //         "@poshplum/server": "server/dist/server.js",
    //         "@poshplum/data": "data/dist/data.js",
    //         "@poshplum/data-pro": "data-pro/dist/data-pro.js",
            "@poshplum/poshplum": "poshplum/"

        },
    },
});
