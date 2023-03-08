import { contextLogger } from "./zonedLogger";

export function fixupFailure(failure) {
    if (!failure.reason) {
        if (failure.status) {
            failure.code = failure.status;
            delete failure.status;

            failure.reason = failure.message;
            delete failure.message;

            failure.error = failure.name;
            delete failure.name;

            return failure;
        }
        if (process.env.NODE_ENV !== "production") {
            failure.reason = failure.message || failure.stack;
            failure.error = "internal server error";
            failure.stack = failure.stack;
            failure.code = 500;
        }
    }
    return failure;
}

export async function hasError(promise) {
    try {
        // console.error("hasError awaiting promise", promise)
        let result = await promise;
        if (isError(result)) {
            // debug("<- hasError: true (non-thrown error)", result);
            return fixupFailure(result);
        }
        // debug("<- hasError: false");
        // console.error("hasError? seems good:", result)
        return false;
    } catch (err) {
        if (isError(err)) {
            // debug("<- hasError: true", err);
            return fixupFailure(err);
        } else {
            contextLogger("api:access").warn(
                "<- hasError: unexpected error type",
                err
            );

            return false;
        }
    }
}
export function isError(err) {
    if (err && "function" === typeof err.isError) return err.isError();
    if (err && (!!err.error || !!err.message || err instanceof Error))
        return true;
    if (err && err.reason)
        throw new Error(
            `after changing to using isError() detection, err.reason isn't enough to imply error - hoping for 'message' or 'error' attribute instead`
        );
}
