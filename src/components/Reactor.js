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

import React from "react";
import * as ReactDOM from "react-dom";
import {inheritName} from "../helpers/ClassNames";
import dbg from 'debug';
const logger = dbg('reactor');

const elementInfo = (el) => {
  // debugger
  function esc(inp) {
    return inp.replace(/\./g, '\\.')
  }
  const classNames = el.classList.toString().split(/ /).map(esc).join('.');
  return `<${el.constructor.name}.${classNames}#${esc(el.id)}>`;
};

const debugInt = (debug) => {
  return (debug ?
    (typeof debug) == "string" ?
      parseInt(debug)
      : ((0 + debug) || 1)
    : 0);
};

const stdHandlers = {
  'registerAction': 1,
  'registerActor': 1,
  'registerPublishedEvent': 1,
  'registerSubscriber': 1,
  'removeAction': 1,
  'removeActor': 1,
  'removePublishedEvent': 1,
  'removeSubscriber': 1,
  'reactorProbe':1,
};

const Listener = (componentClass) => {
  const componentClassName = componentClass.name;
  let displayName = inheritName(componentClass, "👂");

  const clazz = class Listener extends componentClass {
    listening = [];
    constructor() {
      super()
      this._listenerRef = React.createRef();
    }
    get unlistenDelay() {
      throw new Error("listeners must provide an instance-level property unlistenDelay, for scheduling listener cleanups")
    }
    listen(eventName, handler, capture) {
      logger(`${this.constructor.name}: each Listener-ish should explicitly define listen(eventName, handler), with a call to _listen(eventName, handler) in addition to any additional responsibilities it may take on for event-listening`);
      console.warn(`${this.constructor.name}: each Listener-ish should explicitly define listen(eventName, handler), with a call to _listen(eventName, handler) in addition to any additional responsibilities it may take on for event-listening`);
      return this._listen(eventName, handler, capture);
    }

    _listen(eventName, handler, capture) {
      const listening = this.listening;
      // console.warn("_listen: ", eventName, handler);
      const wrappedHandler = this._wrapHandler(handler);
      const newListener = this._listenerRef.current.addEventListener(eventName, wrappedHandler, {capture});
      // console.log(listening);
      listening.push([eventName, wrappedHandler]);
      return wrappedHandler
      // console.log(listening);
    }

    componentDidMount() {
      if (super.componentDidMount) super.componentDidMount();

      if (!this._listenerRef) {
        let msg = `${this.constructor.name}: requires this._listenerRef to be set in constructor.`;
        logger(msg)
        console.error(msg);
        throw new Error(msg)
      }
      if (!this._listenerRef.current) {
        let msg = `${this.constructor.name}: requires this._listenerRef.current to be set with ref={this._listenerRef}`;
        logger(msg)
        console.error(msg);
        throw new Error(msg)
      }
    }

    componentWillUnmount() {
      if (super.componentWillUnmount) super.componentWillUnmount();
      let {debug} = this.props;
      const dbg = debugInt(debug);
      logger(`${this.constructor.name}: unmounting and deferred unlistening all...`)
      if (dbg) {
        console.log(`${this.constructor.name}: unmounting and deferred unlistening all...`)
      }
      let el = this._listenerRef.current;
      const stack = new Error("Backtrace");

      setTimeout(() => {
        logger(`${this.constructor.name} deferred unlisten running now`)
        if (dbg) console.warn(`${this.constructor.name} deferred unlisten running now`)
        this.listening.forEach((listener) => {
          let [type,handler] = listener;
          if (!handler) return;
          if (!stdHandlers[type]) {
            logger(`${this.constructor.name} unmounting (re?)Actor leaked '${type}' handler`)
            console.warn(`${this.constructor.name} unmounting (re?)Actor leaked '${type}' handler`)
            if(dbg) console.warn(stack)
          }

          this.unlisten(listener, el);
        });
      }, this.unlistenDelay)
    }

    unlisten(typeAndHandler, el=this._listenerRef.current) {
      let [type,handler] = typeAndHandler;
      let foundListening = this.listening.find(([ltype, lhandler]) => {
        return type == ltype
      });
      if (!foundListening) {
        console.warn(`listener ${type} not found/matched in listeners`, this.listening);
      } else if (!foundListening[1]) {
        console.warn(`listener ${type} already removed`);
      } else if (foundListening[1] !== handler) {
        console.warn(`listener ${type} handler mismatch`);
      }
      if (!handler) return
      if (!el) throw new Error(`no el to unlisten for ${type}` );

      el.removeEventListener(type, handler);
      if (foundListening) foundListening[1] = null;
    }

    _wrapHandler(handler) {
      const reactor = this;
      function wrappedHandler(event) {
        const {type, detail} = (event || {});
        const {debug} = (detail || {});

        const dbg = debugInt(debug);
        const moreDebug  = (dbg > 1);

        event.handledBy = event.handledBy || [];
        const listenerObj = handler.boundThis || Reactor.bindWarning;
        let handled = {
          reactor,
          reactorNode: this,
          listenerObj,
          listenerFunction: handler.targetFunction || handler
        };
        if (!handled.reactorNode) debugger;

        const listenerTarget = handler.boundThis && handler.boundThis.constructor.name;
        const listenerFunction = (handler.targetFunction || handler).name;
        if (dbg) {
          const msg = `${reactor.constructor.name}: Event: ${type} - calling handler ${listenerTarget}.${listenerFunction}`;
          logger(msg);

          if (moreDebug) {
            console.log(msg, {
              handled,
              triggeredAt: elementInfo(event.target),
              listenerTarget,
              listenerFunction
            });
            debugger;
          } else {
            console.log(msg);
          }
        }
        const result = handler.call(this,event); // retain event's `this` (target of event)
        if (result === undefined || !!result) {
          event.handledBy.push(handled);
        }
      }
      let tryEventHandler = function(e) {
        let result;
        try {
          result = wrappedHandler.call(this, e); // retain event's `this`
        } catch(error) {
          console.error(error);
          logger(error)
          throw(error)
        }
        return result;
      }
      tryEventHandler.innerHandler = handler && handler.targetFunction || handler;
      return tryEventHandler
    }
  }
  Object.defineProperty(clazz, "name", {value: displayName})
  return clazz;
};

