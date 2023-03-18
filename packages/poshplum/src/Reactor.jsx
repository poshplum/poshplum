import React from "react";
import levenshtein from "fast-levenshtein";
import {ErrorTrigger} from "./components/ErrorTrigger";

export const EVENT_IS_LOOPING_MAYBE = 20;
export const reactorTag = Symbol("Reactor");

// Reactors:
//  - Take modularized responsibility for local state change
//  - Provide feather-weight structure for action/dispatch/reducer pattern
//  - Leverage the high-performance DOM events infrastructure☺

//  - it listens for dispatched Action events (DOM)
//  - it handles the Actions it supports
//  - it ignores Actions it doesn't support (with a warning and/or UnhandledAction
//    notification depending on circumstance, in case there's a delegate that can
//    help deal with unhandled actions) ... not listening=no response.  Difficult
//    to warn on these unless we control the factory for custom events (✔️).
//  - installs a listener for all standard event types
//  - it stops listening when unmounting.  ✔️
//  - it stops listening when the Action gets unmounted  ❌
//  - has predefined events: registerActionEvent, queryActions, registerActor, NoActorFound

// Enumerating Actions:
//  - it listens for Action Query events
//  - it reacts to Action Queries with a callback reflecting its collected action types
//  ? same action types are available from its JS module static Actions map.

// ...as delegation hub
//  - it listens for events from children, indicating that a nested component
//    is ready to handle an action (or that it no longer is handling that action)
//    - an actionDelegate component, added to the delegate, ensures correctness
//      of the delegate's behavior, particularly with regard to unmount/undelegation
//      signalling.
//

// Actors: Any component can register actions (gathered by a parent Reactor)
//   Actions without a parent reactor throw a warning to console & screen
//   Actors register themselves (gathered by a parent Reactor) through a registerActor
//   Actors gather their own registered Actions and those (if any) defined by their
//     children (if any)
//   Actors are named; this name is their delegate name at their Reactor. Their
//     Actions' event-names are scoped with the delegate name for the Reactor's
//     event listener.
//   Parent components can trigger Actions on their children if needed
//   Child components trigger Action Queries to get named Actions from their parents

// Action boundaries (when in Dev mode) reflect unhandled Action events, indicating
//   a bug in developer code.

import * as ReactDOM from "react-dom";
import { inheritName } from "./helpers/ClassNames";
import dbg from "debug";
import { Publish } from "./reactor/Publish";
import { Action } from "./reactor/Action";
import { Listener } from "./reactor/Listener";
import { Actor } from "./reactor/Actor";
export const trace = dbg("trace:reactor");
export const logger = dbg("debug:reactor");
const info = dbg("reactor");
export const eventDebug = dbg("debug:reactor:events");

export const elementInfo = (el) => {
    // debugger
    function esc(inp) {
        return inp.replace(/\./g, "\\.");
    }
    // return [el, esc(el.id)];
    if (el instanceof Document) return "‹document›";
    const classNames = [...el.classList].map(esc).join(".");
    let { id } = el;
    if (id) id = `#${esc(id)}`;
    return `‹${el.tagName.toLowerCase()}.${classNames}${id}›`;
};

export const debugInt = (debug) => {
    return debug
        ? typeof debug == "string"
            ? parseInt(debug)
            : 0 + debug || 1
        : 0;
};

const handledInternally = [Symbol("ReactorInternal")];

export const stdHandlers = {
    error: 1,
    registerAction: 1,
    registerActor: 1,
    registerPublishedEvent: 1,
    registerSubscriber: 1,
    removeAction: 1,
    removeActor: 1,
    removePublishedEvent: 1,
    removeSubscriber: 1,
    reactorProbe: 1,
};

