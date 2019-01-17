// Reactors:
//  - Take modularized responsibility for local state change
//  - Provide feather-weight structure for action/dispatch/reducer pattern
//  - Leverage the high-performance DOM events infrastructure☺

//  - it listens for dispatched Action events (DOM)
//  - it handles the Actions it supports
//  - it ignores Actions it doesn't support (with a warning and/or UnhandledAction
//    notification depending on circumstance, in case there's a delegate that can
//    help deal with unhandled actions)
//  - it stops listening when unmounting

// Enumerating Actions:
//  - it listens for Action Query events (the only predefined Action type)
//  - it reacts to Action Queries with a callback reflecting its action types
//  - same action types are available from its JS module static Actions map.

// ...as delegation hub
//  - it listens for events from children, indicating that a nested component
//    is ready to handle an action (or that it no longer is handling that action)
//    - an actionDelegate component, added to the delegate, ensures correctness
//      of the delegate's behavior, particularly with regard to unmount/undelegation
//      signalling.
//

// Actors: Any component can choose to be an Actor
//   Actors can trigger actions
//   Parent components can trigger Actions on their children if needed
//   Child components trigger Action Queries to get named Actions from their parents

// Action boundaries (when in Dev mode) reflect unhandled Action events, indicating
//   a bug in developer code.

import React from "react";
import * as ReactDOM from "react-dom";

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
}

const Reactor = (componentClass) => {
  return class ReactorInstance extends componentClass {
    static displayName = "foo+Reactor";

    constructor() {
      super();
      this.registerAction = this.registerAction.bind(this)
    }

    registerAction(event) {
      const {debug, name, handler, ...moreDetails} = event.detail;

      const dbg = debugInt(debug);
      const moreDebug = (dbg > 1);
      if (dbg) {
        console.log(`Registering action '${name}': `,
          moreDetails, `handler ${handler.name}`, moreDebug ? handler : "...(debug=2 for more)"
        )
        if (moreDebug) debugger;
      }
      this.listen(name, handler);
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
      listening.forEach(
        ([type,handler]) => this.myNode.removeEventListener(type, handler)
      );
    }

    componentDidMount() {
      if (super.componentDidMount) super.componentDidMount();

      this.myNode = ReactDOM.findDOMNode(this);
      this.listen(Reactor.Events.registerAction, this.registerAction);

      this.setState({_reactorDidMount: true});
    }

    render() {
      let {_reactorDidMount: mounted} = (this.state || {});
      return <div className="reactor-todo-addName">
        {mounted && super.render()}
      </div>
    }
  }
}

Reactor.Events = {
  registerAction: "_Reactor:RegisterAction"
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
    console.log("Action didMount");
    let {children, debug, ...handler} = this.props;


    const foundKeys = Object.keys(handler);
    if (foundKeys.length > 1) {
      throw new Error("Actions should only have a single prop - the action name. ('debug' prop is also allowed)");
    }
    const name = foundKeys[0];
    handler = handler[name];

    this.myRef.current.dispatchEvent(Reactor.RegisterAction({name, handler, debug}))
  }
};

Reactor.Action = Action;