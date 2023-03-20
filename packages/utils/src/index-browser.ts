export {
    zonedLogger,
    forkZoneWithLogger,
    forkZoneWithContext,
    addsContext,
    contextLogger,
    withLogLevels,
    withExceptionsAsWarnings,
    ZonedStackTrace,
} from "./zonedLogger";

export { asyncDelay } from "./asyncDelay";
export { asyncSingletonMethod } from "./asyncSingletonMethod";
export { CryptoHelper } from "./CryptoHelper";
export { ensureProtoChainProp } from "./ensureProtoChainProp";
export { hasError, fixupFailure, isError } from "./hasError";
export { timeAgo, timeFuture, timeInterval } from "./timeAgo";
export { EMAIL_REGEX } from "./emailRegex";
export { StateMachine } from "./StateMachine";
// export { StateMachineNext } from "./StateMachineNext";

export {PlatformSubtleCrypto} from "../platform/browser/SubtleCrypto";
export {PlatformTextEncoder} from "../platform/browser/TextEncoder";
export {child_process} from "../platform/browser/child_process";
export { copyToClipboard } from "./copyToClipboard";

export {
    text2list,
    text2map,
    autobindMethods,
    autobind,
    withPrototype,
    fromEntries,
    enumeratedMap,
    sumObject,
} from "./misc";