export function Reactor(componentClass) {
    if (componentClass[reactorTag]) return componentClass;
    let usedAsReactElement = false;
    if (componentClass.prototype instanceof React.Component) {
        //! it wraps an existing react Class component
    } else if ("function" === typeof componentClass) {
        debugger
        throw new Error("TBD: support for functional components with @Reactor");
    } else {
        //! it throws a useful error message for incorrect usage as a <ReactElement>
        const msg = "Incorrect use of <Reactor> as a React element.  Use @Reactor decorator on a React class component instead."
        return <ErrorTrigger error={msg}>
            Developer error: {msg}
        </ErrorTrigger>
    }
    const wrappedName = componentClass.wrappedName || componentClass.name;
    const listenerClass = Listener(componentClass);
    const componentClassName = componentClass.name;
    const reactorName = inheritName(componentClass, "Rx");
    trace(`Reactor creating branch+leaf subclass ${reactorName}`);
    const clazz = class ReactorInstance extends listenerClass {
        get wrappedName() {
            return super.wrappedName || wrappedName;
        }
        static get wrappedName() { return super.wrappedName || wrappedName }
        get displayName() {
            return componentClass.displayName || componentClass.name;
        }
        // registerActionEvent = Reactor.bindWithBreadcrumb(this.registerActionEvent, this);
        constructor(props) {
            trace(`${reactorName}: -> constructor(super)`);
            super(props);
            trace(`${reactorName}: -> constructor(self)`);
            this.Name = reactorName;
            this.name = () => reactorName;
            Object.defineProperty(this.name, "name", { value: reactorName });

            this.reactorProbe = Reactor.bindWithBreadcrumb(
                this.reactorProbe,
                this
            );
            // this.addReactorName = this.addReactorName.bind(this)
            this.addReactorName = Reactor.bindWithBreadcrumb(
                this.addReactorName,
                this
            );

            this.registerActionEvent = Reactor.bindWithBreadcrumb(
                this.registerActionEvent,
                this
            );
            this.removeAction = Reactor.bindWithBreadcrumb(
                this.removeAction,
                this
            );

            this.registerActor = Reactor.bindWithBreadcrumb(
                this.registerActor,
                this
            );
            this.removeActor = Reactor.bindWithBreadcrumb(
                this.removeActor,
                this
            );

            this.registerPublishedEventEvent = Reactor.bindWithBreadcrumb(
                this.registerPublishedEventEvent,
                this
            );
            this.removePublishedEvent = Reactor.bindWithBreadcrumb(
                this.removePublishedEvent,
                this
            );

            this.registerSubscriber = Reactor.bindWithBreadcrumb(
                this.registerSubscriber,
                this
            );
            this.removeSubscriberEvent = Reactor.bindWithBreadcrumb(
                this.removeSubscriberEvent,
                this
            );

            this.actions = {}; // known direct actions
            this.events = {}; // known events for publish & subscribe
            this.actors = {}; // registered actors
            trace(`${reactorName}: <- constructors`);
        }

        componentDidMount(...args) {
            // always true (listener branch class)
            // Note, the listener will defer calling the originally-decorated
            // class's componentDidMount() until state._reactorDidMount is changed
            // to true, which aligns with the timing of that class's first call
            // to render().
            trace(`${reactorName}: -> mounting(super)`);
            for (const init of Reactor.onInit) {
                init.call(this);
            }
            if (super.componentDidMount) super.componentDidMount(...args);
            trace(`${reactorName}: -> mounting(self)`);

            this.el = this._listenerRef.current;

            // provides early registration of events for notifications.
            // can this be replaced?
            if (this.hasNotifications) {
                this.registerPublishedEvent({ name: "success", target: this });
                this.registerPublishedEvent({ name: "warning", target: this });
                this.registerPublishedEvent({ name: "error", target: this });
            } else {
                //
                this.registerAction({
                    observer: true,
                    isInternal: true,
                    action: { errorEventDecoratorStub: true },
                    name: "error",
                    handler: this.addReactorName,
                });
            }
            const _l = (this.internalListeners = new Set());
            const isInternal = { isInternal: true };
            this.listen(
                Reactor.Events.reactorProbe,
                this.reactorProbe,
                false,
                isInternal
            );

            this.listen(
                Reactor.Events.registerAction,
                this.registerActionEvent,
                false,
                { returnsResult: true, ...isInternal }
            );
            this.listen(
                Reactor.Events.removeAction,
                this.removeAction,
                false,
                isInternal
            );

            this.listen(
                Reactor.Events.registerActor,
                this.registerActor,
                false,
                isInternal
            );
            this.listen(
                Reactor.Events.removeActor,
                this.removeActor,
                false,
                isInternal
            );

            this.listen(
                Reactor.Events.registerPublishedEvent,
                this.registerPublishedEventEvent,
                false,
                isInternal
            );
            this.listen(
                Reactor.Events.removePublishedEvent,
                this.removePublishedEvent,
                false,
                isInternal
            );

            this.listen(
                Reactor.Events.registerSubscriber,
                this.registerSubscriber,
                false,
                isInternal
            );
            this.listen(
                Reactor.Events.removeSubscriber,
                this.removeSubscriberEvent,
                false,
                isInternal
            );
            trace(`${reactorName}: +mounting flag`);

            setTimeout(() => {
                if (this._unmounting) return;
                this.setState({ mounting: true });
            }, 0);
            trace(`${reactorName}: <- didMount (self)`);
        }
        componentDidUpdate(...args) {
            const { mounting, _reactorDidMount: mounted } = this.state || {};
            // autoFocus
            if (!mounted) {
                trace(`${reactorName}: +didMount flag`);
                setTimeout(() => {
                    if (this._unmounting) return;
                    this.setState({ _reactorDidMount: true });
                }, 0);
                return;
            } else if (!this.mountConfirmed) {
                this.mountConfirmed = true;
                const node = this._listenerRef && this._listenerRef.current;
                const focusable =
                    node &&
                    node.querySelector &&
                    node.querySelector("[autofocus]");
                if (focusable) {
                    focusable.focus();
                }
            }
            if (super.componentDidUpdate)
                return super.componentDidUpdate(...args);
        }
        shouldComponentUpdate(nextProps, nextState) {
            if (
                nextState &&
                nextState._reactorDidMount &&
                (!this.state || !this.state._reactorDidMount)
            ) {
                return true;
            }
            if (
                nextState &&
                nextState.mounting &&
                (!this.state || !this.state.mounting)
            ) {
                return true;
            }
            if (super.shouldComponentUpdate)
                return super.shouldComponentUpdate(nextProps, nextState);
            return true;
        }

        get unlistenDelay() {
            return 100;
        }

        listen(
            eventName,
            handler,
            capture,
            {
                at,
                isInternal,
                bare,
                observer,
                returnsResult,
                isAsync,
                existing,
            } = {}
        ) {
            if (observer && returnsResult)
                throw new Error(
                    `Action observer('${eventName}') can't also be returnsResult.  It's fine to observe a returnsResult event, but don't mark the observer with returnsResult.`
                );
            let effectiveHandler = this._listen(eventName, handler, capture, {
                at,
                isInternal,
                bare,
                observer,
                returnsResult,
                isAsync,
                existing,
            });
            trace(`${reactorName}: +listen ${eventName}`);

            logger(
                "+listen ",
                eventName,
                handler,
                { t: { t: this } },
                this.actions
            );
            return effectiveHandler;
        }

        addReactorName(event) {
            if (event.detail && !event.detail.reactor)
                event.detail.reactor = `(in ${this.constructor.name})`;
            return null;
        }

        reactorProbe(event) {
            let { onReactor, result, debug } = event.detail;
            trace(`${reactorName}: responding to reactorProbe`);

            if (debug) debugger;

            if (!(result || onReactor)) {
                this.trigger(
                    Reactor.ErrorEvent({
                        error:
                            "reactorProbe must be called with an {onReactor} callback in the event detail,\n" +
                            "-or- using Reactor.actionResult(<component|dom-node>,'reactorProbe') to return the nearest Reactor\n",
                    })
                );

                return;
            }
            event.handledBy = handledInternally;
            let foundReactor = null;
            if (onReactor) {
                foundReactor = onReactor(this);
                if (false === foundReactor) return false;
                if ("undefined" == typeof foundReactor) {
                    const message = `reactorProbe: onReactor() returned undefined result (should be truthy or false)`;
                    console.error(message, { onReactor });
                    throw new Error(`${message} (see console error to trace)`);
                }
                if (!!foundReactor) foundReactor = this;
            } else {
                foundReactor = this;
            }
            if (result) {
                event.stopPropagation();
                return (event.detail.result = foundReactor);
            }

            // allows the onReactor callback to return true/false
            // to signal "handled", causing single: true to have its expected effect.
            return foundReactor;
        }

        registerActionEvent(event) {
            const {
                debug,
                name,
                actorName,
                action,
                capture,
                handler,
                ...moreDetails
            } = event.detail;
            const effectiveHandler = this.registerAction({
                debug,
                actorName,
                action,
                event,
                name,
                handler,
                capture,
                ...moreDetails,
            });
            event.stopPropagation();
            event.handledBy = handledInternally;
            // satisfies the returnsResult/actionResult interface, without wrapper overhead.
            event.detail.result = effectiveHandler;
        }

        registerAction({
            debug,
            event,
            at,
            name,
            actorName,
            shortName = name,
            action: actionInstance,
            returnsResult,
            isAsync,
            isInternal,
            handler,
            capture = "",
            observer = "",
            bare,
            ...moreDetails
        }) {
            trace(`${reactorName}: +action ${name}`);
            if (!handler) {
                console.error(
                    `RegisterAction: ${name}: no handler`,
                    event.target
                );
                throw new Error(
                    `RegisterAction: ${name}: no handler (see console for more details)`
                );
            }
            logger("...", moreDetails, `handler=${handler.name}`, handler);

            const priorityHandlers = [];

            const actionDescription = bare
                ? `${(capture && "capturing ") || ""}bare '${name}' event ${
                      (observer && "observer") || "handler"
                  }`
                : `${(capture && "capturing ") || ""}Action ${
                      observer && "observer: "
                  }'${name}'`;
            const existingAction = this.actions[name];
            const existingActionHandler =
                existingAction && existingAction.handler;
            const existingIsMulti =
                existingAction &&
                existingAction.get &&
                existingAction.get("_isMulti");
            if (existingActionHandler && !bare && !observer) {
                let info = {
                    existingAction,
                    listenerFunction: (
                        existingActionHandler.innerFunction ||
                        existingActionHandler
                    ).name,
                    listenerTarget:
                        (existingActionHandler.boundThis &&
                            existingActionHandler.boundThis.constructor.name) ||
                        Reactor.bindWarning,
                };

                const msg = `${this.constructor.name}: ${actionDescription} is already registered with a handler`;
                console.error(msg);
                console.warn("existing handler info: ", info);
                throw new Error(msg);
            } else if (observer && existingIsMulti) {
                if ([...existingAction.values()].find((x) => !!x.bare)) {
                    console.warn(
                        `vvvvvvvvv ${actionDescription} may be called out of order or skipped, due to an existing Action handler`,
                        {
                            existingAction,
                            thisHandler: handler.innerFunction || handler,
                            existing:
                                existingActionHandler.innerFunction ||
                                existingActionHandler,
                        }
                    );
                }
            }
            if (
                !existingAction &&
                this.listening.get(name) &&
                this.listening.get(name).size
            ) {
                console.warn(
                    `there are existing listeners that may modify or stop the event before ${actionDescription} sees it;`
                );
                for (const listener of this.listening.get(name).values()) {
                    if (listener == existingActionHandler) continue;

                    console.warn("existing listener: ", listener);
                }
            }

            const effectiveHandler = this.listen(name, handler, capture, {
                at,
                isInternal,
                observer,
                bare,
                returnsResult,
                isAsync,
            });

            // ensure the event gets the full event name, even if an Actor
            // did contribute its own augmented version of the full event name.
            // this happens e.g. when bare= is specified.
            if (event && event.detail) event.detail.name = name;

            const handlerDetails = {
                handler: effectiveHandler,
                instance: actionInstance,
                shortName,
                bare,
                observer,
                returnsResult,
                isAsync,
                actorName,
                isInternal,
                capture,
                at,
            };
            if (!(bare || observer)) {
                this.actions[name] = handlerDetails;
            } else {
                let multiHandlers = existingAction;
                if (!multiHandlers || !multiHandlers.get) {
                    multiHandlers = this.actions[name] = new Map();
                    multiHandlers.set("_isMulti", true);
                    if (existingAction) {
                        console.log(
                            `reordering listeners to enable observer of existing action ${name}`
                        );
                        const node = existingAction.at || this.el;
                        const replacingHandler = existingAction.handler;
                        this.unlisten(name, [node, replacingHandler], capture);
                        this.listen(name, null, existingAction.capture, {
                            ...existingAction,
                            existing: replacingHandler,
                        });

                        multiHandlers.set(
                            existingAction.instance,
                            existingAction
                        );
                    }
                }
                multiHandlers.set(actionInstance, handlerDetails);
                this.actions[name] = multiHandlers;
            }
            return effectiveHandler;
        }

        removeAction(event) {
            const {
                debug,
                name,
                instance,
                at,
                handler,
                capture,
                observer = "",
                bare,
                ...moreDetails
            } = event.detail;
            trace(`${reactorName}: -action ${name}`);
            if (debug)
                console.log(
                    `${this.constructor.name}: removing action:`,
                    event.detail
                );

            const node = at || this.el;

            const foundAction = this.actions[name];
            if (!foundAction && !(bare || observer)) {
                logger(
                    `can't removeAction '${name}' (not registered)`,
                    new Error("Backtrace")
                );
                console.warn(
                    `can't removeAction '${name}' (not registered)`,
                    new Error("Backtrace")
                );
                return false;
            } else {
                if (foundAction && foundAction.handler) {
                    const { handler: t } = foundAction;
                    if (handler !== t) {
                        console.error(
                            {
                                detail: {
                                    actionName: name,
                                    listening: t,
                                    removing: handler,
                                },
                            },
                            `listener mismatch in removeAction`
                        );
                        debugger;
                        throw new Error(
                            `ruh roh.  these should match, shaggy.`
                        );
                    }
                    this.unlisten(name, [node, handler], capture);
                    delete this.actions[name];
                } else if (
                    foundAction &&
                    foundAction.get &&
                    foundAction.get("_isMulti")
                ) {
                    if (!instance)
                        throw new Error(
                            `removeAction event missing required detail.instance, which must point to the specific action instance being removed`
                        );
                    const multiAction = foundAction;
                    const matchedAction = foundAction.get(instance);
                    if (!matchedAction)
                        throw new Error(
                            `removeAction event's detail.instance does not match`
                        );
                    const { handler, at: node = this.el } = matchedAction;

                    this.unlisten(name, [node, handler], capture);

                    const remainingCount = multiAction.size - 2; // _isMulti key plus the matched action are removed from this count
                    if (remainingCount) {
                        multiAction.delete(instance);
                    } else {
                        delete this.actions[name];
                    }
                } else {
                    debugger;
                    this.unlisten(name, [node, handler], capture);
                }
                event.stopPropagation();
                event.handledBy = handledInternally;
            }
        }
        registerPublishedEventEvent(event) {
            const {
                target,
                detail: { name, debug, actor, global },
            } = event;
            if (global && !this.isRootReactor) {
                logger(
                    `${this.constructor.name}: passing global registerPublishedEvent to higher reactor`,
                    event.detail
                );
                if (debug)
                    console.warn(
                        `${this.constructor.name}: passing global registerPublishedEvent to higher reactor`,
                        event.detail
                    );
                return false;
            }
            this.registerPublishedEvent({ name, debug, target, actor });
            event.handledBy = handledInternally;

            event.stopPropagation();
        }

        registerPublishedEvent({ name, debug, target, actor }) {
            const message =
                `registering event '${name}'` +
                (actor ? ` published by ${actor.constructor.name}` : "");
            trace(`${reactorName}: `, message);

            if (debug) console.warn(message);

            let subscriberRegistry = this.events[name];
            if (!subscriberRegistry) {
                subscriberRegistry = {
                    publishers: new Set(),
                    subscribers: new Set(),
                    subscriberOwners: new Map(),
                    at: this._listenerRef.current,
                };
                const handler = subscriberFanout.bind(
                    this,
                    name,
                    subscriberRegistry
                );
                handler.innerFunction = "self (subscriberFanout)";
                subscriberRegistry._listener = this.listen(name, handler);
                this.events[name] = subscriberRegistry;
            }

            subscriberRegistry.publishers.add(actor);

            function subscriberFanout(eventName, subscriberRegistry, event) {
                logger(
                    `got event ${eventName}, dispatching to ${subscriberRegistry.subscribers.size} listeners`
                );
                if (debug)
                    console.warn(
                        `got event ${eventName}, dispatching to ${subscriberRegistry.subscribers.size} listeners`
                    );

                event.handledBy.push(handledInternally);
                for (const subscriberFunc of subscriberRegistry.subscribers) {
                    if (!subscriberFunc) continue;
                    eventDebug(
                        `'${eventName}: delivering to subscriber`,
                        subscriberFunc
                    );

                    subscriberFunc(event);
                    // no falsy-return -> stopPropagation; that would break our promise to notify subscribers.
                }
            }
        }

        eventPrefix() {
            return "";
        }

        removePublishedEvent(event) {
            let {
                target,
                detail: { name, global, actor, debug },
            } = event;

            if (global && !this.isRootReactor) {
                logger(
                    `${this.constructor.name}: passing global removePublishedEvent to higher reactor`,
                    event.detail
                );
                if (debug)
                    console.warn(
                        `${this.constructor.name}: passing global removePublishedEvent to higher reactor`,
                        event.detail
                    );
                return false;
            }

            const thisEvent = this.events[name];
            if (!thisEvent) {
                console.warn(
                    `can't removePublishedEvent ('${name}') - not registered`
                );
                throw new Error(
                    `removePublishedEvent('${name}') not registered...  Was its DOM element moved around in the tree since creation?`
                );
            }
            const { subscriberOwners: owners, publishers } = thisEvent;
            if (!publishers.has(actor)) {
                console.warn(
                    `can't removePublishedEvent('${name}') - actor not same as those who have registered`,
                    { actor, publishers }
                );
                event.detail.cantFindIt = true;
                return false; // pass to higher-level reactor.
            } else if (event.detail.cantFindIt) {
                console.warn(
                    `^^^^^^^^^^^^ okay, a higher-level reactor was able to find the event with a matching actor`
                );
            }
            publishers.delete(actor);

            if (!publishers.size) {
                const subs = thisEvent.subscribers;

                for (const sub of subs.values()) {
                    const owner = owners.get(sub);
                    if (owner && owner.publisherUnmounted) {
                        // avoid spurious warnings when publisher and subscriber are being unmounted in a single batch:
                        owner.publisherUnmounted();
                        owners.delete(sub);
                    } else {
                        console.warn(
                            `${this.constructor.name}: removePublishedEvent('${name}'): subscriber function had no matching owner:`,
                            sub
                        );
                    }
                    subs.delete(sub);
                }
                if (subs.size) {
                    console.error(
                        `removing published event with ${subs.size} orphaned subscribers...\n...owners & subscribers:`,
                        [...subs.values()].map((s) => [owners.get(s), s])
                    );
                }
                this.unlisten(name, [thisEvent.at, thisEvent._listener]);
                delete this.events[name];
                event.stopPropagation();
            } else {
                logger(
                    `${this.constructor.name}: event '${name}' is still published by ${publishers.size} actors:`,
                    [...publishers.values()]
                );
                if (debug)
                    console.warn(
                        `${this.constructor.name}: event '${name}' is still published by ${publishers.size} actors:`,
                        [...publishers.values()]
                    );
            }
            event.handledBy = handledInternally;
        }

        registerActor(event) {
            let { name, actor, debug } = event.detail;
            if (!name) {
                throw new Error(`can't register an unnamed actor`);
            }
            trace(this.constructor.name, `registering actor '${name}'`);

            if (debug)
                console.info(
                    this.constructor.name,
                    `registering actor '${name}'`
                );
            if (this.actors[name]) {
                const message = `Actor name already registered`;
                console.error(
                    {
                        detail: {
                            actorName: name,
                            actorInstance: this.actors[name],
                        },
                    },
                    message
                );
                throw new Error(message);
            } else {
                this.actors[name] = actor;
                event.detail.registeredWith = this;
                event.handledBy = handledInternally;
            }
            event.stopPropagation();
        }

        removeActor(event) {
            let { name } = event.detail;
            if (!name) {
                throw new Error(`ignoring request to remove unnamed actor`);
            }

            if (this.actors[name]) {
                delete this.actors[name];
                event.stopPropagation();

                event.handledBy = handledInternally;
            } else {
                console.error(
                    `ignoring removeActor event for name '${name}' (not registered)`
                );
                return false;
            }
        }

        // matches a registerSubscriber event to a Reactor node by inspecting its
        // known publishers.  If it's not matched, it passes the event on to a higher-level
        // Reactor, after decorating the event with a list of published event-names that are similar
        // to the requested one.  And if the current Reactor is a root-reactor ("isRootReactor=true"),
        // it issues an error event with a friendly message for the developer.
        // When the requested event-name is found, it stops the registerSubscriber from further
        // propagation and calls through to registerSubscriberEvent().
        registerSubscriber(event) {
            let {
                eventName,
                optional,
                owner,
                candidates: deeperCandidates = [],
                listener,
                debug,
            } = event.detail;
            eventName = eventName.replace(/\u{ff3f}/u, ":");
            if (!this.events[eventName]) {
                const possibleMatches = Object.keys(this.events);

                const distances = possibleMatches.map((candidate) => [
                    levenshtein.get(candidate, eventName) / eventName.length,
                    candidate,
                ]);
                const closeDistances = distances.filter(
                    ([distance, x]) => distance < 0.6
                );
                const likelyCandidates = closeDistances
                    .sort(([d1], [d2]) => (d1 < d2 ? -1 : 1))
                    .map(([distance, candidate]) => candidate);

                let allKnownCandidates = [
                    ...likelyCandidates,
                    ...deeperCandidates,
                ];

                if (this.isRootReactor) {
                    if (optional) return false;
                    const candidatesMessage = allKnownCandidates
                        ? ` (try one of: ${allKnownCandidates.join(",")})`
                        : "";
                    const message = `${this.constructor.name}: ‹Subscribe ${eventName}›: no matching ‹Publish›${candidatesMessage}`;
                    console.warn(message);

                    this._listenerRef.current.dispatchEvent(
                        Reactor.ErrorEvent({
                            error: message,
                            detail: event.detail,
                            backtrace: new Error("stack"),
                            listener,
                        })
                    );
                    return true;
                } else {
                    // augment the event with candidates we identified at this level,
                    // before letting the event propage up through the tree.
                    event.detail.candidates = allKnownCandidates;

                    logger(
                        `${this.constructor.name}: unknown registerSubscriber request; passing to higher reactor`,
                        event.detail
                    );
                    if (debug)
                        console.warn(
                            `${this.constructor.name}: ignored unknown registerSubscriber request`,
                            event.detail
                        );
                    return false;
                }
            } else {
                eventDebug(`${this.constructor.name}: +subscriber:`, {
                    eventName,
                    debug,
                    listener,
                });
                logger(`${this.constructor.name}: +subscriber:`, {
                    eventName,
                    debug,
                    listener,
                });
                if (debug)
                    console.warn(`${this.constructor.name}: +subscriber:`, {
                        eventName,
                        debug,
                        listener,
                    });
            }
            event.stopPropagation();
            event.handledBy = handledInternally;

            logger(
                `${this.constructor.name}: registering subscriber to '${eventName}': `,
                listener,
                new Error("...stack trace")
            );
            if (debug > 1)
                console.warn(
                    `${this.constructor.name}: registering subscriber to '${eventName}': `,
                    listener,
                    new Error("...stack trace")
                );

            // setTimeout(() => {
            this.addSubscriberEvent(eventName, owner, listener, debug);
            // }, 1)
        }

        // takes a validated ‹Publish› event-name, a subscribing actor reference and a subscriber-function,
        // and adds the subscriber to the event's set of subscribers.
        addSubscriberEvent(eventName, owner, subscriberFn, debug) {
            const thisEvent = this.events[eventName];
            if (thisEvent) {
                const { subscribers, subscriberOwners: owners } = thisEvent;
                if (!subscriberFn) {
                    console.error(
                        `Subscribe: event '${eventName}': missing handler function.  owner ->`,
                        owner
                    );
                }
                if (subscribers.has(subscriberFn)) {
                    const existingOwner = owners.get(subscriberFn);
                    const ownerBit = existingOwner
                        ? ["\n...with existing owner", existingOwner]
                        : [];
                    console.error(
                        `addSubscriberEvent('${eventName}'): ignoring duplicate subscription:`,
                        subscriberFn,
                        ...ownerBit,
                        `\n---> have you subscribed using a method in your class as an event handler?  \n` +
                            `     you should probably bind that function to its instance in constructor.`
                    );
                    return false;
                } else {
                    const pOwner = owners.get(subscriberFn);
                    if (pOwner) {
                        // this isn't supposed to happen - it's just for sanity-checking.
                        const message = `addSubscriberEvent('${eventName}'): subscriberOwners already has this subscriberFunction registered to another owner`;
                        console.error(message, { subscriberFn, owner: pOwner });
                        throw new Error(
                            message + " (see console for more detail)"
                        );
                    }

                    subscribers.add(subscriberFn);
                    if (owner) {
                        owners.set(subscriberFn, owner);
                    } else {
                        const message =
                            `addSubscriberEvent('${eventName}'): registering subscriber without an owner.  \n` +
                            `   ...if you add event.detail.owner pointing to an object with .publisherUnmounted(), you can get ` +
                            `      notifications when the publisher is unmounting, which can help you suppress spurious warnings ` +
                            `      (and possible memory leaks as well) when ‹Publish› and ‹Subscribe› are unmounted at the same time.`;
                        console.warn(message, subscriberFn);
                    }
                }
            } else {
                throw new Error(
                    `addSubscriberEvent('${eventName}'): bad event name in subscription request`
                );
            }
        }

        removeSubscriberEvent(event) {
            let { eventName, owner, listener, debug } = event.detail;
            eventName = eventName.replace(/\u{ff3f}/u, ":");

            const thisEvent = this.events[eventName];
            if (!thisEvent) {
                if (this.isRootReactor) {
                    const message = `${this.constructor.name} in removeSubscriber: unknown event ${eventName}`;
                    logger(message);
                    console.warn(message);
                    this._listenerRef.current.dispatchEvent(
                        Reactor.ErrorEvent({
                            error: message,
                            backtrace: new Error("stack"),
                            listener,
                        })
                    );
                }
                return false;
            }
            const result = this.removeSubscriber(
                eventName,
                owner,
                listener,
                debug
            );
            if (false !== result) {
                event.handledBy = handledInternally;
            }
            return result;
        }

        removeSubscriber(eventName, owner, subscriberFn, debug) {
            const thisEvent = this.events[eventName];
            const { subscribers, subscriberOwners: owners } = thisEvent;

            logger(
                `${this.constructor.name}: removing subscriber to '${eventName}': `,
                subscriberFn
            );
            if (debug)
                console.warn(
                    `${this.constructor.name}: removing subscriber to '${eventName}': `,
                    subscriberFn,
                    new Error("...stack trace")
                );

            if (!subscribers.delete(subscriberFn)) {
                logger(
                    `${this.constructor.name}: no subscribers removed for ${eventName}`
                );
                console.warn(
                    `${this.constructor.name}: no subscribers removed for ${eventName}`
                );
                return false;
            } else {
                // it's ok to just delete the owner entry here - it's only needed during
                //   Publish-removal, when it's possible that this code path can't run
                //   properly because the Publish and Subscribe are both removed from
                //   the DOM at the same time.
                if (!owners.delete(subscriberFn)) {
                    console.warn(
                        `${this.constructor.name}: removed a subscriber with no matching owner:`,
                        subscriberFn,
                        "\n     ... did the registerSubscriber event have details.owner?"
                    );
                }
                const after = thisEvent.subscribers.size;
                logger(
                    `${this.constructor.name}: removed a subscriber for ${eventName}; ${after} remaining`
                );
                if (debug)
                    console.warn(
                        `${this.constructor.name}: removed a subscriber for ${eventName}; ${after} remaining`
                    );

                // we don't currently stop listening if no subscribers are left
                // so that we don't have to deal with re-listening.  Unmounted
                // publishers will unlisten as part of their lifecycle.
            }
        }

        filterProps(props) {
            if (super.filterProps) return super.filterProps(props);

            return props;
        }
        render() {
            let { mounting = false, _reactorDidMount: mounted } =
                this.state || {};
            trace(`${reactorName}: reactor rendering`, { mounted });
            let props = this.filterProps(this.props);
            let { isFramework = "" } = this;
            if (isFramework) isFramework = " _fw_";
            if (this.debug || this.props.debug) debugger;

            const { wrappedName: wn } = this;
            const wrappedName = wn ? { "data-wrapped-name": wn } : {};
            return (
                <div
                    {...wrappedName}
                    style={{ display: "contents" }}
                    ref={this._listenerRef}
                    key="reactor-node"
                    className={`reactor for-${componentClassName}${isFramework}`}
                    {...props}
                >
                    {(mounted || mounting) && Reactor.earlyUniversalActors}
                    {mounted && Reactor.universalActors}
                    {mounted && super.render()}
                </div>
            );
        }
    };
    Object.defineProperty(clazz, reactorTag, { value: true });
    Object.defineProperty(clazz, "name", { value: reactorName });
    return clazz;
}
Reactor.pendingResult = Symbol("‹pending›");
Reactor.onInit = [];
Reactor.earlyUniversalActors = [];
Reactor.universalActors = [];