export const Actor = (componentClass) => {
  if (!componentClass.prototype.name) {
    throw new Error("Actors require a name() method; this name identifies the actor's delegate name for its Reactor, and scopes its Actions");
  }

  const listenerClass = Listener(componentClass);

  let displayName = inheritName(listenerClass, "Actor");

  return class ActorInstance extends listenerClass {
    static get name() { return displayName };
    get unlistenDelay() {
      return 50
    }

    constructor(props) {
      super(props);
      this._actorRef = React.createRef();
      this.addActorNameToRegisteredAction = Reactor.bindWithBreadcrumb(this.addActorNameToRegisteredAction, this);
      this.registerActor = Reactor.bindWithBreadcrumb(this.registerActor, this);
      this.registerPublishedEventEvent = Reactor.bindWithBreadcrumb(this.registerPublishedEventEvent, this);
      this.removePublishedEvent = Reactor.bindWithBreadcrumb(this.removePublishedEvent, this);

    }

    registerActor() {
      throw new Error("nested Actors not currently supported.  If you have a use-case, please create a pull req demonstrating it")
    }
    registerPublishedEventEvent(event) {  // doesn't handle the event; augments it with actor name
      const {target, detail:{name, debug}} = event;

      let newName = `${this.name()}:${name}`;
      console.log("registering", newName)
      event.detail.name = newName;
    }

    removePublishedEvent(event) {   // doesn't handle the event; augments it with actor name
      let {name, actor, debug} = event.detail;
      let newName = `${this.name()}:${name}`;
      console.log("unregistering", newName)
      event.detail.name = newName;
    }

    addActorNameToRegisteredAction(registrationEvent) {
      if(!registrationEvent.detail) {
        logger(`${this.constructor.name}: registerAction: registration event has no details... :(`)
        console.error(`${this.constructor.name}: registerAction: registration event has no details... :(`);
        debugger
      }
      let {name,debug} = registrationEvent.detail;
      let dbg = debugInt(debug);
      let moreDebug = (dbg > 1);
      let newName = `${this.name()}:${name}`;
      logger(`${this.constructor.name} delegating registerAction(${name} -> ${newName}) to upstream Reactor`)
      if (dbg) console.log(`${this.constructor.name} delegating registerAction(${name} -> ${newName}) to upstream Reactor`);
      if (moreDebug) {
        console.log(event);
        debugger
      }

      registrationEvent.detail.name = newName;
      // super.registerActionEvent(registrationEvent);
      // registrationEvent.stopPropagation();
    }

    listen(eventName, handler) {
      let {debug} = this.props;
      let dbg = debugInt(debug);
      logger(`${this.constructor.name}: listening to ${eventName}`)
      if (dbg) {
        console.log(`${this.constructor.name}: listening to ${eventName}`);
      }
      return this._listen(eventName, handler);
    }

    render() {
      let {_reactorDidMount: mounted} = (this.state || {});
      return <div className={`actor actor-for-${displayName}`} ref={this._listenerRef}>
        {mounted && super.render && super.render()}
      </div>;
    }

    trigger(event, detail) {
      if (!(event instanceof Event)) {
        event = `${this.name()}:${event}`;
      }
      return Reactor.trigger(this._listenerRef.current, event, detail);
    }
    componentDidMount() {
      if (super.componentDidMount) super.componentDidMount();
      let {debug} = this.props;

      let dbg = debugInt(debug);
      logger(`${this.constructor.name} didMount`)
      if (dbg) {
        console.log(`${this.constructor.name} didMount`);
      }
      let name = this.name();
      this.listen(Reactor.Events.registerAction, this.addActorNameToRegisteredAction);
      this.listen(Reactor.Events.registerPublishedEvent, this.registerPublishedEventEvent);
      this.listen(Reactor.Events.removePublishedEvent, this.removePublishedEvent);

      // if(foundKeys[0] == "action") debugger;
      this.trigger(
        Reactor.RegisterActor({name, actor:this, debug})
      );

      this.setState({_reactorDidMount: true});
    }

    componentWillUnmount() {
      if (super.componentWillUnmount) super.componentWillUnmount();

      let name = this.name();
      // console.warn("Actor unmounting", name)
      Reactor.trigger(this._listenerRef.current,
        Reactor.RemoveActor({name})
      );

    }

  }
};


