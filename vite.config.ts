import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import * as path from 'path';

/** @type {import('vite').UserConfig} */
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [preact({
        babel: {
            plugins: [
                ["@babel/plugin-proposal-decorators", { "legacy": true }],
                ["@babel/plugin-proposal-class-properties", { "loose" : true }]
            ]
        },
    }
    )],
    resolve: {
        alias: {
            'src': path.resolve(__dirname, './src'),
            react: "preact/compat",
            "react-dom": "preact/compat",
        }
    },
});