Reactor.actionResult = function getEventResult(
    target,
    eventName,
    detail = {},
    onUnhandled
) {
    let event;
    if (eventName instanceof Event) {
        event = eventName;
        eventName = event.type;
    } else {
        if ("string" !== typeof eventName)
            throw new Error(
                "actionResult: must give a string eventName or Event."
            );
        const { single = true } = detail;
        detail.single = single;
        event = new CustomEvent(eventName, { bubbles: true, detail });
    }

    event.detail.result = Reactor.pendingResult;
    if (!onUnhandled)
        onUnhandled = (unhandledEvent, error = "") => {
            if (error) {
                const msg = `caught error in action('${eventName}'‹returnsResult›):`;
                error.stack = `${msg}\n${error.stack}`;
                console.error("error in actionResult:", error);
                Reactor.trigger(target, "error", {
                    error: `${msg} ${error.message}`,
                }); // this helps when a synchronous action is called from an async function
                throw error;
            } else {
                const msg = `actionResult('${eventName}'): Error: no responders (check the event name carefully)!`;
                error = new Error(msg);
                debugger;
                console.error(
                    "unhandled actionResult event:",
                    unhandledEvent,
                    "\n",
                    error
                );
                throw error;
            }
        };

    Reactor.dispatchTo(target, event, detail, onUnhandled);
    if (Reactor.pendingResult === event.detail.result) {
        throw new Error(
            `actionResult('${eventName}') did not provide event.detail.result`
        );
    }

    if (event.detail) return event.detail.result;
};