const reactorTag = Symbol("Reactor");
const Reactor = (componentClass) => {
  if (componentClass[reactorTag]) return componentClass;

  const listenerClass = Listener(componentClass);
  const componentClassName = componentClass.name;
  const reactorName = inheritName(componentClass, "Rx");

  const clazz = class ReactorInstance extends listenerClass {
    // registerActionEvent = Reactor.bindWithBreadcrumb(this.registerActionEvent, this);
    constructor() {
      super();
      this.Name = reactorName;

      this.reactorProbe = Reactor.bindWithBreadcrumb(this.reactorProbe, this);

      this.registerActionEvent = Reactor.bindWithBreadcrumb(this.registerActionEvent, this);
      this.removeAction = Reactor.bindWithBreadcrumb(this.removeAction, this);

      this.registerActor = Reactor.bindWithBreadcrumb(this.registerActor, this);
      this.removeActor = Reactor.bindWithBreadcrumb(this.removeActor, this);

      this.registerPublishedEventEvent = Reactor.bindWithBreadcrumb(this.registerPublishedEventEvent, this);
      this.removePublishedEvent = Reactor.bindWithBreadcrumb(this.removePublishedEvent, this);

      this.registerSubscriber = Reactor.bindWithBreadcrumb(this.registerSubscriber, this);
      this.removeSubscriberEvent = Reactor.bindWithBreadcrumb(this.removeSubscriberEvent, this);
      this.listening = [];

      this.actions = {}; // known direct actions
      this.events = {
      };  // known direct events
      this.actors = {};  // registered actors
      this.registeredSubscribers = {}; // registered listening agents
    }

    componentDidMount() {
      if (super.componentDidMount) super.componentDidMount();
      this.el = this._listenerRef.current;
      this.registerPublishedEvent({name:"error", target: this});

      // this.myNode = ReactDOM.findDOMNode(this);
      this.listen(Reactor.Events.reactorProbe, this.reactorProbe);

      this.listen(Reactor.Events.registerAction, this.registerActionEvent);
      this.listen(Reactor.Events.removeAction, this.removeAction);

      this.listen(Reactor.Events.registerActor, this.registerActor);
      this.listen(Reactor.Events.removeActor, this.removeActor);

      this.listen(Reactor.Events.registerPublishedEvent, this.registerPublishedEventEvent);
      this.listen(Reactor.Events.removePublishedEvent, this.removePublishedEvent);

      this.listen(Reactor.Events.registerSubscriber, this.registerSubscriber);
      this.listen(Reactor.Events.removeSubscriber, this.removeSubscriberEvent);

      this.setState({_reactorDidMount: true});
    }
    get unlistenDelay() {
      return 100
    }

    listen(eventName, handler, capture) { // satisfy listener
      let wrappedHandler = this._listen(eventName, handler, capture);

      // console.warn("+listen ", eventName, handler, {t:{t:this}}, this.actions)
      return wrappedHandler;
    }


    reactorProbe(event) {
      let {onReactor} = event.detail;
      if (!onReactor) {
        this.trigger(Reactor.ErrorEvent({error: "reactorProbe requires an onReactor callback in the event detail"}))
        return;
      }
      onReactor(this);
    }

    registerActionEvent(event) {
      const {debug, name, capture, handler, ...moreDetails} = event.detail;
      this.registerAction({debug, name, handler, capture, ...moreDetails});
      event.stopPropagation();
    }

    registerAction({debug, name, handler, capture, ...moreDetails}) {
      const dbg = debugInt(debug);
      const moreDebug = (dbg > 1);
      logger(`${this.constructor.name} registering action '${name}'`)
      if (dbg) {
        console.log(`${this.constructor.name} registering action '${name}': `,
          moreDetails, `handler=${handler.name}`, moreDebug ? handler : "...(debug=2 for more)"
        );
        if (moreDebug) debugger;
      }

      const existingHandler = this.actions[name];
      if (existingHandler) {
        let info = {
          listenerFunction: (existingHandler.targetFunction || existingHandler).name,
          listenerTarget: (
            (existingHandler.boundThis && existingHandler.boundThis.constructor.name)
            || Reactor.bindWarning
          ),
        };

        const msg = `${this.constructor.name}: Action '${name}' is already registered with a handler`;
        logger(msg)
        console.error(msg);
        console.warn("existing handler info: ", info);
        throw new Error(msg);
      }
      const wrappedHandler = this.listen(name, handler, capture);
      this.actions[name] = wrappedHandler;
    }

    removeAction(event) {
      const {debug, name, handler, ...moreDetails} = event.detail;
      logger(`${this.constructor.name}: removing action:`, event.detail)
      if(debug) console.log(`${this.constructor.name}: removing action:`, event.detail);
      // debugger

      if (!this.actions[name]) {
        logger(`can't removeAction '${name}' (not registered)`, new Error("Backtrace"));
        console.warn(`can't removeAction '${name}' (not registered)`, new Error("Backtrace"));
      } else {
        // debugger
        this.unlisten([name, this.actions[name]], this.el);
        delete this.actions[name];
        event.stopPropagation();
      }
      // event.stopPropagation();

    }
    registerPublishedEventEvent(event) {
      const {target, detail:{name, debug}} = event;
      this.registerPublishedEvent({name,debug, target})

      event.stopPropagation();
    }

    registerPublishedEvent({name, debug, target}) {
      logger("registering published event", name)
      if (debug) console.warn("registering published event", name);
      if (this.events[name]) {
        logger(`Event '${name}' already registered by`, this.events[name])
        console.error(`Event '${name}' already registered by`, this.events[name]);
      } else {
        this.events[name] = target;

        let subscriberFanout = this.registeredSubscribers[name] = {
          fn: (event) => {
            logger(`got event ${name}, dispatching to ${subscriberFanout.subscribers.length} listeners`)
            if (debug) console.warn(`got event ${name}, dispatching to ${subscriberFanout.subscribers.length} listeners`);
            // if (debug) console.warn(listenerFanout.listeners);
            let anyHandled = null;
            subscriberFanout.subscribers.forEach((subscriberFunc) => {
              const r = subscriberFunc(event);
              if (r == undefined || !!r) {
                anyHandled = r
              }
              // ?? honor stopPropagation[immediate] ?
            });

            return anyHandled;
          },
          subscribers: []
        };

        subscriberFanout._fan = this.listen(name, subscriberFanout.fn);
      }
    }
    trigger(eventName) {
      if (this.events[eventName]) {
        Reactor.dispatchTo(this._listenerRef.current, new CustomEvent(eventName, {bubbles:true}));
      } else {
        Reactor.dispatchTo(this._listenerRef.current, Reactor.ErrorEvent({
          error: `trigger(eventType): unknown event type ${eventName}`,
          backtrace: new Event("stack")
        }));
      }
    }

    removePublishedEvent(event) {
      let {name, actor, debug} = event.detail;
      console.error("test me");
      // !!! check for registeredListeners to this event, issue a orphanedListener event
      const subscriberFanout = this.registeredSubscribers[name]
      const foundSubscribers = subscriberFanout.subscribers.length;
      if (foundSubscribers) {
        console.error(`removing published event with ${foundSubscribers} orphaned subscribers`);
      }
      this.unlisten([name, subscriberFanout._fan]);

      if (!this.events[name]) {
        console.warn(`can't removePublishedEvent '${name}' (not registered)`);
      } else {
        delete this.events[name];
        event.stopPropagation();
      }
    }

    registerActor(event) {
      let {name, actor, debug} = event.detail;
      logger(this.constructor.name, `registering actor '${name}'`)
      if(debug) console.info(this.constructor.name, `registering actor '${name}'`);
      if(this.actors[name]) {
        console.error(`Actor named '${name}' already registered`, this.actors[name])
      } else {
        this.actors[name] = actor;
      }
      event.stopPropagation();
    }

    removeActor(event) {
      let {name} = event.detail;
      if(this.actors[name]) {
        delete this.actors[name]
        event.stopPropagation();
      } else {
        console.error(`ignoring removeActor event for name '${name}' (not registered)`)
      }
    }

    registerSubscriber(event) {

      let {eventName, listener, debug} = event.detail;
      eventName = eventName.replace(/\u{ff3f}/u, ':');
      if (!this.events[eventName]) {
        if (this.isEventCatcher) {
          const message = `${this.constructor.name}: <Subscribe ${eventName}>: no '${eventName}' event is <Publish>'d`;
          console.warn(message);

          this._listenerRef.current.dispatchEvent(
            Reactor.ErrorEvent({error: message, detail:event.detail, backtrace: new Error("stack"), listener})
          );
          return true
        } else {
          logger(`${this.constructor.name}: ignored unknown registerSubscriber request`, event.detail);
          if (debug) console.warn(`${this.constructor.name}: ignored unknown registerSubscriber request`, event.detail);
        }
        return false
      } else {
        logger(`${this.constructor.name}: registering subscriber for `, {eventName, debug, listener});
        if (debug) console.warn(`${this.constructor.name}: registering subscriber for `, {eventName, debug, listener});
      }
      event.stopPropagation();
      logger(`${this.constructor.name}: registering subscriber to '${eventName}': `, listener, new Error("...stack trace"))
      if (debug > 1) console.warn(`${this.constructor.name}: registering subscriber to '${eventName}': `, listener, new Error("...stack trace"));

      // setTimeout(() => {
        this.addSubscriberEvent(eventName, listener, debug);
      // }, 1)
    }

    addSubscriberEvent(eventName, listener, debug) {
      let subscriberFanout;
      if (subscriberFanout = this.registeredSubscribers[eventName]) {
        subscriberFanout.subscribers.push(listener);

        return;
      } else {
        throw new Error("bad subscriber name")
      }
    }

    removeSubscriberEvent(event) {
      let {eventName, listener, debug} = event.detail;
      eventName = eventName.replace(/\u{ff3f}/u, ':');

      let subscriberFanout = this.registeredSubscribers[eventName];
      if (!subscriberFanout) {
        if (this.isEventCatcher) {
          const message = `${this.constructor.name} in removeSubscriber: unknown event ${eventName}`;
          logger(message)
          console.warn(message);
          this._listenerRef.current.dispatchEvent(
            Reactor.ErrorEvent({error: message, backtrace: new Error("stack"), listener})
          )
        }
        return
      }
      event.stopPropagation();
      this.removeSubscriber(eventName, listener, debug);
    }

    removeSubscriber(eventName, listener, debug) {
      let subscriberFanout = this.registeredSubscribers[eventName];

      logger(`${this.constructor.name}: removing subscriber to '${eventName}': `, listener);
      if (debug) console.warn(`${this.constructor.name}: removing subscriber to '${eventName}': `, listener,
        new Error("...stack trace")
      );

      const before = subscriberFanout.subscribers.length;
      subscriberFanout.subscribers = subscriberFanout.subscribers.filter((f) => {
        // console.error("compare:", f, listener, f === listener);
        return f !== listener
      });
      const after = subscriberFanout.subscribers.length;


      if (before === after) {
        logger(`${this.constructor.name}: no subscribers removed for ${eventName}`)
        console.warn(`${this.constructor.name}: no subscribers removed for ${eventName}`)
      } else {
        logger(`${this.constructor.name}: removed a subscriber for ${eventName}; ${after} remaining`);
        if (debug)
          console.warn(`${this.constructor.name}: removed a subscriber for ${eventName}; ${after} remaining`);
      }

      if (after === 0) {
        // this.unlisten([eventName, subscriberFanout._fan]);
        // delete this.registeredSubscribers[eventName];
      }
    }

    render() {
      let {_reactorDidMount: mounted} = (this.state || {});
      return <div ref={this._listenerRef} className={`reactor-for-${componentClassName}`}>
        {mounted && super.render()}
      </div>
    }
  }
  Object.defineProperty(clazz, reactorTag, { value: true });
  Object.defineProperty(clazz, 'name', { value: reactorName})
  return clazz;
};
Reactor.dispatchTo = Reactor.trigger = function dispatchWithHandledDetection(target, event, {bubbles=true,...detail}={}) {
  if (!(target instanceof Element)) {
    const msg = "Reactor.dispatchTo: missing required arg1 (must be a DOM node)"
    logger(msg)
    const error = new Error(msg);
    console.warn(error);
    throw error;
  }

    if (!(event instanceof Event)) {
    event = new CustomEvent(event, {bubbles, detail});
  }
  target.dispatchEvent(event);
  if (event.handledBy && event.handledBy.length) return;

  throwUnhandled.bind(this)(event);

  function throwUnhandled(event) {
    const isErrorAlready = event.type == "error"
    if (!isErrorAlready) {
      // console.error(event);
      const unk = new CustomEvent("error", {bubbles:true, detail: {
          // debug:1,
          error: `unhandled event ${event.type}`,
          ...detail
        }});
      target.dispatchEvent(unk);
      // if the error event is handled, it indicates the error was successfully
      // processed by a UI-level actor (displaying it for the user to act on)
      if (unk.handledBy && unk.handledBy.length) return;

      // event = unk
    }
    const message = this.events && this.events[event.type] ?
      `unhandled event '${event.type}' with no <Subscribe ${event.type}={handlerFunction} />\n` :
      `unhandled event '${event.type}'.  Have you included an Actor that services this event?\n`+
        (isErrorAlready ? "" : "Add an 'error' event handler to catch errors for presentation in the UI.");

    logger(message,
      event.detail,
      `...at DOM Target:  `, (event.target && event.target.outerHTML), "\n",
      new Error("Backtrace:")
    );
    console.error(message,
      event.detail,
      `...at DOM Target:  `, (event.target && event.target.outerHTML), "\n",
      new Error("Backtrace:")
    );
  }
};

