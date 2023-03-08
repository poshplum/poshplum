import { child_process } from "@platform/child_process";

import dotenv from 'dotenv'
const envFile = process.env.ENV_FILE;
const cfg = envFile ? dotenv.config({ path: envFile }) : {};
// import { configFromEnvironmentFile } from "@platform/Config";
// const config = configFromEnvironmentFile && configFromEnvironmentFile();

import createLogger from "pino";

  
export function logDestination() {
    const adapter = localEnv("DB_ADAPTER");
    if ("http" !== adapter) {
        // default destination (stdout) in development
        return createLogger.destination();
    } else {
        if (child_process && "development" === process.env.NODE_ENV) {
            if (!!parseInt(localEnv("SKIP_DB_LOGGING"))) {
                console.log(
                    `SKIPPING db logging due to SKIP_DB_LOGGING env variable (DEV notice)`
                );
                return createLogger.destination();
            }
        }

        const connectionURL = localEnv("DB_ROOT")
        const logDb = localEnv("DB_logs")
        const user = localEnv("DB_USERNAME")
        const pass = localEnv("DB_PASSWORD")
        const connectionString = connectionURL.replace(
            /^(http[s]?:\/\/)/,
            (match, prefix) => `${prefix}${user}:${pass}@`
        );
        console.log("spawning log/database bridge - " + __dirname);
        const dir =
            "development" === process.env.NODE_ENV ? "." : `${__dirname}/..`; // in production, node_modules rides next to server/  - not necessary for an important reason.
        debugger;
        const worker = child_process.spawn(
            `${dir}/node_modules/.bin/pino-couch`,
            ["--quiet", "-U", connectionString, "-d", logDb],
            {
                stdio: ["pipe", "inherit", "inherit"],
            }
        );
        return worker.stdin;
    }
}
logDestination.localEnv = localEnv;

function localEnv(key) {
    return process.env[key]
  }