Reactor.dispatchTo = Reactor.trigger = function dispatchWithHandledDetection(
    target,
    event,
    detail,
    onUnhandled
) {
    let stackTrace = new Error("trace");
    stackTrace.stack = stackTrace.stack.split("\n").slice(2).join("\n");
    let bubbles = true;
    if ("function" == typeof detail) {
        if (!(event instanceof Event))
            throw new Error("missing object for event details in arg 3");

        onUnhandled = detail;
        detail = {};
    }
    if (event instanceof Event) {
        detail = event.detail;
    } else {
        if (!detail) detail = {};
        if ("undefined" !== typeof detail.bubbles) {
            bubbles = detail.bubbles;
            delete detail.bubbles;
        }
        event = new CustomEvent(event, { bubbles, detail });
    }

    const { single, multiple } = detail;
    if (!single && !multiple) {
        // debugger;
        // console.warn(
        //     `Reactor.trigger('${event.type}', {...options}): add 'multiple' option to allow multiple actors to be triggered (or 'single' to prevent it)`,
        //     new Error("stack").stack
        // );
    }

    if (!(target instanceof Node)) {
        try {
            target = ReactDOM.findDOMNode(target);
        } catch (e) {
            debugger
            // no-op; will fall through to errors below
        }
    }
    if (!(target instanceof Node)) {
        if (event.type == "error") {
            console.warn(
                "Can't dispatch error (no DOM node target), so raising to console instead"
            );
            console.error(event.detail);
            return;
        }
        const msg = `Reactor.dispatchTo: ${event.type} event missing required arg1 (must be a DOM node or React Component that findDOMNode() can use)`;
        logger(msg);
        stackTrace.stack = msg + stackTrace.stack;
        console.warn(stackTrace);
        throw stackTrace;
    }

    target.dispatchEvent(event);
    let error = event.error;
    if (event.handledBy && event.handledBy.length) {
        if (error) {
            const msg = `Handled(!) event('${event.type}') had error: `;
            Reactor.trigger(target, "error", { error: msg + error.message });
            console.error(msg, error, "\nhandledBy:", event.handledBy);
        }
        return event;
    }

    if (onUnhandled) {
        const result = onUnhandled(event, error);
        if (event.detail.result == Reactor.pendingResult) {
            event.detail.result = result;
            return result;
        }
        return event;
    } else if (!error && null === onUnhandled) {
        return event;
    }

    warnOnUnhandled.bind(this)(event, error);

    function warnOnUnhandled(event, caughtError) {
        if (detail && detail.optional) {
            const message = `unhandled event ${event.type} was optional, so no error event`;
            logger(message);
            console.warn(message);
            return;
        }
        const eventDesc =
            this.events && this.events[event.type]
                ? `Published event '${event.type}'`
                : `action '${event.type}'`;

        const isErrorAlready = event.type == "error";
        let helpfulMessage;
        if (!isErrorAlready) {
            // console.error(event);
            const error = caughtError ? "Error thrown in" : "unhandled event:";

            // double errors being reported?  see commit message
            const errorWithFriendlyStack = new Error("");
            {
                let foundFramework = false;
                let callerStack = [];
                let handlerStack = [];
                for (const line of (
                    caughtError || errorWithFriendlyStack
                ).stack.split("\n")) {
                    if (
                        line.match(
                            /wrappedHandler|trigger|dispatchWithHandledDetection/
                        )
                    ) {
                        foundFramework = true;
                    } else if (!line.match(/react-dom/)) {
                        if (foundFramework) {
                            callerStack.push(line);
                        } else {
                            handlerStack.push(line);
                        }
                    }
                }
                const filteredStack = [
                    ...handlerStack,
                    "in handler ^^^^^  ...called from vvvvv",
                    ...callerStack,
                ].join("\n");
                let firstReactor = "";
                let elInfo = [];
                {
                    for (let p = event.target; !!p; p = p.parentNode) {
                        if (!p.classList) continue;
                        if (!p.classList.contains("reactor")) continue;
                        if (p.classList.contains("_fw_")) continue;
                        const thisElInfo = elementInfo(p);
                        firstReactor = firstReactor || ` (in ${thisElInfo})`;
                        elInfo.push(thisElInfo);
                    }
                    elInfo = elInfo.reverse().join("\n");
                }
                helpfulMessage =
                    `${error} ${eventDesc}` +
                    ((caughtError && ": " + caughtError.message) || "") +
                    firstReactor;

                errorWithFriendlyStack.message = helpfulMessage;
                if (foundFramework)
                    errorWithFriendlyStack.stack = `${helpfulMessage}\n${elInfo}\n${filteredStack}`;
                if (caughtError)
                    errorWithFriendlyStack.originalError = caughtError;
            }
            const unk = new CustomEvent("error", {
                bubbles: true,
                detail: {
                    // debug:1,
                    error: helpfulMessage,
                    reactor: " ", // suppress redundant info (??? move all of this to the error-notification?)
                    ...detail,
                },
            });
            target.dispatchEvent(unk);
            // if the error event is handled, it indicates the error was successfully
            // processed by a UI-level actor (displaying it for the user to act on)
            if (!(unk.handledBy && unk.handledBy.length)) {
                // when that ‹unk› event isn't handled, it's typically thrown to the
                // console as an error that was not presented to the user (in a later call
                // into this same method)
            } else {
                // still, we show the full error detail on the console for the developer
                // to be able to act on:
                return console.error(errorWithFriendlyStack);
            }

            // event = unk
        }

        if (caughtError) {
            caughtError.stack =
                `Error thrown in ${eventDesc}:\n` + caughtError.stack;

            throw caughtError;
        }

        const message =
            this.events && this.events[event.type]
                ? `unhandled ${eventDesc} with no ‹Subscribe ${event.type}={handlerFunction}›\n`
                : `unhandled ${eventDesc}.  Have you included an Actor that services this event?\n` +
                  (isErrorAlready
                      ? ""
                      : "Add an 'error' event handler to catch errors for presentation in the UI.");

        logger(
            `${message}\n  ...at DOM Target: ${
                event.target && elementInfo(event.target)
            }\n`,
            event.detail,
            stackTrace
        );
        console.error(
            message,
            event.detail,
            `\n  ...at DOM Target:  `,
            event.target && event.target,
            "\n",
            stackTrace
        );
    }
};

