import chalk from "chalk";
import createLogger from "pino";

import * as nothing from  "zoned-cls";//dist/zoned-cls.js";
if (42 < 41) nothing;

// import nothingElse from 'zoned-cls/dist/long-stack-trace-zone';
import { child_process } from "@platform/child_process";
import { os } from "@platform/os";
import { logDestination } from "@platform/logDestination";
const {localEnv} = logDestination;

import { hasStdOut } from "@platform/stdout";

const OPS_LEVEL =
    (("undefined" !== typeof process) && process.env.OPS_LEVEL && parseInt(process.env.OPS_LEVEL)) ||
    ("production" === process.env.NODE_ENV && 45) ||
    28;
const USER_ERROR_LEVEL = ("development" !== process.env.NODE_ENV && 32) || 42;

const usage1 = `usage: zonedLogger(loggerName, {...logDetails}) 

Returns a logger derived from the current zone.  With no arguments,
it simply returns the current zone's logger as-is.  

When one or 2 arguments are provided, it uses the zone's logger to
create a child logger with the indicated log-facility. Any provided 
logDetails are added to the new logger and will be included with 
all the log entries.  The 'pino' library is used for the logger object.

The current zone's baseLogLevels and localLogLevels are consulted
to determine the level of logging is enabled for the child logger 
(localLogLevels takes precedent over baseLogLevels).  

If the log-facility doesn't have an explicit log-level set in these 
places, then 'default' is looked up in the same way to determine the 
effective log level (this is 'warn' by default, but can be overridden 
with the LOGGING key in process.ENV or, in browser, localStorage).

With zonedLogger(), no zone-fork is done, and no future zone-forks 
will inherit this child logger or its logDetails. Use forkZoneWithLogger() 
to make a new zone AND logger.
`;
// no need to show this in external docs:
// The third argument is only needed for the initial call, and that call
// is normally done by forkZoneWithLogger() - it's recommended to use it
// to initialize zoned logging.

// default level numbers from pino:
//
//   trace: 10,
//   debug: 20,
//   info: 30,
//   warn: 40,
//   error: 50,
//   fatal: 60

const usage2 = `usage: forkZoneWithLogger(loggerName, logProps: {
        levels: object (optional),
        addContext: string (recommended),
        ...logDetails
    }, zoneSettings: {
      name: zoneName, 
      ...zoneSpecs
    })

Creates a new child logger with the indicated logger name, forks
    a new zone with the indicated zone details, and returns the forked
    zone with the logger set in the zone's context properties.  Within
    functions executed in that zone, you can call zonedLogger() to fetch
    or derive a logger object.  
    
The parent logger is taken from Zone.current.get("logger").  For the 
    first, top-level call to forkZoneWithLogger, the logger is created 
    with default-log-levels taken from ENV.LOGGING 
    or localStorage.getItem('LOGGING'). 

The 'pino' library is used for the logger object.  All other conventions 
    provided by pino behave as indicated by that library.
    
Some custom log levels are included in the logger: 'progress' is designed
    to give visibility over the flow of execution without excessive 
    details; its numeric level of 25 is more detailed than 'info' but 
    less than 'debug'.  'userError', normally* at level 32, is more detailed 
    than 'error' but less than 'info'.  'ops', normally* at level 45, is
    intended for logging operational metrics.  The resulting enhanced 
    hiearchy of log levels, in INCREASING order of detail and DECREASING 
    order of their severity values, is (in production) as follows:
    
      fatal=60, error=50, ops=45, warn=40 (DEFAULT), 
          userError=32, info=30, progress=25, debug=20, trace=10
          
    By placing userError at higher severity than 'info', even the most
    cursory investigations at log-level=info will reveal any events
    in production that are attributable to "user error".  
    
    When userError events are generated in an API call, it is the API 
    client considered as "the user" here.  UI application code may 
    actually be at fault, but that consideration is outside the scope of 
    zonedLogger's visibility.

    * Note that when NODE_ENV is 'development',
    the numeric values of 'ops' and 'userError' are adjusted so that
    ops metrics don't cause distractions, and so that userError events
    are raised by default, similar to warnings for development-time
    transparency. The resulting hierarchy in development is as follows:
    
      fatal=60, error=50, userError=42, warn=40 (DEFAULT), 
          info=30, ops=28, progress=25, debug=20, trace=10

    Adjusting 'ops' severity in this way also allows developers to easily 
    validate ops events without needing to see 'progress' (use LOGGING=default:ops).
    
    ** In the "test" environment, userError has the same priority as it does 
    in production, so that tests for user-caused problems like an API call 
    that returns a 400-series response don't cause log noise.  
    Use LOGGING=‹facility›:info (or :userError) to show those events.  
    ops is at level 28 in test, just as it is in development: 

      fatal=60, error=50, warn=40 (DEFAULT), 
          userError=32, info=30, ops=28, progress=25, debug=20, trace=10

 
Any logDetails are added to the new logger, to be included with any 
    entries logged.  Any levels indicated can override "up-fork" levels 
    to increase logging details from the indicated log facilities.
    These overrides can't suppress details such as 'fatal' or 'warn', 
    or any other details implied by the default-log-levels configured 
    as described above.  

When new levels are provided, those levels are merged with the mentioned
    "up-fork" levels, and these merged levels are used to determine the
    effective logging level for the the provided loggerName.
    
      forkZoneWithLogger("myGoodLog", {levels:{myGoodLog: "progress"}})

‹levels› can be a string of "log:facility:‹level›,other:facility,...".  
    If a ‹level› is not provided on one of these, "info" is implied.
‹levels› can be an object of { "‹facility›": ‹level›|null|true }, 
    where a ‹level› of  null or "true" implies "info" level.
‹levels› cannot reduce the log level for any facility below the levels 
    indicated in the global logging config.
If ‹levels› has a "_message" key, the string in that key is emitted 
    with a "▒▒▒▒ log override ▒▒▒▒" warning message in the log, 
    which can ease back-tracking any log overrides that have been 
    configured.  When implementing a property-based logLevel= 
    configuration, such as in a model-indexing configuration, this
    technique is important to guide a developer to the place where
    their override is actually specified, instead of to the line of code
    that actually provides ‹levels› to any of the functions in this module.
    
The new zone is created with the indicated name, using the zoneSpecs 
    provided, and with the logger assigned to the zone's 'logger' property.
    To include additional properties in the forked zone, use the 
    'properties' entry in the zoneSpecs.
    
The function indicated in ‹run› or ‹runGuarded› in the forked zone is 
    called, and the result is returned to the caller.  If ‹run› or   
    
If ‹wrap› is specified instead, then the zone-wrapped function is simply
    wrapped and returned without being called.

`;

