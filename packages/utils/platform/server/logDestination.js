import { child_process } from "@platform/child_process";
const {spawn} = child_process;

import dotenv from 'dotenv'
const envFile = process.env.ENV_FILE;
const cfg = envFile ? dotenv.config({ path: envFile }) : {};
// import { configFromEnvironmentFile } from "@platform/Config";
// const config = configFromEnvironmentFile && configFromEnvironmentFile();

import createLogger from "pino";

import { fileURLToPath } from 'url';
import path from 'path';
// const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(process.argv[1]);
// console.log(import.meta)
// debugger
const logger = fileURLToPath(await import.meta.resolve('pino-couch/pino-couch.js', `file://${process.argv[1]}`));


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

        const connectionURL = localEnv("DB_URL")
        const logDb = localEnv("DB_logs");


        const user = localEnv("DB_USERNAME")
        const pass = localEnv("DB_PASSWORD")
        const connectionString = connectionURL.replace(
            /^(http[s]?:\/\/)/,
            (match, prefix) => `${prefix}${user}:${pass}@`
        );
        const t = logger;  //!!! todo: cer49kn - why is this needed to prevent spawn() from getting incorrect args?
        console.log("spawning log/database bridge - " + t);

        const worker = spawn(
            `${t}`,  // cer49kn - also this!?!?
            // `${dir}/node_modules/.bin/pino-couch`,
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