Reactor.bindWarning =
    "use @autobind (with 'import {autobind} from @poshplum/utils/browser;') or Reactor.bindWithBreadcrumb to fix";
Reactor.bindWithBreadcrumb = function (fn, boundThis, fnName, ...args) {
    if (!fn)
        throw new Error(
            `Reactor.bindWithBreadcrumb(fn, targetObj, fnName): no function provided`
        );
    const bound = fn.bind(boundThis, ...args);
    if (!fnName) fnName = fn;
    if (!fnName)
        throw new Error(
            `Reactor.bindWithBreadcrumb(fn, targetObj, fnName) requires function to have a name or arg3`
        );
    bound.boundThis = boundThis;
    bound.boundName = fnName;
    bound.boundArgs = args;
    bound.targetFunction = fn;
    bound.innerFunction = fn.innerFunction || fn;
    bound.innerThis = fn.innerThis || fn.boundThis || boundThis;

    return bound;
};

export function autobind(proto, name, descriptor) {
    let func = descriptor.value;
    throw new Error(`use @poshplum/utils/browser`);

    if ("function" !== typeof func) {
        throw new TypeError(`@autobind must only be used on instance methods`);
    }

    return {
        configurable: true,
        get() {
            const bound = Reactor.bindWithBreadcrumb(func, this, name);
            Object.defineProperty(this, name, {
                configurable: false,
                get() {
                    return bound;
                },
            });
            return bound;
        },
    };
}