let logDest = logDestination();

const consoleLogging = !!parseInt(localEnv("CONSOLE_LOGGING"));
const toConsoleOnly = "42" === localEnv("CONSOLE_LOGGING");

const boundConsoleMethods = {
    log: console.log.bind(console),
    info: console.info.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
    debug: console.debug.bind(console),
};

function consoleActivity(
    {
        color,
        level,
        bg,
        withDetail = true,
        method = "log",
        icon = "",
        indent = "",
    },
    ...args
) {
    if (!consoleLogging) return;

    const extraAttrs = "object" === typeof args[0] ? args.shift() : {};
    let { detail, summary, icon: loggedIcon } = extraAttrs;
    if (loggedIcon) icon = loggedIcon;
    if (level && this.isLevelEnabled(level) && withDetail && detail)
        summary = null;
    let message = args.shift();

    if (indent) message = `${indent}${message}`;
    const [_, indented, pureMessage] = message.match(/^( *)(.*)/s);
    const indentString = "  " + indented;
    message = `${indented}${icon}${pureMessage}`;

    if (color) {
        if (child_process) {
            message = color(message);
        } else {
            message = "%c" + message;
            args.unshift(color);
        }
    }

    if (withDetail && detail) {
        args.push(detail);
        summary = null;
    }
    if (summary) {
        if ("function" == typeof summary) summary = summary();
        if ("object" == typeof summary) summary = JSON.stringify(summary);
        if (child_process) {
            message = `${message} ${chalk.blueBright(summary)}`;
        } else {
            message = `${message}%c ${summary}`;
            args.unshift("color:#01efef");
        }
    }
    if (withDetail && !summary) {
        let { chindings } = this;
        let objects = chindings ? [chindings] : [];

        let parent = Object.getPrototypeOf(this);
        while (parent && parent.chindings) {
            objects.unshift(parent.chindings);
            parent = Object.getPrototypeOf(parent);
        }
        if (objects.length) {
            let moreDetail = {};
            for (detail of objects.reverse()) {
                if (detail.processName) continue;
                moreDetail = { ...moreDetail, ...detail };
            }
            delete moreDetail.context;
            if (Object.keys(moreDetail).length) args.push(moreDetail);
        }
    }

    if (child_process) {
        message = `${message} ${bg(" " + this.loggerName + " ")}`;
    } else {
        message = `${message} %c${this.loggerName}`;
        child_process && args.unshift(bg);
    }

    if (!method) debugger;
    if (!boundConsoleMethods[method]) debugger;
    if (hasStdOut) {
        hasStdOut([
            message,
            " ",
            ...args
                .map((a) => {
                    if ("string" === typeof a) return chalk.blueBright(a);
                    if ("undefined" === typeof a)
                        return chalk.blueBright("‹undefined›");
                    const shorty = JSON.stringify(a);
                    if (shorty.length < 160) return chalk.blueBright(shorty);
                    return JSON.stringify(a, null, indentString);
                })
                .join(" "),
        ]);

        return;
    }
    return boundConsoleMethods[method](message, ...args);
}

function consoleOnly(...args) {
    if (!consoleLogging) return;

    this.consoleActivity(
        {
            color: chalk.blue,
            bg: chalk.black.bgBlueBright,
        },
        ...args
    );
}

function noConsoleError() {
    throw new Error(
        `there is no consoleError method - use logger.error() or logger.consoleWarn()`
    );
}

function consoleInfo(...args) {
    if (child_process) {
        if (!toConsoleOnly) this.info(...args);
    } else {
        return browserLogWriter.write.info.call(this, ...args);
    }
    if (!consoleLogging) return;

    const withDetail = this.isLevelEnabled("progress");
    this.consoleActivity(
        {
            level: "info",
            withDetail,
            method: "log", // in firefox Developer Tools, this is distinguishably less info than progress@info level is.
            color: child_process ? chalk.green : "color:#f99",
            bg: child_process
                ? chalk.bgGreen.black
                : "background:#f99;color:#black",
        },
        ...args
    );
}

