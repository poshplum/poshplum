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
//  - has predefined events: registerAction, queryActions, registerActor, NoActorFound

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
import {composeName, getClassName, inheritName, myName} from "../helpers/ClassNames";

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

const Listener = (componentClass) => {
  const componentClassName = getClassName(componentClass);
  let displayName = inheritName(componentClass, "👂");

  const clazz = class Listener extends componentClass {
    listening = [];
    constructor() {
      super()
      this._listenerRef = React.createRef();
    }
    listen(eventName, handler) {
      console.warn(`${myName(this)}: each Listener-ish should explicitly define listen(eventName, handler), with a call to _listen(eventName, handler) in addition to any additional responsibilities it may take on for event-listening`);
      return this._listen(eventName, handler);
    }
    _listen(eventName, handler) {
      const listening = this.listening;
      // console.warn("_listen: ", eventName, handler);
      const wrappedHandler = this._wrapHandler(handler);
      const newListener = this._listenerRef.current.addEventListener(eventName, wrappedHandler);
      // console.log(listening);
      listening.push([eventName, wrappedHandler]);
      return wrappedHandler
      // console.log(listening);
    }
    componentDidMount() {
      if (super.componentDidMount) super.componentDidMount();

      if (!this._listenerRef) {
        let msg = `${myName(this)}: requires this._listenerRef to be set in constructor.`;
        console.error(msg);
        throw new Error(msg)
      }
      if (!this._listenerRef.current) {
        let msg = `${myName(this)}: requires this._listenerRef.current to be set with ref={this._listenerRef}`;
        console.error(msg);
        throw new Error(msg)
      }
    }

    componentWillUnmount() {
      if (super.componentWillUnmount) super.componentWillUnmount();
      let {debug} = this.props;
      const dbg = debugInt(debug);
      if (dbg) {
        console.log(`${myName(this)}: unmounting and unlistening all...`)
      }
      this.listening.forEach(this.unlisten.bind(this));
    }

    unlisten(typeAndHandler) {
      let [type,handler] = typeAndHandler;
      this._listenerRef.current.removeEventListener(type, handler);
      typeAndHandler[1] = null;
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
        if(dbg) {
          const msg = `${myName(reactor)}: Event: ${type} - calling handler`;
          if(moreDebug) {
            console.log(msg, handled);
            debugger
          } else {
            console.log(msg, {
              triggeredAt: elementInfo(event.target),
              reactor: myName(handled.reactor),
              reactorEl: elementInfo(handled.reactorNode),
              listenerTarget: handler.boundThis && myName(handler.boundThis),
              listenerFunction: (handler.targetFunction || handler).name
            })
          }
        }
        const result = handler.call(this,event); // retain event's `this` (target of event)
        if (result === undefined || !!result) {
          event.handledBy.push(handled);
        }
      }
      return function(e) {
        let result;
        try {
          result = wrappedHandler.call(this,e); // retain event's `this`
        } catch(error) {
          console.error(error);
          throw(error)
        }
        return result;
      }
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

  // const componentClassName = getClassName(componentClass);
  let displayName = inheritName(listenerClass, "Actor");

  return class ActorInstance extends listenerClass {
    static displayName = displayName;

    constructor(props) {
      super(props);
      this._actorRef = React.createRef();
      this.registerAction = Reactor.bindWithBreadcrumb(this.registerAction, this);
      this.removeAction = Reactor.bindWithBreadcrumb(this.removeAction, this);
      this.registerActor = Reactor.bindWithBreadcrumb(this.registerActor, this);
    }
    registerActor() {
      throw new Error("nested Actors not currently supported.  If you have a use-case, please create a pull req demonstrating it")
    }
    removeAction(removalEvent) {
      let {name} = removalEvent.detail;
      let newName = `${this.name()}:${name}`
      removalEvent.detail.name = newName
    }
    registerAction(registrationEvent) {
      if(!registrationEvent.detail) {
        console.error(`${myName(this)}: registerAction: registration event has no details... :(`);
        debugger
      }
      let {name,debug} = registrationEvent.detail;
      let dbg = debugInt(debug);
      let moreDebug = (dbg > 1);
      let newName = `${this.name()}:${name}`;
      if (dbg) console.log(`${myName(this)} delegating registerAction(${name}->${newName}) to upstream Reactor`);
      if (moreDebug) {
        console.log(event);
        debugger
      }

      registrationEvent.detail.name = newName;
      // super.registerAction(registrationEvent);
      // registrationEvent.stopPropagation();
    }
    listen(eventName, handler) {
      let {debug} = this.props;
      let dbg = debugInt(debug);
      if (dbg) {
        console.log(`${myName(this)}: listening to ${eventName}`);
      }
      return this._listen(eventName, handler);
    }

    render() {
      let {_reactorDidMount: mounted} = (this.state || {});
      return <div className={`actor actor-for-${displayName}`} ref={this._listenerRef}>
        {mounted && super.render && super.render()}
      </div>;
    }

    componentDidMount() {
      if (super.componentDidMount) super.componentDidMount();
      let {debug} = this.props;

      let dbg = debugInt(debug);
      if (dbg) {
        console.log(`${myName(this)} didMount`);
      }
      let name = this.name();
      this.listen(Reactor.Events.registerAction, this.registerAction);
      this.listen(Reactor.Events.removeAction, this.removeAction);

      // if(foundKeys[0] == "action") debugger;
      this._listenerRef.current.dispatchEvent(Reactor.RegisterActor({name, actor:this, debug}));

      this.setState({_reactorDidMount: true});
    }

    componentWillUnmount() {
      let name = this.name();

      this._listenerRef.current.dispatchEvent(
        Reactor.RemoveActor({name})
      );

    }

  }
};


const Reactor = (componentClass) => {
  const listenerClass = Listener(componentClass);
  const componentClassName = getClassName(componentClass);
  const reactorName = inheritName(componentClass, "Rx");

  const clazz = class ReactorInstance extends listenerClass {
    // registerAction = Reactor.bindWithBreadcrumb(this.registerAction, this);
    constructor() {
      super();
      this.Name = reactorName;

      this.registerAction = Reactor.bindWithBreadcrumb(this.registerAction, this);
      this.removeAction = Reactor.bindWithBreadcrumb(this.removeAction, this);

      this.registerActor = Reactor.bindWithBreadcrumb(this.registerActor, this);
      this.removeActor = Reactor.bindWithBreadcrumb(this.removeActor, this);

      this.registerPublishedEvent = Reactor.bindWithBreadcrumb(this.registerPublishedEvent, this);
      this.removePublishedEvent = Reactor.bindWithBreadcrumb(this.removePublishedEvent, this);

      this.registerSubscriber = Reactor.bindWithBreadcrumb(this.registerSubscriber, this);
      this.removeSubscriber = Reactor.bindWithBreadcrumb(this.removeSubscriber, this);
      this.listening = [];

      this.actions = {}; // known direct actions
      this.events = {
        unknownEvent: true
      };  // known direct events
      this.actors = {};  // registered actors
      this.registeredSubscribers = {}; // registered listening agents
    }
    componentDidMount() {
      if (super.componentDidMount) super.componentDidMount();

      // this.myNode = ReactDOM.findDOMNode(this);
      this.listen(Reactor.Events.registerAction, this.registerAction);
      this.listen(Reactor.Events.removeAction, this.removeAction);

      this.listen(Reactor.Events.registerActor, this.registerActor);
      this.listen(Reactor.Events.removeActor, this.removeActor);

      this.listen(Reactor.Events.publishEvent, this.registerPublishedEvent);
      this.listen(Reactor.Events.removePublishedEvent, this.removePublishedEvent);

      this.listen(Reactor.Events.registerSubscriber, this.registerSubscriber);
      this.listen(Reactor.Events.removeSubscriber, this.removeSubscriber);

      this.setState({_reactorDidMount: true});
    }

    registerAction(event) {
      const {debug, name, handler, ...moreDetails} = event.detail;
      const dbg = debugInt(debug);
      const moreDebug = (dbg > 1);
      if (dbg) {
        console.log(`${myName(this)} registering action '${name}': `,
          moreDetails, `handler ${handler.name}`, moreDebug ? handler : "...(debug=2 for more)"
        );
        if (moreDebug) debugger;
      }

      const existingHandler = this.actions[name];
      if (existingHandler) {
        let info = {
          listenerFunction: (existingHandler.targetFunction || existingHandler).name,
          listenerTarget: (
            ( existingHandler.boundThis && myName(existingHandler.boundThis) )
            || Reactor.bindWarning
          ),
        };

        const msg = `${myName(this)}: Action '${name}' is already registered with a handler`;
        console.error(msg);
        console.warn("existing handler info: ", info);
        throw new Error(msg);
      }

      this.listen(name, handler);
      event.stopPropagation();
    }

    removeAction(event) {
      const {debug, name, handler, ...moreDetails} = event.detail;
      if(debug) console.log("removing action:", event.detail);
      // debugger

      if (!this.actions[name]) {
        console.warn(`can't removeAction '${name}' (not registered)`);
      } else {
        // debugger
        event.stopPropagation();
        this.unlisten([name, this.actions[name]]);
        delete this.actions[name];
      }
      event.stopPropagation();

    }
    //
    // registerAction(event) {
    //   // if (!event.handledBy)
    //     super.registerAction(event);
    //
    //   // event.handledBy = this;
    //   event.stopPropagation();
    // }
    registerPublishedEvent(event) {
      let {name, debug} = event.detail;
      if (debug) console.warn("registering published event", name);
      if (this.events[name]) {
        console.error(`Event '${name}' already registered by`, this.events[name]);
      } else {
        this.events[name] = event.target;
      }
      event.stopPropagation();
    }
    trigger(eventName) {
      if (this.events[eventName]) {
        Reactor.dispatchTo(this._listenerRef.current, new CustomEvent(eventName, {bubbles:true}));
      } else {
        Reactor.dispatchTo(this._listenerRef.current, Reactor.UnknownEvent({
          eventName, calledBy: "trigger", callStack: new Event("stack")
        }));
      }
    }
    removePublishedEvent(event) {
      let {name, actor, debug} = event.detail;
      console.error("test me");
      // !!! check for registeredListeners to this event, issue a orphanedListener event
      if (!this.events[name]) {
        console.error(`can't removePublishedEvent '${name}' (not registered)`);
      } else {
        delete this.events[name];
      }
      event.stopPropagation();
    }

    registerActor(event) {
      let {name, actor, debug} = event.detail;
      if(debug) console.info(this.name(), "registering actor", name);
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
      } else {
        console.error(`ignoring removeActor event for name '${name}' (not registered)`)
      }
      event.stopPropagation();
    }

    registerSubscriber(event) {
      let {eventName, listener, debug} = event.detail;

      if (!this.events[eventName]) {
        if (this.isEventCatcher) {
          console.warn(`${this.constructor.name}: in registerSubscriber: no published '${eventName}' event`)
          this._listenerRef.current.dispatchEvent(
            Reactor.UnknownEvent({eventName: eventName, detail:event.detail, calledBy: "registerSubscriber", callStack: new Error("stack"), listener})
          );
          return true
        } else {
          if (debug) console.warn(`${this.constructor.name}: ignored unknown registerSubscriber request`, event.detail);
        }
        return false
      } else {
        if (debug) console.warn(`${this.constructor.name}: registering subscriber for `, event.detail);
      }
      event.stopPropagation();
      if (debug > 1) console.warn(`${this.constructor.name}: registering subscriber to '${eventName}': `, listener, new Error("...stack trace"));

      setTimeout(() => {
        this.addSubscriberEvent(eventName, listener, debug);
      }, 1)
    }
    addSubscriberEvent(eventName, listener, debug) {
      let subscriberFanout;
      if (subscriberFanout = this.registeredSubscribers[eventName]) {
        subscriberFanout.subscribers.push(listener);

        return;
      }

      subscriberFanout = this.registeredSubscribers[eventName] =
        this.registeredSubscribers[eventName] || {
          fn: (event) => {
            if (debug) console.warn(`got event ${eventName}, dispatching to ${subscriberFanout.subscribers.length} listeners`);
            // if (debug) console.warn(listenerFanout.listeners);
            subscriberFanout.subscribers.forEach((subscriberFunc) => {
              subscriberFunc(event);
              // ?? honor stopPropagation[immediate] ?
            });
          },
          subscribers: [listener]
        };

      subscriberFanout._fan = this.listen(eventName, subscriberFanout.fn);
    }
    removeSubscriber(event) {
      let {eventName, listener, debug} = event.detail;

      let subscriberFanout = this.registeredSubscribers[eventName];
      if (!subscriberFanout) {
        if (this.isEventCatcher) {
          console.warn(`${this.constructor.name} in removeSubscriber: unknown event ${eventName}`);
          this._listenerRef.current.dispatchEvent(
            Reactor.UnknownEvent({eventName: this.eventName, calledBy: "registerSubscriber", callStack: new Error("stack"), listener})
          )
        }
        return
      }
      event.stopPropagation();

      if (debug) console.warn(`${this.constructor.name}: removing subscriber to '${eventName}': `, listener, new Error("...stack trace"));

      const before = subscriberFanout.subscribers.length;
      subscriberFanout.subscribers = subscriberFanout.subscribers.filter((f) => {
        // console.error("compare:", f, listener, f === listener);
        return f !== listener
      });
      const after = subscriberFanout.subscribers.length;


      if (before === after) {
        console.warn(`${this.constructor.name}: no subscribers removed for ${eventName}`)
      } else if(debug)
          console.warn(`${this.constructor.name}: removed a subscriber for ${eventName}; ${after} remaining` );


      if (after === 0) {
        this.unlisten([eventName, subscriberFanout._fan]);
        delete this.registeredSubscribers[eventName];
      }
    }

    listen(eventName, handler) { // satisfy listener
      let wrappedHandler = this._listen(eventName, handler);
      this.actions[eventName] = wrappedHandler;
      // console.warn("+listen ", eventName, handler, {t:{t:this}}, this.actions)
      return wrappedHandler;
    }

    render() {
      let {_reactorDidMount: mounted} = (this.state || {});
      return <div ref={this._listenerRef} className={`reactor-for-${componentClassName}`}>
        {mounted && super.render()}
      </div>
    }
  }
  Object.defineProperty(clazz, 'name', { value: reactorName})
  return clazz;
};
Reactor.dispatchTo = Reactor.trigger = function dispatchWithHandledDetection(target, event, {bubbles=true,...detail}={}) {
  if (!(target instanceof Element)) throw new Error("Reactor.dispatchTo: missing required arg1 (must be a DOM node)");

  if (!(event instanceof Event)) {
    event = new CustomEvent(event, {bubbles, detail});
  }

  target.dispatchEvent(event);
  if (!event.handledBy || !event.handledBy.length) {
    const unk = new CustomEvent('unknownEvent', {bubbles:true, detail: {
        // debug:1,
        eventName:event.type,
        ...detail
      }});
    target.dispatchEvent(unk);
    if (!unk.handledBy || !unk.handledBy.length) {
      console.error(`unknown event '${event.type}' and no unknownEvent handler to surface it into the UI.`, event, "\n", new Error("Backtrace:"))
    }
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
  registerAction: "registerAction",
  removeAction: "removeAction",
  registerActor: "registerActor",
  removeActor: "removeActor",
  publishEvent: "publishEvent",
  removePublishedEvent: "removePublishedEvent",
  registerSubscriber: "registerSubscriber",
  removeSubscriber: "removeSubscriber",
  unknownEvent: "unknownEvent"
};
Reactor.EventFactory = (type) => {
  const t = typeof type;

  if (t !== "string") {
    console.error("EventFactory: bad type for ", t);
    throw new Error(`EventFactory(type): ^^^ type must be a string, not ${t}`);
  }

  return ({...eventProps}) => {
    const {debug} = eventProps;
    const dbg = debugInt(debug);
    if (dbg > 1) console.log(`Event: ${type}: `, eventProps);
    if (dbg > 2) debugger;
    return new CustomEvent(type, {
      debug,
      bubbles: true,
      detail: eventProps
    });
  }
};
Reactor.RegisterAction = Reactor.EventFactory(Reactor.Events.registerAction);
Reactor.RemoveAction = Reactor.EventFactory(Reactor.Events.removeAction);

Reactor.RegisterActor = Reactor.EventFactory(Reactor.Events.registerActor);
Reactor.RemoveActor = Reactor.EventFactory(Reactor.Events.removeActor);

Reactor.PublishEvent = Reactor.EventFactory(Reactor.Events.publishEvent);
Reactor.RemovePublishedEvent = Reactor.EventFactory(Reactor.Events.removePublishedEvent);

Reactor.SubscribeToEvent = Reactor.EventFactory(Reactor.Events.registerSubscriber);
Reactor.StopSubscribing = Reactor.EventFactory(Reactor.Events.removeSubscriber);

Reactor.UnknownEvent = Reactor.EventFactory(Reactor.Events.unknownEvent);
Reactor.elementInfo = elementInfo;

export default Reactor;

export class Action extends React.Component {
  constructor(props) {
    super(props);
    this._actionRef= React.createRef();
  }

  render() {
    let {children, client, debug, ...handler} = this.props;
    const foundKeys = Object.keys(handler);
    const foundName = foundKeys[0];

    return <div className={`action action-${foundName}`} ref={this._actionRef} />;
  }

  componentDidMount() {
    let {children, name, client="<unknown>", debug, ...handler} = this.props;
    if (super.componentDidMount) super.componentDidMount();

    const foundKeys = Object.keys(handler);
    if (foundKeys.length > 1) {
      throw new Error("Actions should only have a single prop - the action name. ('debug' prop is also allowed)\n"+
        "If your action name can't be a prop, specify it with name=, and the action function with action="
      );
    }
    const foundName = foundKeys[0];
    handler = handler[foundName];
    if (debug) console.log(`Action '${foundName}' created by client:`, client);
    if (this.handler && (this.handler !== handler[foundName]) ) {
      const message = "handler can't be changed without unmount/remount of an Action";
      console.error(message, this);
      throw new Error(message);
    }
    this.handler = handler;
    name = name || foundName;

    // if(foundKeys[0] == "action") debugger;
    this._actionRef.current.dispatchEvent(Reactor.RegisterAction({name, handler, debug}));
  }
  componentWillUnmount() {
    let {children, client="<unknown>", name, debug, ...handlers} = this.props;

    const foundKeys = Object.keys(handlers);
    const foundName = foundKeys[0];
    if (debug) console.log(`Removing action '${foundName}' from client: `, client);
    const handler = handlers[foundName];

    // console.warn("unmounting action", this)
    this._actionRef.current.dispatchEvent(
      Reactor.RemoveAction({name: foundName, handler})
    );
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

    // if(foundKeys[0] == "action") debugger;
    this._pubRef.current.dispatchEvent(Reactor.PublishEvent({name, debug}));
  }
}
Reactor.Publish = Publish;

export class Subscribe extends React.Component {
  constructor(props) {
    super(props);
    this._subRef = React.createRef();
  }
  componentDidMount() {
    if (super.componentDidMount) super.componentDidMount();

    // this.myNode = ReactDOM.findDOMNode(this);
    let subscriberReq = Reactor.SubscribeToEvent({eventName: this.eventName, listener: this.listenerFunc, debug:this.debug})
    this._subRef.current.dispatchEvent(subscriberReq);
    if (!subscriberReq.handledBy || !subscriberReq.handledBy.length) {
      console.error(`<Subscribe>: invalid event name '${this.eventName}', and nobody listening for unknownEvent(?)`)
    // } else {
    //   console.warn("Subscribe", this.eventName, "handled by", subscriberReq.handledBy)
    }
  }
  componentWillUnmount() {
    this._subRef.current.dispatchEvent(
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