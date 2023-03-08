import React from "react";
import { inheritName } from "../helpers/ClassNames";
import { trace, Reactor, logger, debugInt } from "../Reactor";
import { Listener } from "./Listener";

export function Actor(componentClass) {
    if (
        !componentClass.prototype.name ||
        "function" !== typeof componentClass.prototype.name
    ) {
        throw new Error(
            "Actors require a name() method; this name identifies the actor's delegate name for its Reactor, and scopes its Actions"
        );
    }

    const listenerClass = Listener(componentClass);

    const displayName = inheritName(componentClass, "🎭");
    const className = inheritName(componentClass, "Actor");

    const clazz = class ActorInstance extends listenerClass {
        static get name() {
            return displayName;
        }
        get unlistenDelay() {
            return 50;
        }
        eventPrefix() {
            return `${this.name()}:`;
        }

        constructor(props) {
            super(props);
            trace(`${displayName}: +Actor`);
            this._actorRef = React.createRef();
            this.addActorNameToRegisteredAction = Reactor.bindWithBreadcrumb(
                this.addActorNameToRegisteredAction,
                this
            );
            this.registerActor = Reactor.bindWithBreadcrumb(
                this.registerActor,
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
        }

        registerActor() {
            throw new Error(
                "nested Actors not currently supported.  If you have a use-case, please create a pull req demonstrating it"
            );
        }

        registerPublishedEventEvent(event) {
            const {
                target,
                detail: { name, debug },
            } = event;

            let newName = `${this.name()}:${name}`;
            trace(`${displayName}: registering ‹Publish›ed event`, newName);
            event.detail.actor = this;
            event.detail.name = newName;
        }

        removePublishedEvent(event) {
            let { name, debug } = event.detail;
            let newName = `${this.name()}:${name}`;
            trace("unregistering ‹Publish›ed event", newName);
            event.detail.actor = this;
            event.detail.name = newName;
        }

        addActorNameToRegisteredAction(registrationEvent) {
            if (!registrationEvent.detail) {
                logger(
                    `${this.constructor.name}: registerAction: registration event has no details... :(`
                );
                console.error(
                    `${this.constructor.name}: registerAction: registration event has no details... :(`
                );
                debugger;
            }
            let { name, debug, observer, bare } = registrationEvent.detail;
            let dbg = debugInt(debug);
            let moreDebug = dbg > 1;
            const actorName = this.name();
            let newName = bare || observer ? name : `${actorName}:${name}`;
            logger(
                `${this.constructor.name} delegating registerAction(${name} -> ${newName}) to upstream Reactor`
            );
            if (dbg)
                console.log(
                    `${this.constructor.name} delegating registerAction(${name} -> ${newName}) to upstream Reactor`
                );
            if (moreDebug) {
                console.log(registrationEvent);
                debugger;
            }

            registrationEvent.detail.name = newName;
            registrationEvent.detail.actorName = actorName;
            registrationEvent.detail.shortName = name;

            // super.registerActionEvent(registrationEvent);
            // registrationEvent.stopPropagation();
        }

        listen(
            eventName,
            handler,
            capture,
            { at, isInternal, bare, observer, returnsResult, isAsync } = {}
        ) {
            let { debug } = this.props;
            let dbg = debugInt(debug);
            trace(`${this.constructor.name}: listening to ${eventName}`);
            if (dbg) {
                console.log(
                    `${this.constructor.name}: listening to ${eventName}`
                );
            }
            return this._listen(eventName, handler, capture, {
                at,
                isInternal,
                bare,
                observer,
                returnsResult,
                isAsync, 
            });
        }

        render() {
            let { _reactorDidMount: mounted } = this.state || {};
            trace(`${this.constructor.name}: actor rendering`);

            return (
                <div
                    style={{ display: "contents" }}
                    className={`actor for-${displayName}`}
                    ref={this._listenerRef}
                >
                    {mounted && super.render && super.render()}
                </div>
            );
        }
        shouldComponentUpdate(nextProps, nextState) {
            if (
                nextState &&
                nextState._reactorDidMount &&
                (!this.state || !this.state._reactorDidMount)
            ) {
                return true;
            }
            if (super.shouldComponentUpdate)
                return super.shouldComponentUpdate(nextProps, nextState);
            return true;
        }

        componentDidMount() {
            let { debug } = this.props;
            let name = this.name();
            if (!name) {
                debugger;
                return this.trigger("error", {
                    error: `actor can't be registered; its name() method must return a string.`,
                    single: true,
                });
            }
            trace(`${displayName}: ${name} -> didMount`);

            // if(foundKeys[0] == "action") debugger;
            const {
                detail: { registeredWith: reactor },
            } =
                this.trigger(
                    Reactor.RegisterActor({
                        name,
                        actor: this,
                        single: true,
                        debug,
                    })
                ) || {};
            this._reactor = reactor;
            for (const init of Actor.onInit) {
                init.call(this);
            }

            if (super.componentDidMount) super.componentDidMount();

            let dbg = debugInt(debug);
            logger(`${this.constructor.name} didMount`);
            if (dbg) {
                console.log(`${this.constructor.name} didMount`);
            }

            this.listen(
                Reactor.Events.registerAction,
                this.addActorNameToRegisteredAction,
                false,
                { isInternal: true, observer: true }
            );
            this.listen(
                Reactor.Events.registerPublishedEvent,
                this.registerPublishedEventEvent,
                false,
                { isInternal: true, observer: true }
            );
            this.listen(
                Reactor.Events.removePublishedEvent,
                this.removePublishedEvent,
                false,
                { isInternal: true, observer: true }
            );

            setTimeout(() => {
                if (this._unmounting) return;
                this.setState({ _reactorDidMount: true });
            }, 0);
            trace(`${displayName}: ${name} <- didMount`);
        }

        componentWillUnmount() {
            if (super.componentWillUnmount) super.componentWillUnmount();

            let name = this.name();
            if (!this._listenerRef.current) {
                console.warn(
                    `Actor ${displayName} has no _listenerRef - forcibly unmounted?`
                );
                return;
            }
            trace(`${displayName}: Actor unmounting:`, name);
            Reactor.trigger(
                this._listenerRef.current,
                Reactor.RemoveActor({ name, single: true })
            );
        }
    };
    Object.defineProperty(clazz, "name", { value: className });
    Object.defineProperty(clazz, "displayName", { value: displayName });
    return clazz;
}
Actor.onInit = [];