// function logLandmark(id, {...details}, message) {
//     // ...notify test observer
// }
//
// function mockPointLog(id, {...details}, message) {
// }
//
// function mockPoint(id) {
//     return function(decoratedMethod) {
//         return function(...args) {
//           const {mockPredicate, mockValue} = logObserver.hasMockFor(id);
//               if (mockPredicate && mockPredicate(...args)) { ... }
//                   if (mockValue) { return mockValue };
//             decoratedMethod(...args)
//         }
//     }
// }
//
// @mockPoint("abc123")
// function foo(...args) {
//
// }
//
// function doSomeTest() {
//     logObserver.addMock("abc123", {mockPredicate({url}) { return true if "/user/42" == url }, mockValue: {name: "joe"} })
//
//       ...
// }

function consoleProgress(...args) {
    if (child_process) {
        if (!toConsoleOnly) this.progress(...args);
    } else {
        return browserLogWriter.write.progress.call(this, ...args);
    }
    if (!consoleLogging) return;

    const withDetail = this.isLevelEnabled("debug");

    this.consoleActivity(
        {
            level: "progress",
            withDetail,
            color: child_process ? chalk.magentaBright : "color:#f6e",
            bg: child_process
                ? chalk.bgMagentaBright.black
                : "background: #f6e;color:black",
            method: "info", // lets more serious "debug" messages,
            // from logger.debug(), be filtered out in Chrome dev tools
            //   while the color and indent distinguish these in-between messages
            // FF developer tools can just filter the "info" level directly (= progress+consoleProgress)
            indent: "  ",
        },
        ...args
    );
}

function consoleWarn(...args) {
    if (!child_process) {
        return browserLogWriter.write.info.call(this, ...args);
    } else {
        if (!toConsoleOnly) this.warn(...args);
    }
    if (!consoleLogging) return;

    this.consoleActivity(
        {
            color: child_process ? chalk.yellowBright : "color:#ffc",
            bg: child_process
                ? chalk.bgYellowBright.black
                : "background: #ffc;color:black",
            withDetail: true,
            level: "info", // this is a convenient lie, allowing {summary} to be emitted unless a higher log level is enabled,
            //  (because `warn` is ALWAYS enabled)

            method: "warn", // lets more serious "debug" messages,
            // from logger.debug(), be filtered out in Chrome dev tools
            //   while the color and indent distinguish these in-between messages
            // FF developer tools can just filter the "info" level directly (= progress+consoleProgress)
            icon: "⚠ ",
        },
        ...args
    );
}

// logs console messages (or 'progress' log events) exactly like consoleProgress,
// except only if 'info' level has been requested.  This provides a good middle
// ground for diagnostics:
//   * allows progress to be displayed conditionally (instead of
//     unconditionally with consoleProgress)
//   * but in a distinctive way from info, with implicit indentation
//     for the console output
//   * when 'progress' level is enabled and console-logging is disabled,
//     this is just emitted as a progress event.
function progressInfo(...args) {
    if (this.isLevelEnabled("info")) {
        if (child_process) {
            if (!toConsoleOnly) return this.progress(...args);
            this.consoleProgress(...args);
        } else {
            return browserLogWriter.write.progressInfo.call(this, ...args);
        }
    
        // consoleProgress does emit this.progress(...) ALSO.
        // vvvv   hence the else
    } else {
        this.progress(...args);
    }
}

function bannerInfo(msg) {
    this.consoleInfo(
        chalk.bgBlue.bold.black(
            "                            ===============================================\n" +
                `                            =================== ${msg}  \n` +
                "                            ==============================================="
        )
    );
}

const browserTransport = {};
function browserConsoleLogger(
    defaultConsoleMethod,
    options={}
) {
    const {
        icon = "",
        postIcon = "",
        style,
        indent="",
        detail: withDetail=true
    } = options;

    defaultConsoleMethod = browserConsoleLogger._methods[defaultConsoleMethod] =
        browserConsoleLogger._methods[defaultConsoleMethod] ||
        console[defaultConsoleMethod].bind(console);

    return function (...args) {
        const extraAttrs =
            "object" === typeof args[0] && (args[0].detail || args[0].summary)
                ? args.shift()
                : {};
        let { 
            detail, summary,
            consoleMethod : cmOverride,
            indent: space=indent,
         } = extraAttrs;
         
         let message = "string" === typeof args[0] ? args.shift() : "";
         let [...rest] = args;

         let consoleMethod = cmOverride ? (
            browserConsoleLogger._methods[cmOverride] =
                browserConsoleLogger._methods[cmOverride] ||
                console[cmOverride].bind(console)
         ) : defaultConsoleMethod

         let { chindings } = this;

        let objects = chindings ? [chindings] : [];
        let parent = Object.getPrototypeOf(this);
        while (parent && parent.chindings) {
            objects.unshift(parent.chindings);
            parent = Object.getPrototypeOf(parent);
        }

        if (withDetail) {
            if (detail) {
                objects.unshift(detail);
            } else if (summary) objects.unshift(summary);
        } else {
            if (summary) {
                objects.unshift(summary);
            } else if (detail) objects.unshift(detail);
        }

        if (style) {
            message = `%c ${message}`;
            rest.unshift(style);
        }
        rest.unshift(
            "margin:-0.1em 0 -0.2em 0;font-size:80%;" +
                "display:inline-block;vertical-align:top;background-color:#333;" +
                "border:1px solid #333;color:#999;padding:2px;border-radius:3px;min-width:25ch",
            "noStyle"
        );
        return consoleMethod(
            `${space}%c${icon || " "}${this.loggerName} ${postIcon}%c ${message || ""}`,
            ...rest,
            ...objects
        );
    };
}
browserConsoleLogger._methods = {};