Reactor.Events = {
    reactorProbe: "reactorProbe",
    registerAction: "registerAction",
    removeAction: "removeAction",
    registerActor: "registerActor",
    removeActor: "removeActor",
    registerPublishedEvent: "registerPublishedEvent",
    removePublishedEvent: "removePublishedEvent",
    registerSubscriber: "registerSubscriber",
    removeSubscriber: "removeSubscriber",
    errorEvent: "error",
};
Reactor.EventFactory = (type) => {
    const t = typeof type;

    if (t !== "string") {
        console.error("EventFactory: bad type for ", t);
        throw new Error(
            `EventFactory(type): ^^^ type must be a string, not ${t}`
        );
    }

    return (...args) => {
        const [{ ...eventProps } = {}] = args;
        const { debug } = eventProps;
        const dbg = debugInt(debug);
        logger(`+Event: ${type}: `, eventProps);
        if (dbg > 1) console.log(`+Event: ${type}: `, eventProps);
        if (dbg > 2) debugger;
        return new CustomEvent(type, {
            debug,
            bubbles: true,
            detail: eventProps,
        });
    };
};

Reactor.ReactorProbe = Reactor.EventFactory(Reactor.Events.reactorProbe);

Reactor.RegisterAction = Reactor.EventFactory(Reactor.Events.registerAction);
Reactor.RemoveAction = Reactor.EventFactory(Reactor.Events.removeAction);

Reactor.RegisterActor = Reactor.EventFactory(Reactor.Events.registerActor);
Reactor.RemoveActor = Reactor.EventFactory(Reactor.Events.removeActor);

Reactor.PublishEvent = Reactor.EventFactory(
    Reactor.Events.registerPublishedEvent
);
Reactor.RemovePublishedEvent = Reactor.EventFactory(
    Reactor.Events.removePublishedEvent
);

Reactor.SubscribeToEvent = Reactor.EventFactory(
    Reactor.Events.registerSubscriber
);
Reactor.StopSubscribing = Reactor.EventFactory(Reactor.Events.removeSubscriber);

Reactor.ErrorEvent = Reactor.EventFactory(Reactor.Events.errorEvent);
Reactor.elementInfo = elementInfo;

Reactor.Action = Action;

Reactor.Publish = Publish;
