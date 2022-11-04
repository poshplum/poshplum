import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
/** @type {import('vite').UserConfig} */

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [preact()],
    loader: { '.js': 'jsx' },
    resolve: {
        alias: {
            react: "preact/compat",
            "react-dom": "preact/compat",
        }
    },
});