const browserLogWriter = {
    write: {
        noop() {},
        progress: browserConsoleLogger("info",
            { icon: "📍 ", style: "color: #f6e", detail: true}),
        progressInfo: browserConsoleLogger("debug", {
             indent: "    ", icon:"📍 ", postIcon: "ℹ️", style: "color: #f6e"}),
        info: browserConsoleLogger("info", {
            icon: "ℹ️ ", style:"color: #aaf"
        }),
        ops: browserConsoleLogger("debug", {icon: "⏱️ ", detail: true}),
        userError: browserConsoleLogger("error", {}),
        warn: browserConsoleLogger("warn", {detail: true}),
        error: browserConsoleLogger("error", {detail: true}),
        debug: browserConsoleLogger("debug", {
            indent: "   ", style: "color: #99f", detail: true
        }),
    },
};

// pretty-print automatically in browser.
// NOTE: For server-side, dev-time pretty-logging,
// pipe development servers to `yarn prettyLog`, the way the `devServer` script does
const prettyPrint = child_process
    ? null
    : {
          levelFirst: true,
          ignore: "hostname,pid",
          translateTime: "SYS:HH:MM:ss.l",
      };
const essentialLogSettings = {
    //  nestedKey: "d",  // doesn't work on base log attributes;
    //     (only applies to attrs in log calls like logger.<logLevel>({attrs}, "message") )

    customLevels: {
        ops: OPS_LEVEL,
        userError: USER_ERROR_LEVEL,
        progress: 25,
    },
    // useLevelLabels: true,
    prettyPrint,
    base: child_process
        ? {
              env: process.env.NODE_ENV || "development",
              pid: process.pid,
              hostname: os.hostname(),
              type: "log",
          }
        : {
              type: "log",
              env: "browser",
          },
    ...(child_process
        ? {}
        : {
              browser: {
                  asObject: true,
                  ...browserLogWriter,
                  ...browserTransport,
              },
          }),
};

const rootLogger = createLogger(
    { name: "root", ...essentialLogSettings },
    logDest
);

if (!rootLogger.userError || !rootLogger.levels.values.userError) {
    rootLogger.levels.values["userError"] = USER_ERROR_LEVEL;
    rootLogger.levels.labels[`${USER_ERROR_LEVEL}`] = "userError";
    rootLogger.userError = rootLogger.error;
}
if (!rootLogger.ops || !rootLogger.levels.values.ops) {
    rootLogger.levels.values["ops"] = OPS_LEVEL;
    rootLogger.levels.labels[`${OPS_LEVEL}`] = "ops";
    rootLogger.ops = rootLogger.error;
}
if (!rootLogger.progress || !rootLogger.levels.values.progress) {
    rootLogger.levels.values["progress"] = 25;
    rootLogger.levels.labels["25"] = "progress";
    rootLogger.progress = rootLogger.info;
}
if (!rootLogger.isLevelEnabled) {
    rootLogger.isLevelEnabled = isLevelEnabled;
}
function isLevelEnabled(logLevel) {
    const { values } = this.levels;
    const targetLogValue = values[logLevel];
    const actualLogValue = values[this._level || this.level];
    return targetLogValue !== undefined && targetLogValue >= actualLogValue;
}

rootLogger.consoleActivity = consoleActivity;
rootLogger.consoleOnly = consoleOnly;
rootLogger.consoleInfo = consoleInfo;
rootLogger.consoleError = noConsoleError;
rootLogger.consoleWarn = consoleWarn;
rootLogger.consoleProgress = consoleProgress;
rootLogger.progressInfo = progressInfo;
rootLogger.bannerInfo = bannerInfo;

const { default: defaultLevel = "warn", ...defaults } = logLevelStringToObj(
    localEnv("LOGGING") || "",
    rootLogger
);
if (hasStdOut) {
    hasStdOut([
        chalk.blue(`zonedLogger: default log levels: `),
        JSON.stringify({ defaultLevel, ...defaults }),
    ]);
} else {
    console.log(`zonedLogger: default log levels: `, {
        defaultLevel,
        ...defaults,
    });
}

defaults["log:overrides"] = "info";

if (rootLogger.levels.values[defaultLevel] > rootLogger.levels.values["warn"]) {
    throw new Error(
        `disallowing requested default log level ${defaultLevel}.  Warnings are important, yo...`
    );
}
rootLogger.baseLogLevels = { default: defaultLevel, ...defaults };
rootLogger.level = defaultLevel;

// these 2 functions have various entry points:
// 1. from a startup script, which a) imports some libraries
//    and b) calls forkZoneWithLogger(), then runs a function in
//    that zone.
// 2. from within the zone, in a library which calls zonedLogger()
//    - normally from within (1b)
// 3. while loading imports in (1a), a library calls zonedLogger()
// 4. from other code such as React, where there may be no current
//    zone in scope, but that code has another way of determining
//    a parentZone and provides it through args
//
// In cases 2 & 4, we can make a child logger from the logger inherited
// from the zone created in (1b).  In case 3, we need to construct
// such a zone out of thin air like in case 1... without calling
// back into zonedLogger()
//
// Solution: ensure that case 1 doesn't rely on zonedLogger(), which
//   frees zonedLogger() to call forkZone...

