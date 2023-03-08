// collects any number of pending async callers, executes the function,
// and returns the result to all of the callers at the same time (actually
// returns one promise to each of them separately, and resolves that promise
// a single time)
//
// assists the singleton in cutting over between this call and next-call
// by providing a `releaseMe` function to the method implementation; this
// lets the implementation imperatively wait for additional callers, debouncing
// and coalescing their requests, then releasing the singleton block, which
// lets future callers start a fresh batch (with a fresh promise) while the
// first batch of requests finishes and resolves the initial single promise.
// The initial promise is remembered as a "ghost"; see below.
//
// When releaseMe() is used, a second batch of singleton callers is blocked
// until the prior batch (the ghost) is completed, thus serializing the calls.
// Possibly this should be an option, allowing separate batches to make progress
// at the same time.  If so, it may also be appropriate to store an index of
// these "ghost" instances for troubleshooting purposes - that, or to remove the
// ghosts entirely, to be sure we aren't causing memory leaks.
//
// If releaseMe is not called (or not used) by the singleton method, it is
// automatically resolved.  In this mode, callers 1..n all receive the single
// result from the first caller, and the next caller (n+1) will get a new
// promise and the singleton method will execute and resolve that new promise
// separately.
//
//
// Usage:
//   class Foo {
//     async fetchMyStuff() {  // simple implementation
//       return asyncSingletonMethod(this, "fetchMyStuff", async() => {
//         return fetch("/something")
//       })
//     }
//     async fetchOtherStuff(something) { // debounce + accumulate requests
//       this.stuff = this.stuff || []
//       this.stuff.push(something)
//       return asyncSingletonMethod(this, "fetchOtherStuff", async(release) => {
//         await delay(3);  // accumulate stuff from other calls to fetchOtherStuff
//         release()
//         const accumulatedStuff = this.stuff;
//         this.stuff = []; // let other stuff start accumulating
//         return fetch("/getStuff", {method:"post", body: JSON.stringify(accumulatedStuff), {headers: {accept:"application/json"}}})
//       })
//     }
//   }

export async function asyncSingletonMethod(ctx, name, fn) {
    ctx.aSing = ctx.aSing || { _gh: {} };
    let anotherCallToMe = ctx.aSing[name];
    if (anotherCallToMe) {
        // console.error(`aSing ${name} will return result of already-pending call.`)
        return await anotherCallToMe;
    }

    // this serializes potentially-overlapping calls to the method
    // that can happen when releaseMe() is called within the function
    let myGhost = ctx.aSing._gh[name];
    if (myGhost) {
        // console.error(`aSing ${name} waiting for my ghost`)
        await myGhost.catch((e) => {
            console.error(
                `aSing ${name} my ghost had an error.  That's probably bad!`
            );
        });
        // console.error(`aSing ${name} ok, my ghost is done`)
        delete ctx.aSing._gh[name];
    }
    let released = false;
    const myself = (ctx.aSing[name] = new Promise((res, rej) => {
        // console.error(`aSing ${name} calling through`)
        fn(releaseMe).then(res, rej);
    }));
    let resolved;
    let result, error;
    try {
        result = await myself;
    } catch (e) {
        error = e;
    }
    resolved = true;
    function releaseMe() {
        released = true;
        if (!resolved) ctx.aSing._gh[name] = myself;
        delete ctx.aSing[name];
    }
    if (!released) releaseMe();

    // let the caller's own error-handling prevail, returning a failed-promise
    //   in preference over directly throwing.
    return error ? myself : result;
}