Reactor.bindWarning = "unknown binding (use Reactor.bindWithBreadcrumb to fix)";
Reactor.bindWithBreadcrumb = function(fn, boundThis) {
  const bound = fn.bind(boundThis);
  bound.boundThis = boundThis;
  bound.targetFunction = fn;
  return bound;
};

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
  errorEvent: "error"
};
Reactor.EventFactory = (type) => {
  const t = typeof type;

  if (t !== "string") {
    console.error("EventFactory: bad type for ", t);
    throw new Error(`EventFactory(type): ^^^ type must be a string, not ${t}`);
  }


  return (...args) => {
    const [{ ...eventProps}={}] = args;
    const {debug} = eventProps;
    const dbg = debugInt(debug);
    logger(`+Event: ${type}: `, eventProps)
    if (dbg > 1) console.log(`+Event: ${type}: `, eventProps);
    if (dbg > 2) debugger;
    return new CustomEvent(type, {
      debug,
      bubbles: true,
      detail: eventProps
    });
  }
};

Reactor.ReactorProbe = Reactor.EventFactory(Reactor.Events.reactorProbe);

Reactor.RegisterAction = Reactor.EventFactory(Reactor.Events.registerAction);
Reactor.RemoveAction = Reactor.EventFactory(Reactor.Events.removeAction);