let initZone;
export function contextLogger(loggerName, logProps = {}) {
    if (logProps.addContext)
        throw new Error(
            `use zonedLogger to add context with logProps.addContext`
        );

    return zonedLogger(loggerName, { ...logProps, addContext: null });
}

export function zonedLogger(loggerName, logProps = {}) {
    let {
        parentZone = Zone.current, // when provided, this is case 4.
        addContext,
        ...otherLogProps
    } = logProps;
    if (addContext && !Array.isArray(addContext)) {
        addContext = [addContext];
    }

    if (!parentZone) debugger;

    const filteredParentContext = (() => {
        try {
            return (parentZone.get("context") || []).filter(
                (x) => !x.chainedFrom
            );
        } catch (e) {
            debugger;
        }
    })();

    if (!otherLogProps.context && (addContext || addContext !== null)) {
        if (!addContext && addContext !== null && parentZone.get("context")) {
            debugger;
            zonedLogger("zone:context", { addContext: null }).consoleWarn(
                {
                    detail: {
                        loggerName,
                        parentContext: parentZone.get("context"),
                    },
                    summary: new Error(`here`).stack
                        .split("\n")
                        .slice(2)
                        .join("\n"),
                },
                `zonedLogger: no addContext in logProps; retaining parentZone's context. \n` +
                    `Use addContext: "identifying label" to ensure your requested logger reflects your real context\n` +
                    `   or use contextLogger() or addContext: null, to suppress this message.`
            );
        }
    }
    if (!otherLogProps.context) {
        otherLogProps.context = [
            ...filteredParentContext,
            ...(addContext || []),
        ];
    }

    if (!parentZone.parent || !parentZone.get("logger")) {
        // case 3

        parentZone = initZone =
            initZone ||
            forkZoneWithLogger(loggerName, otherLogProps, { name: "‹init›" });
        // not really the current zone, but close enough during case 3.
    } // else -> case 2
    const parentLogger = parentZone.get("logger");

    // let {levels: logLevels={}, ...logSettings} = (logProps) || {};
    // if ("string" == typeof logLevels) logLevels = stringToObj(logLevels);

    // const contextLogLevels = Zone.current.get("logLevels") || {};
    // const baseLogLevels = Zone.current.get("baseLogLevels") || parentLogger.baseLogLevels;

    // const nextContextLevels = {
    //   ...contextLogLevels,
    //   ...withMinimumLevels(baseLogLevels, logLevels, parentLogger)
    // };
    // const logger = parentLogger.child({name:loggerName,
    //   ...logSettings
    // });
    if (!loggerName) debugger;
    otherLogProps.parentZone = parentZone;
    const logger = mkLogger(parentLogger, loggerName, otherLogProps);

    return logger;
}
function mkLogger(parentLogger, loggerName, logProps) {
    let {
        parentZone,
        levels: logLevels = {},
        options,
        ...moreLogSettings
    } = logProps || {};

    if (!parentZone)
        throw new Error(
            "mkLogger EXPECTS logProps (in arg 3) to have a parentZone"
        );

    if ("string" == typeof logLevels)
        logLevels = logLevelStringToObj(logLevels, parentLogger);

    const contextLogLevels = parentZone.get("localLogLevels") || {};
    // console.warn(`##### context levels `, contextLogLevels)
    const baseLogLevels =
        parentZone.get("baseLogLevels") || parentLogger.baseLogLevels;
    // console.warn(`##### base levels`, baseLogLevels)

    const nextContextLevels = Object.keys(logLevels).length
        ? {
              ...contextLogLevels,
              ...withMinimumLevels(
                  baseLogLevels,
                  {
                      ...contextLogLevels,
                      ...logLevels,
                  },
                  parentLogger
              ),
          }
        : { ...baseLogLevels, ...contextLogLevels };
    // console.warn(`##### next context levels`, nextContextLevels)

    let logger = createLogger(
        { name: loggerName, ...essentialLogSettings, ...options },
        logDest
    );
    logger.loggerName = loggerName;
    logger.level =
        nextContextLevels[loggerName] ||
        nextContextLevels.default ||
        parentLogger.level;
    const { child: originalChild } = logger;
    logger.child = function (loggerNameOrBindings, otherBindings) {
        let logProps;
        let loggerName;
        if (
            typeof loggerNameOrBindings === "string" ||
            loggerNameOrBindings instanceof String
        ) {
            if (!this.zone)
                throw new Error(
                    `Developer error: can't use child(loggerName) on a logger without a zone`
                );

            loggerName = loggerNameOrBindings;
            logProps = otherBindings || {};
            logProps.parentZone = this.zone;
            return contextLogger(loggerName, logProps);
        } else if (loggerNameOrBindings.name) {
            if (!this.zone)
                throw new Error(
                    `Developer error: can't use child({name}) on a logger without a zone`
                );

            const { name, ...otherLogProps } = loggerNameOrBindings;
            loggerName = name;
            logProps = otherLogProps;
            logProps.parentZone = this.zone;
            return contextLogger(loggerName, logProps);
        }

        if (otherBindings)
            throw new Error(
                `Developer error: child(bindings), child(loggerName, bindings): only one bindings args allowed`
            );

        const { parentZone, ...bindings } = loggerNameOrBindings;
        if (parentZone) debugger;
        const result = originalChild.call(this, bindings);

        result.loggerName = this.loggerName;
        result.chindings = bindings;

        return result;
    };
    let enhancedLogProps = { ...parentLogger.chindings, ...moreLogSettings };

    logger = logger.child(enhancedLogProps);
    logger.consoleLogging = consoleLogging;

    if (!logger.isLevelEnabled) logger.isLevelEnabled = isLevelEnabled;
    if (!logger.hasOwnProperty("userError")) {
        logger.levels.values["userError"] = USER_ERROR_LEVEL;
        logger.levels.labels[`${USER_ERROR_LEVEL}`] = "userError";
        logger.userError = child_process
            ? logger.error
            : logger.isLevelEnabled("userError")
            ? browserLogWriter.write.error
            : browserLogWriter.write.noop;
    }
    if (!logger.hasOwnProperty("ops")) {
        logger.levels.values["ops"] = OPS_LEVEL;
        logger.levels.labels[`${OPS_LEVEL}`] = "ops";
        logger.ops = child_process
            ? logger.error
            : logger.isLevelEnabled("ops")
            ? browserLogWriter.write.ops
            : browserLogWriter.write.noop;
    }
    if (!logger.hasOwnProperty("progress")) {
        logger.levels.values["progress"] = 25;
        logger.levels.labels["25"] = "progress";
        // if (logger.level == "progress") debugger
        logger.progress = child_process
            ? logger.info
            : logger.isLevelEnabled("progress")
            ? browserLogWriter.write.progress
            : browserLogWriter.write.noop;
    }

    logger.consoleOnly = consoleOnly;
    logger.consoleError = noConsoleError;
    logger.consoleWarn = consoleWarn;
    logger.consoleInfo = consoleInfo;
    logger.progressInfo = progressInfo;
    logger.bannerInfo = bannerInfo;
    logger.consoleProgress = consoleProgress;
    logger.consoleActivity = consoleActivity;

    return logger;
}

