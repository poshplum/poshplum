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
import {getClassName, inheritName, myName} from "../helpers/ClassNames";

const elementInfo = (el) => {
  // debugger
  const classNames = el.classList.toString().split(/ /).join('.');
  return `<${el.constructor.name}.${classNames}#${el.id}@${el.key || "noKey"}>`;
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
  let displayName = inheritName(componentClass, "⚡👂");

  return class Listener extends componentClass {
    static displayName = displayName;

  }
}

export const Actor = (componentClass) => {
  const componentClassName = getClassName(componentClass);
  let displayName = inheritName(componentClass, "Actor");
  if (!componentClass.prototype.name) {
    throw new Error("Actors require a name() method; this name identifies the actor's delegate name for its Reactor, and scopes its Actions");
  }

  return class ActorInstance extends Listener(componentClass) {
    static displayName = displayName;

    constructor(props) {
      super(props);
      this.myRef = React.createRef();
    }

    render() {
      return <div className={`actor ${displayName}`} ref={this.myRef}></div>;
    }

    componentDidMount() {
      console.log("Actor didMount");
      let {children, debug, ...handler} = this.props;
      let name = this.name();

      // if(foundKeys[0] == "action") debugger;
      this.myRef.current.dispatchEvent(Reactor.RegisterActor({name, actor:this, debug}))
    }
  }
};

const Reactor = (componentClass) => {
  const listenerClass = Listener(componentClass)
  const componentClassName = getClassName(listenerClass);
  return class ReactorInstance extends listenerClass {
    static displayName = inheritName(listenerClass, "Reactor");

    constructor() {
      super();
      this.registerAction = this.registerAction.bind(this);
      this.registerActor = this.registerActor.bind(this);
      this.actions = {};
      this.listening = [];
      this.actors = {};
    }

    registerActor(event) {
      let {name, actor, debug} = event.detail;
      if(this.actors[name]) {
        console.error(`Actor named '${name}' already registered`, this.actors[name])
      } else {
        this.actors[name] = actor;
      }
    }

    registerAction(event) {
      const {debug, name, handler, ...moreDetails} = event.detail;

      const dbg = debugInt(debug);
      const moreDebug = (dbg > 1);
      if (dbg) {
        console.log(`${myName(this)} registering action '${name}': `,
          moreDetails, `handler ${handler.name}`, moreDebug ? handler : "...(debug=2 for more)"
        )
        if (moreDebug) debugger;
      }
      event.stopPropagation();

      const existingHandler = this.actions[name];
      if (existingHandler) {
        console.warn("need to add delegate info here");
        console.warn("need to capture errors that may be thrown by handlers")

        const msg = `${myName(this)}: Action '${name}' is already registered with a handler`
        console.error(msg, existingHandler);
        throw new Error(msg);
      }

      this.actions[name] = handler;
      const reactor = this;
      function wrappedHandler(e) {
        e.handledBy = e.handledBy || [];
        const listenerObj = handler.boundThis || Reactor.bindWarning;
        let handled = {
          reactor,
          reactorNode: this,
          listenerObj,
          listenerFunction: handler.targetFunction || handler
        };
        if(dbg) {
          const msg = `Event: ${name} - calling handler`;
          if(moreDebug) {
            console.log(msg, handled);
            debugger
          } else {
            console.log(msg, {
              target: elementInfo(e.target),
              reactor: myName(handled.reactor),
              reactorEl: elementInfo(handled.reactorNode)
            })
          }
        }
        e.handledBy.push(handled);
        handler(e);
      }
      this.listen(name, wrappedHandler);
    }

    listen(eventType, handler) {
      const listening = this.listening = this.listening || [];
      const newListener = this.myNode.addEventListener(eventType, handler);
      // console.log(listening);
      listening.push([eventType, handler]);
      // console.log(listening);
    }
    componentWillUnmount() {
      console.log("unmounting Reactor and unlistening all...")
      this.listening.forEach(
        ([type,handler]) => this.myNode.removeEventListener(type, handler)
      );
    }

    componentDidMount() {
      if (super.componentDidMount) super.componentDidMount();

      this.myNode = ReactDOM.findDOMNode(this);
      this.listen(Reactor.Events.registerAction, this.registerAction);
      this.listen(Reactor.Events.registerActor, this.registerActor);

      this.setState({_reactorDidMount: true});
    }

    render() {
      let {_reactorDidMount: mounted} = (this.state || {});
      return <div className={`reactor-for-${componentClassName}`}>
        {mounted && super.render()}
      </div>
    }
  }
};
Reactor.dispatchTo = function(target, event) {
  target.dispatchEvent(event);
  if (!event.handledBy) {
    target.dispatchEvent(new CustomEvent('NoActorFound', {bubbles:true}));
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
  registerActor: "registerActor"
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
    if (dbg > 2) debugger
    return new CustomEvent(type, {
      debug,
      bubbles: true,
      detail: eventProps
    })
  }
};
Reactor.RegisterAction = Reactor.EventFactory(Reactor.Events.registerAction)
Reactor.RegisterActor = Reactor.EventFactory(Reactor.Events.registerActor)
Reactor.elementInfo = elementInfo;

export default Reactor;

export class Action extends React.Component {
  constructor(props) {
    super(props);
    this.myRef = React.createRef();
  }

  render() {
    return <div className="action action-todo-addName" ref={this.myRef}></div>;
  }

  componentDidMount() {
    // console.log("Action didMount");
    let {children, name, debug, ...handler} = this.props;

    const foundKeys = Object.keys(handler);
    if (foundKeys.length > 1) {
      throw new Error("Actions should only have a single prop - the action name. ('debug' prop is also allowed)\n"+
        "If your action name can't be a prop, specify it with name=, and the action function with action="
      );
    }
    const foundName = foundKeys[0];
    handler = handler[foundName];
    name = name || foundName;

    // if(foundKeys[0] == "action") debugger;
    this.myRef.current.dispatchEvent(Reactor.RegisterAction({name, handler, debug}))
  }
};

Reactor.Action = Action;