Reactor.RegisterActor = Reactor.EventFactory(Reactor.Events.registerActor);
Reactor.RemoveActor = Reactor.EventFactory(Reactor.Events.removeActor);

Reactor.PublishEvent = Reactor.EventFactory(Reactor.Events.registerPublishedEvent);
Reactor.RemovePublishedEvent = Reactor.EventFactory(Reactor.Events.removePublishedEvent);

Reactor.SubscribeToEvent = Reactor.EventFactory(Reactor.Events.registerSubscriber);
Reactor.StopSubscribing = Reactor.EventFactory(Reactor.Events.removeSubscriber);

Reactor.ErrorEvent = Reactor.EventFactory(Reactor.Events.errorEvent);
Reactor.elementInfo = elementInfo;

export default Reactor;

export class Action extends React.Component {
  constructor(props) {
    super(props);
    this._actionRef= React.createRef();
  }

  render() {
    let {children, capture, id, client, debug, ...handler} = this.props;
    const foundKeys = Object.keys(handler);
    const foundName = foundKeys[0];

    return <div {...{id}} className={`action action-${foundName}`} ref={this._actionRef} />;
  }

  componentDidMount() {
    let {children, id, capture, name, client="<unknown>", debug, ...handler} = this.props;
    if (super.componentDidMount) super.componentDidMount();

    const foundKeys = Object.keys(handler);
    if (foundKeys.length > 1) {
      throw new Error("Actions should only have a single prop - the action name. (plus 'debug', 'id')\n"+
        "If your action name can't be a prop, specify it with name=, and the action function with action="
      );
    }
    const foundName = foundKeys[0];
    handler = handler[foundName];
    logger(`Action '${foundName}' created by client:`, client);
    if (debug) console.log(`Action '${foundName}' created by client:`, client);
    if (this.handler && (this.handler !== handler[foundName]) ) {
      const message = "handler can't be changed without unmount/remount of an Action";
      console.error(message, this);
      throw new Error(message);
    }
    this.handler = handler;
    name = name || foundName;

    let registerEvent = Reactor.RegisterAction({name, capture, handler, debug})
    Reactor.trigger(this._actionRef.current,
      registerEvent
    );
    this.fullName = registerEvent.detail.name;
  }