export function withExceptionsAsWarnings(proto, fieldName, descriptor) {
    const { value: wrappedFunction } = descriptor;

    descriptor.value = function exceptionToWarning(...args) {
        return Zone.current.runWithWarnings(wrappedFunction, this, args);
    };
    return descriptor;
}

export function addsContext(contextName, argsOrBadFieldName, badDescriptor) {
    const usageMessage = `usage: @addsContext(contextName) someMethod(...)`;
    let useFn = false;
    let loggerName;
    if ("string" === typeof argsOrBadFieldName) {
        throw new Error(usageMessage);
    } else if (argsOrBadFieldName) {
        loggerName = argsOrBadFieldName.loggerName;
    }
    if ("function" === typeof contextName) {
        useFn = true;
    } else if ("string" !== typeof contextName) {
        throw new Error(usageMessage);
    }
    return function txnDefinition(proto, fieldName, descriptor) {
        const { value: wrappedFunction } = descriptor;
        if ("function" !== typeof wrappedFunction) {
            throw new Error(usageMessage);
        }

        descriptor.value = function wrappedWithContext(...args) {
            const contextLabel = useFn
                ? contextName.apply(this, args)
                : contextName;
            const location = new ZonedStackTrace();
            const zone = loggerName
                ? forkZoneWithContext(contextLabel, {
                      loggerName,
                      properties: { location },
                  })
                : forkZoneWithContext(contextLabel, {
                      properties: { location, contextLabel },
                  });
            // zone.get("logger").info(`running ${fieldName} in wrapped context ${contextLabel}`)

            return zone.run(wrappedFunction, this, args);
        };
        // descriptor.value.name = ("wrapped_wContext_" + wrappedFunction.name);

        return descriptor;
    };
}

//! it can wrap non-class-method functions directly using functionWithContext()
const functionWithContextUsage = `usage: const wrappedFunc = functionWithContext(contextName, {loggerName}) ( innerFunc );`;
export function functionWithContext(contextName, { loggerName } = {}) {
    return function (wrappedFunction) {
        let useFn = false;
        if ("function" === typeof contextName) {
            useFn = true;
        } else if ("string" !== typeof contextName) {
            throw new Error(functionWithContextUsage);
        }

        return function wrappedWithContext(...args) {
            const contextLabel = useFn
                ? contextName.apply(this, args)
                : contextName;
            const location = new ZonedStackTrace();
            const zone = loggerName
                ? forkZoneWithContext(contextLabel, {
                      loggerName,
                      properties: { location },
                  })
                : forkZoneWithContext(contextLabel, {
                      properties: { location, contextLabel },
                  });
            // zone.get("logger").info(`running ${fieldName} in wrapped context ${contextLabel}`)

            return zone.run(wrappedFunction, this, args);
        };
    };
}

export function forkZoneWithContext(
    addContext,
    { loggerName, logProps = {}, ...zoneDetails } = {}
) {
    // const baseContext = Zone.current.get("context") || [];
    let { name, properties = {}, ...otherZoneSettings } = zoneDetails;
    if (!name) name = addContext;
    if (properties.context)
        throw new Error(
            `forkZoneWithContext: invalid use of arg2 {properties.context}'; just provide an incremental context string in arg 1`
        );

    let enhancedLogProps = logProps;
    if (!loggerName) {
        const currentLogger = Zone.current.get("logger");
        if (!currentLogger) {
            if ("test" === process.env.NODE_ENV) {
                loggerName = "test";
            } else
                throw new Error(
                    `forkZoneWithContext: without existing parent context: {loggerName} required in arg2`
                );
        } else {
            loggerName = currentLogger.loggerName;
        }
        const chindings = (currentLogger && currentLogger.chindings) || {};
        enhancedLogProps = { ...chindings, ...logProps };
    }

    // const context = [...baseContext, addedContext];

    const zone = forkZoneWithLogger(loggerName, enhancedLogProps, {
        name,
        properties: {
            ...properties,
            addContext,
        },
        ...otherZoneSettings,
    });
    const txnId = zone.get("txnId");
    const label = txnId ? ` ${txnId}` : "";
    zone.get("logger").progressInfo(
        { summary: `${label}: ${addContext}`, consoleMethod: "debug" },
        `+task`
    );
    return zone;
    // return Zone.current.fork({
    //   name,
    //   properties: {
    //     context,
    //     ...properties
    //   },
    //   ...otherZoneSettings
    // });
}

