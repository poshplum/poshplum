import React from "react";

import { inheritName } from "../helpers/ClassNames";
import {
    EVENT_IS_LOOPING_MAYBE,
    Reactor,
    debugInt,
    elementInfo,
    eventDebug,
    logger,
    reactorTag,
    stdHandlers,
    trace,
} from "../Reactor";

//!!! todo: add typescript types and make eslint actually satisfied, not suppressed.
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function Listener(componentClass) {
    const componentClassName = componentClass.name;
    const displayName = inheritName(componentClass, "👂");
    trace(`listener creating subclass ${displayName}`);
    const clazz = class Listener extends componentClass {
        constructor(props) {
            super(props);
            this.state = this.state || {};
            this._listenerRef = React.createRef();
            this.listening = new Map();
        }
        get unlistenDelay() {
            throw new Error(
                "listeners must provide an instance-level property unlistenDelay, for scheduling listener cleanups"
            );
        }
        listen(
            eventName,
            handler,
            capture,
            { at, isInternal, bare, observer, returnsResult, isAsync }
        ) {
            logger(
                `${this.constructor.name}: each Listener-ish should explicitly define listen(eventName, handler), with a call to _listen(eventName, handler) in addition to any additional responsibilities it may take on for event-listening`
            );
            console.warn(
                `${this.constructor.name}: each Listener-ish should explicitly define listen(eventName, handler), with a call to _listen(eventName, handler) in addition to any additional responsibilities it may take on for event-listening`
            );
            return this._listen(eventName, handler, capture, {
                at,
                isInternal,
                bare,
                observer,
                returnsResult,
                isAsync,
            });
        }
        notify(event, detail = {}) {
            if (event instanceof Event) {
                throw new Error(
                    "notify() requires event name, not Event object"
                );
            }
            detail.single = true;
            event = this.eventPrefix() + event;
            eventDebug(`${this.name()}: notify '${event}':`, { detail });
            return this.trigger(event, detail, () => {});
        }
        trigger(event, detail, onUnhandled) {
            let { _reactorDidMount: mounted } = this.state || {};
            if (!this._listenerRef.current) {
                if (mounted) {
                    console.warn(
                        `attempt to dispatch '${event}' event after Reactor unmounted: ${
                            this.displayName || this.constructor.displayName
                        }}`,
                        { detail }
                    );
                    return;
                }
                if (event.type == "error") {
                    console.error(
                        "error from unmounted component: " +
                            event.detail.error +
                            "\n" +
                            event.detail.stack
                    );
                    return;
                }
            }
            if (this.constructor[reactorTag] && !mounted) {
                detail = event.detail && event.detail.stack;
                const name = this.wrappedName || this.name();
                Reactor.trigger(this._listenerRef.current, "error", {
                    error: `Reactor ${name} NOT honoring event '${
                        event.type || event
                    }' triggered prior to completion of mounting sequence: ${
                        detail || ""
                    }`,
                });
                return;
            }
            return Reactor.trigger(
                this._listenerRef.current,
                event,
                detail,
                onUnhandled
            );
        }
        actionResult(event, detail, onUnhandled) {
            let { _reactorDidMount: mounted } = this.state || {};
            if (mounted && !this._listenerRef.current) {
                console.warn(
                    `attempt to dispatch '${event}' event after Reactor unmounted: ${
                        this.displayName || this.constructor.displayName
                    }}`,
                    { detail }
                );
                return;
            }
            return Reactor.actionResult(
                this._listenerRef.current,
                event,
                detail,
                onUnhandled
            );
        }
        mkInternalHandler(rawHandler, observer, returnsResult) {
            const bound = internalHandler.bind(
                this,
                observer,
                returnsResult,
                rawHandler
            );
            bound.innerFunction = rawHandler.innerFunction || rawHandler;
            return bound;

            function internalHandler(
                observer,
                returnsResult,
                rawHandler,
                event
            ) {
                if (event.detail.debug) {
                    // eslint-disable-next-line no-debugger
                    debugger;
                }
                if (!event.detail.single) return rawHandler(event);

                const result = rawHandler(event);
                if (observer) return;
                if (
                    returnsResult ||
                    // didn't explicitly return something falsey:
                    !!result ||
                    "undefined" === typeof result
                ) {
                    event.stopPropagation();
                }
                return result;
            }
        }

        _listen(
            eventName,
            rawHandler,
            capture,
            {
                at,
                isInternal,
                bare,
                observer,
                returnsResult,
                isAsync,
                existing = false,
            } = {}
        ) {
            const listening = this.listening;
            // console.warn("_listen: ", eventName, handler);
            const note = isInternal
                ? ""
                : "(NOTE: listener applied additional wrapper)";

            let listeningNode = at || this._listenerRef.current;

            const handler =
                existing ||
                (isInternal
                    ? this.mkInternalHandler(
                          rawHandler,
                          observer,
                          returnsResult
                      )
                    : this._wrapHandler(rawHandler, {
                          eventName,
                          isInternal,
                          bare,
                          observer,
                          returnsResult,
                          isAsync,
                      }));
            if (!(listeningNode instanceof HTMLElement)) {
                if (listeningNode.isReactComponent) {
                    listeningNode = React.findDOMNode(listeningNode);
                }
            }
            listeningNode.addEventListener(eventName, handler, { capture });
            trace("listening", { eventName }, "with handler:", handler, note);

            const listenersOfThisType =
                listening.get(eventName) ||
                listening.set(eventName, new Set()).get(eventName);

            listenersOfThisType.add([listeningNode, handler]);
            return handler;
        }

        componentDidMount() {
            trace("listener -> didMount");

            if (!this._listenerRef) {
                let msg = `${this.constructor.name}: requires this._listenerRef to be set in constructor.`;
                logger(msg);
                console.error(msg);
                throw new Error(msg);
            }
            if (!this._listenerRef.current) {
                let msg = `${this.constructor.name}: requires this._listenerRef.current to be set with ref={this._listenerRef}`;
                logger(msg);
                console.error(msg);
                throw new Error(msg);
            }
        }
        componentDidUpdate(prevProps, prevState) {
            trace(`${this.constructor.name} listener -> didUpdate`);
            logger("... didUpdate: ", {
                prevState,
                prevProps,
                st: this.state,
                pr: this.props,
            });

            if (
                (!prevState || !prevState._reactorDidMount) &&
                this.state._reactorDidMount
            ) {
                trace(`-> ${this.constructor.name} wrapped componentDidMount `);
                super.componentDidMount && super.componentDidMount(); // deferred notification to decorated Actor/Reactor of having been mounted
                trace(`<- ${this.constructor.name} wrapped componentDidMount `);
            }
            trace(`${this.constructor.name} listener -> didUpdate (super)`);
            if (super.componentDidUpdate)
                super.componentDidUpdate(prevProps, prevState);
            trace(`${this.constructor.name} listener <- didUpdate`);
        }

        componentWillUnmount() {
            if (super.componentWillUnmount) super.componentWillUnmount();
            let { debug } = this.props;
            this._unmounting = true;
            const dbg = debugInt(debug);
            trace(
                `${this.constructor.name}: unmounting and deferred unlistening all...`
            );
            if (dbg) {
                console.log(
                    `${this.constructor.name}: unmounting and deferred unlistening all...`
                );
            }
            const stack = new Error("Backtrace");

            setTimeout(() => {
                const { listening } = this;

                trace(`${this.constructor.name} deferred unlisten running now`);
                if (dbg)
                    console.warn(
                        `${this.constructor.name} deferred unlisten running now`
                    );

                for (const [type, listeners] of listening.entries()) {
                    for (const listener of listeners.values()) {
                        const [node, handler] = listener;

                        if (!stdHandlers[type]) {
                            const thisPubSubEvent = this.events[type];
                            if (thisPubSubEvent) {
                                if (thisPubSubEvent.subscribers.size)
                                    console.warn(
                                        `${this.constructor.name} removed published '${type}' listener, leaving ${thisPubSubEvent.subscribers.size} with no event source.`
                                    );
                            } else {
                                console.warn(
                                    `${this.constructor.name} removed remaining '${type}' listener: `,
                                    handler
                                );
                                if (dbg) console.warn(stack);
                            }
                        }

                        this.unlisten(type, listener);
                    }
                }
            }, this.unlistenDelay);
        }

        unlisten(type, listener, capture) {
            let [node, handler] = listener;
            let listenersOfThisType = this.listening.get(type);

            let foundListening = listenersOfThisType.has(listener) && listener;

            if (!foundListening) {
                // published-events and actions being unmounted
                // separately from the Reactor use this slower path
                // because they don't currently store a reference
                //   to the [node, handler] pair; they pass us
                //   an equivalent array, we compare its elements.
                for (const listener of listenersOfThisType.values()) {
                    const [n, h] = listener;
                    if (h === handler) {
                        if (n === node) {
                            foundListening = listener;
                        } else {
                            console.warn(
                                {
                                    detail: {
                                        unlisteningNode: node,
                                        listeningNode: n,
                                        handler: h,
                                    },
                                },
                                `Reactor: unlisten found matching handler with mismatched node.  Yikes.`
                            );
                        }
                    }
                }
                if (
                    !foundListening ||
                    !listenersOfThisType.has(foundListening)
                ) {
                    console.warn(
                        `${type} listener not found/matched `,
                        handler,
                        `\n   ...in listeners`,
                        [...listenersOfThisType.values()]
                    );
                    // eslint-disable-next-line no-debugger
                    debugger;
                    return;
                }
            }
            if (!node) throw new Error(`no el to unlisten for ${type}`);

            node.removeEventListener(type, handler, capture);
            listenersOfThisType.delete(foundListening);
        }

        _wrapHandler(handler, details) {
            const createdBy = new Error("stack");

            if (!handler.innerFunction) {
                console.warn(
                    "Reactor: listener not bound or can't be attributed to a target function\n" +
                        Reactor.bindWarning,
                    handler
                );
                // eslint-disable-next-line no-debugger
                debugger;
            }
            // avoids closure
            const wrapped = wrappedHandler.bind(
                this,
                createdBy,
                details,
                handler
            );
            wrapped.innerFunction = handler.innerFunction || handler;
            return wrapped;

            function wrappedHandler(createdBy, details, handler, event) {
                // it's important to clarify the `this` context.  Sorry, eslint.                
                // eslint-disable-next-line @typescript-eslint/no-this-alias
                const reactor = this;
                const {
                    eventName,
                    isInternal,
                    bare,
                    observer,
                    returnsResult,
                    isAsync,
                } = details;

                if (returnsResult && !event.detail.result) {
                    event.error = new Error(
                        `Developer error: event('${eventName}'‹returnsResult›): use Reactor.actionResult(...) or ‹actor›.actionResult(...)`
                    );
                    return;
                }
                const { type, detail } = event || {};
                const { debug, single, multiple } = detail || {};

                const dbg = debugInt(debug);
                const moreDebug = dbg > 1;

                event.handledBy = event.handledBy || [];
                const listenerObj = handler.boundThis || Reactor.bindWarning;
                const listenerFunction = handler.innerFunction || handler;
                const handled = {
                    reactor,
                    reactorNode: this,
                    eventName,
                    listenerObj,
                    createdBy,
                    listenerFunction,
                };
                if (!handled.reactorNode) {
                    // eslint-disable-next-line no-debugger
                    debugger;
                }

                const isInternalEvent = type in Reactor.Events || isInternal;
                const listenerTarget =
                    handler.boundThis && handler.boundThis.constructor.name;
                const listenerName =
                    listenerFunction.boundName || listenerFunction.name;

                const showDebug =
                    !isInternalEvent && (dbg || eventDebug.enabled);
                if (showDebug) {
                    const msg = `${reactor.constructor.name}: Event: ${type} - calling handler at`;

                    console.group(
                        eventDebug.namespace,
                        msg,
                        elementInfo(event.target)
                    );
                    eventDebug({
                        listenerFunction,
                        listenerTarget,
                    });
                }
                trace(`${displayName}:  ⚡'${type}'`);
                try {
                    const result = handler.call(this, event); // retain event's `this` (target of event)

                    if (returnsResult) {
                        if ("undefined" === typeof result) {
                            const msg = `event('${type}'‹returnsResult›) handler returned undefined result`;
                            console.warn(msg, { handler });
                            throw new Error(msg);
                        }
                        if (result && result.then && !isAsync) {
                            const msg = `event('${type}'‹returnsResult›) handler returned a promise.  Add isAsync to the <Subscribe> or <Action> definition to indicate this is what you planned.`;
                            console.warn(msg, { handler });
                        }
                        if (event.error) {
                            // eslint-disable-next-line no-debugger
                            debugger;
                        } else {
                            if (!isInternalEvent)
                                eventDebug("(event was handled)");
                            event.handledBy.push(handled);

                            event.detail.result = result;
                            event.stopPropagation();
                        }
                        return result;
                    } else if (!observer) {
                        if (
                            event.detail &&
                            event.detail.result == Reactor.pendingResult
                        ) {
                            console.error(
                                "handler without returnsResult:",
                                handler
                            );
                            throw new Error(
                                `event called with eventResult(), but the handler isn't marked with returnsResult.  Fix one, or fix the other.`
                            );
                        }
                    }

                    if (observer && !result) {
                        // if (!isInternalEvent) console.log(`observer saw event('${event.type}')`, handled);
                        eventDebug("event observer called");
                    } else if (result === undefined || !!result) {
                        if (!isInternalEvent) eventDebug("(event was handled)");
                        if (event.handledBy.length > EVENT_IS_LOOPING_MAYBE) {
                            // eslint-disable-next-line no-debugger
                            debugger;
                        }
                        event.handledBy.push(handled);
                        if (single) event.stopPropagation();
                    } else {
                        if (!isInternalEvent)
                            eventDebug("(event was not handled at this level)");
                    }
                    return result;
                } catch (error) {
                    const message = `${(bare && "bare ") || ""}event('${
                        event.type
                    }') ${
                        (observer && "observer") || "handler"
                    } ${listenerName}() threw an error: `;
                    console.error(message, error);

                    // double errors being reported?  see commit message
                    Reactor.trigger(event.target, "error", {
                        single: true,
                        error: message + error.message,
                    });
                    event.error = error;
                } finally {
                    if (showDebug) console.groupEnd();
                }
            }
        }
    };
    Object.defineProperty(clazz, "name", { value: displayName });
    return clazz;
}