  componentWillUnmount() {
    if (super.componentWillUnmount) super.componentWillUnmount();

    let {children, client, name, debug, ...handlers} = this.props;

    const foundKeys = Object.keys(handlers);
    const foundName = foundKeys[0];
    const stack = new Error("Backtrace");
    const handler = handlers[foundName];

    client = client || handler.name
    const el = this._actionRef.current;
    // console.warn(el.outerHTML)
    if (!el) throw new Error("no el")

    logger(`${this.constructor.name}: scheduling action removal: '${this.fullName}'`)
    if (debug) console.log(`${this.constructor.name}: scheduling action removal: '${this.fullName}'`);
    // setTimeout(() => {
      logger(`${this.constructor.name}: removing action '${this.fullName}' from client: `, client)
      if (debug) console.log(`${this.constructor.name}: removing action '${this.fullName}' from client: `, client);
      logger("...from el", el.outerHTML, "with parent", elementInfo(el.parentNode));
      if (debug) console.log("...from el", el.outerHTML, "with parent", elementInfo(el.parentNode))
      if (debug > 1) console.log(stack);

      try {
        Reactor.trigger(el,
          Reactor.RemoveAction({debug, name: this.fullName, handler})
        );
      } catch(e) {
        console.error(`${this.constructor.name}: error while removing action:`, e)
      }
      logger(`<- Removing action '${this.fullName}'`);
      if (debug) console.log(`<- Removing action '${this.fullName}'`)
    // }, 2)
  }
}
Reactor.Action = Action;