// decorator for methods to enable log levels
export function withLogLevels(levels, contextLabel = "") {
    return function (proto, methodName, descriptor) {
        const inner = descriptor.value;
        descriptor.value = function (...args) {
            const name = methodName + "()";
            const className = this.constructor.name;
            debugger;
            const addContext = contextLabel || name;
            const z = forkZoneWithLogger(
                "withLogLevels",
                {
                    levels: {
                        _message: `@withLogLevels() decorator on ${className}#${name}`,
                        ...levels,
                    },
                    addContext,
                },
                { name, addContext }
            );

            return z.run(inner, this, args);
        };
        return descriptor;
    };
}

export function forkZoneWithLogger(loggerName, logProps, zoneDetails) {
    // parentZone is provided when in case 4
    const {
        name,
        parentZone = Zone.current,
        properties: { addContext, ...zoneProperties } = {},
        ...otherZoneSettings
    } = zoneDetails || {};

    let parentLogger = parentZone.get("logger");

    let { levels: logLevels, ...logSettings } = logProps || {};
    if (addContext) {
        const outerContext = parentZone.get("context") || [];
        zoneProperties.context = [...outerContext, addContext];
    }

    if (zoneProperties.context) {
        logProps.context = [...zoneProperties.context];
        if (logProps.context[0].chainedFrom) {
            logProps.context = logProps.context.slice(1);
        }
    }

    let logger;
    if (!parentLogger) {
        // case 1
        if (!zoneDetails)
            throw new Error(
                `forkZoneWithLogger: missing required zone details.\n` + usage2
            );

        parentLogger = rootLogger;
        zoneProperties.baseLogLevels = rootLogger.baseLogLevels;
        logProps.parentZone = parentZone;

        // can't use zonedLogger yet... go straight to the source
        // todo: verify logSettings in a valid use-case.
        logger = mkLogger(rootLogger, loggerName, {
            ...logProps,
            ...logSettings,
        });
    } else {
        // case 3/4
        logProps.parentZone = parentZone;
        logger = zonedLogger(loggerName, logProps);
    }
    // !!! get from/merge with parent zone log localLogLevels
    if ("string" == typeof logLevels)
        logLevels = logLevelStringToObj(logLevels, parentLogger);

    zoneProperties.localLogLevels = logLevels;

    if (!name)
        throw new Error(
            `forkZoneWithLogger: no {name} property in zoneDetails.\n` + usage2
        );

    // logger.error({zoneProperties, zoneDetails }, "where am I?", new Error('stack'))

    const newZone = parentZone.fork({
        name,
        properties: { logger, ...zoneProperties },
        ...otherZoneSettings,
    });
    newZone.runWithWarnings = async function (
        task,
        applyThis,
        applyArgs,
        source
    ) {
        let zonedError;
        const running = this.run(async () => {
            const promise = task.apply(applyThis, applyArgs);
            if (!promise) {
                logger.consoleWarn(
                    {
                        summary:
                            (task.name || "‹anonymous func›") +
                            " in context: " +
                            ((zoneProperties.context &&
                                zoneProperties.context
                                    .filter((x) => "string" === typeof x)
                                    .reverse()
                                    .join("\n  ...in")) ||
                                ""),
                    },
                    `no promise returned from`
                );
                return promise;
            }
            return promise.catch((failed) => {
                zonedError = failed.stack && failed.zoned && failed;
                if (failed.stack && !zonedError) {
                    zonedError = new ZonedStackTrace(
                        failed.message ||
                            message.reason ||
                            JSON.stringify(failed)
                    ).inZone(this);
                    zonedError.setFilteredStack(failed.stack);
                }
                logger.consoleWarn(
                    {
                        summary: zonedError.message,
                        detail: { stack: zonedError.stack.split("\n") },
                    },
                    `exception in zoned task`
                );
                logger.consoleWarn(
                    `exception is converted to 'false'.  Remove  @withExceptionsAsWarnings to capture the exception upstream`
                );
                return false;
            });
        });
        await running; // let it run, but let the caller deal with the exception, so it doesn't need
        // to be raised as an uncaught exception here.
        if (zonedError) return new Promise((res, rej) => rej(zonedError));
        return running;
    };
    logger.zone = newZone;
    return newZone;
}

function logLevelStringToObj(str, logger) {
    const settings = str.split(",");
    const obj = {};
    for (const s of settings) {
        const tokens = s.split(":");
        if (tokens.length < 2 && !(tokens[0] || "")) continue;

        let level = tokens[tokens.length - 1];
        if (logger[level]) {
            tokens.pop();
        } else {
            level = "info";
        }
        const facility = tokens.join(":");
        if (logger.levels.values[level] > logger.levels.values["warn"]) {
            throw new Error(
                `invalid log level '${level}' for ${facility} - use 'warn' at least.`
            );
        }
        obj[facility] = level;
    }
    // console.log(str, "toObj -> ", obj)
    return obj;
}
function withMinimumLevels(minima, levels, logger) {
    const obj = { ...minima };
    const values = logger.levels.values;

    const { _message = "", ...requestedLevels } = levels;

    function metaLogger(logger) {
        const l = logger.child({ name: "zonedLogger" });
        if (!l.loggerName) l.loggerName = "zonedLogger";
        return l
    }

    function warnLoggingOverride(k, v) {
        const details = {
            indent: "        ",
            summary: _message
                ? `${k}=${v} by ${_message}`
                : `${k}=${v} at ${new Error("here").stack
                      .split("\n")
                      .slice(4)
                      .join("\n")}`,
        };
        metaLogger(logger).consoleWarn(details, `▒▒▒▒ log override ▒▒▒▒`);
    }

    for (let [k, v] of Object.entries(requestedLevels)) {
        if ("default" === k) {
            // higher levels means trying to suppress more sever messages :(
            if (values[levels.default] > values[minima.default]) {
                metaLogger(logger).warn(
                    `Using minimum level ${minima.default}, not levels.default=${levels.default}`
                );
                obj.default = minima.default;
            } else {
                warnLoggingOverride(k, v);
                obj.default = v;
                // defaultNumber = values[k];
            }
        } else {
            if (v === true || v === null) v = "info";

            if (!v)
                throw new Error(
                    `invalid falsey level provided for logger ${k}`
                );
            if (!values[v])
                throw new Error(
                    `invalid level '${v}' for logger ${k}; try one of (warn,userError,info,progress,debug,trace)`
                );
            if (values[v] > values["warn"])
                throw new Error(
                    `Invalid level '${v}' for logger ${k}: use 'warn' at least.`
                );
            const minimumAllowableLevel = minima[k] || minima.default;
            // larger values are worse severity, and trying to go larger with the target level
            // means the caller is trying to suppress some log messages that need to be shown to
            // comply with the environment-level setting:

            if (values[v] > values[minimumAllowableLevel]) {
                metaLogger(logger).warn(
                    `${k}: using minimum level ${minimumAllowableLevel}, not suggested level=${v}`
                );
                obj[k] = minimumAllowableLevel;
            } else {
                warnLoggingOverride(k, v);
                obj[k] = v;
            }
        }
    }
    return obj;
}

export class ZonedStackTrace extends Error {
    zoned = true;
    //! captures a stack trace without any special message
    static snapshot() {
        const zst = new this("stack snapshot");
        zst.isSnapshot = true;
        return zst;
    }

    //! converts an error to zoned, if needed
    static fromError(e) {
        if (e.zoned) return e;
        const zst = new this(e.message || e);
        zst.stack = e.stack;
        return zst;
    }
    constructor(...args) {
        super(...args);
        let splitStack = this.stack;
        this._zone = Zone.current;
        Object.defineProperty(this, "_stack", {
            enumerable: false,
            writable: true,
        });
        Object.defineProperty(this, "_zone", {
            enumerable: false,
            writable: true,
        });
        Object.defineProperty(this, "stack", {
            set(v) {
                this._stack = v;
            },
            get() {
                return this._stack || this.setFilteredStack(splitStack);
            },
        });
    }

    inZone(zone) {
        this._zone = zone;
        return this;
    }

    setStack(i) {
        this.setFilteredStack(i);
    }

    setFilteredStack(inputStack, defaultTrim) {
        //!!! put a mark-and-count logger on this to validate
        //  that no hot code paths use this... this can't not be
        //  a eyebrow-raiser w/r/t potential peformance problems.
        //  but, we measure.

        if (inputStack.match(/Maximum call stac/)) debugger;

        let s = inputStack.split("\n");
        //!!! HAVING EXTRA error message in stack?  -> consider using snapshot or switching to new ZonedStackTrace(message)
        if (this.isSnapshot) s = s.slice(2);

        const enhancedStack = s.filter((l) => {
            if (l.trim().match(/^at Generator\./)) return false;
            if (l.trim().match(/^at asyncGeneratorStep/)) return false;
            if (l.trim().match(/^at _next/)) return false;
            if (l.trim().match(/^at new ZoneAwarePromise/)) return false;
            if (l.trim().match(/^at processTicksAndRejections/)) return false;
            if (l.trim().match(/drainMicroTaskQueue/)) return false;
            if (l.trim().match(/zoned-cls-node/)) return false;
            if (l.trim().match(/^at Zone/)) return false;

            return true;
        });
        const z = this._zone || Zone.current;
        const contextLocation = z.get("location");
        const contextReversed = [...(z.get("context") || [])].reverse();
        // if (contextLocation && contextLocation !== this) {
        //   // todo: check if it's possible for the current zone to be different from the context zone, such that
        //   // there can be one or more contextLocations that are included in the local  context
        //   //   and not included in the contextLocation's stack info
        //
        //     enhancedStack.push(`[ from context ${contextReversed[0]} at location:`, contextLocation.stack, "]")
        // } else {
        for (const c of contextReversed) {
            if (c.chainedFrom) continue;
            if ("string" === typeof c)
                enhancedStack.push(`   [at async context ${c}]`);
            if (c.label)
                enhancedStack.push(
                    `   [at async context ${c.label} ${
                        c.id || "‹no context id›"
                    }]`
                );
        }
        // }

        return (this._stack = enhancedStack.join("\n"));
    }
}