export class Publish extends React.Component {
  constructor(props) {
    super(props);
    this._pubRef= React.createRef();
  }

  render() {
    let {event:name} = this.props;
    return <div className={`published-event event-${name}`} ref={this._pubRef}></div>;
  }

  componentDidMount() {
    // console.log("Publish didMount");
    if (super.componentDidMount) super.componentDidMount();

    let {children, event:name, debug, ...handler} = this.props;

    const foundKeys = Object.keys(handler);
    if (foundKeys.length > 0) {
      throw new Error("<Publish event=\"eventName\" /> events should only have a single prop - the 'event' name. ('debug' prop is also allowed)\n");
    }
    Reactor.trigger(this._pubRef.current,
      Reactor.PublishEvent({name, debug})
    );
  }

  // !!! unpublish on unmount
}
Reactor.Publish = Publish;

export class Subscribe extends React.Component {
  constructor(props) {
    super(props);
    this._subRef = React.createRef();
  }
  componentDidMount() {
    if (super.componentDidMount) super.componentDidMount();
    let subscriberReq = Reactor.SubscribeToEvent({eventName: this.eventName, listener: this.listenerFunc, debug:this.debug})

    // this.myNode = ReactDOM.findDOMNode(this);
    setTimeout(() => {
      Reactor.trigger(this._subRef.current, subscriberReq);
    }, 1)
  }

  componentWillUnmount() {
    if (super.componentWillUnmount) super.componentWillUnmount();

    Reactor.trigger(this._subRef.current,
      Reactor.StopSubscribing({eventName: this.eventName, listener: this.listenerFunc})
    );
  }

  render() {
    let {children, debug, ...handler} = this.props;

    const foundKeys = Object.keys(handler);
    if (foundKeys.length > 1) {
      throw new Error("<Subscribe eventName={notifyFunction} /> events should only have a single prop - the eventName to subscribe. ('debug' prop is also allowed)\n");
    }
    this.eventName = foundKeys[0];
    this.debug = debug;
    if (this.listenerFunc && this.listenerFunc !== handler[this.eventName]) {
      throw new Error(
        `<Subscribe ${this.eventName} has changed event handlers, which is not supported. `+
        `... this can commonly be caused by doing ${this.eventName}={this.someHandler.bind(this)} on a component class.  A good fix can be to bind the function exactly once, perhaps in a constructor.`
      );
    }
    this.listenerFunc = handler[this.eventName];

    return <div className={`listen listen-${this.eventName}`} ref={this._subRef} />;
  }


}