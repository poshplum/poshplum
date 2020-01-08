import PropTypes from "prop-types";
import React from 'react';
import map from 'lodash-es/map';
import keys from 'lodash-es/keys';
import find from 'lodash-es/find';

import {inheritName} from "../helpers/ClassNames";
import Reactor, {Action} from "./Reactor";
import matchChildType from "../helpers/matchChildType";

import dbg from 'debug';
const trace = dbg('trace:stateMachine');
const debug = dbg('debug:stateMachine');
const info = dbg('stateMachine');

// it decorates component classes
// it makes a subclass, not an HoC
// it implements a finite state machine
// nested <State> components declare the states that the component can be in
// usage:
//   <State name="default" path="/" transitions={{click:"focused"}}>
//   <State name="focused" path="/view" transitions={{
//          click:"editing",
//          back: "default"
//   }}>
//   <State name="editing" path="/edit" transitions={{cancel:"focused"}} />


export class State extends React.Component {
  static propTypes = {
    name: PropTypes.string.isRequired,
    onEntry: PropTypes.func,
    transitions: PropTypes.object,
    // items: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
    // itemRoute: PropTypes.func.isRequired
    path: PropTypes.string,
  };

  render() {
    return null;
  }
}


export const withStateMachine = (baseClass) => {
  let baseName = baseClass.name;
  let dName = inheritName(baseClass,`FSM`);
  debug(`creating stateMachine component ${dName}`);
  const enhancedBaseClass = class withStateMachine extends baseClass {
    constructor(props) {
      super(props);
      this._stateRef = React.createRef();
    }
    static State = State;
    state = {currentState: "default"};

    findStates(children) {
      trace(`${baseName}: -> findStates(${children.length} children)`);
      let found = matchChildType("State", children, State);
      let states = {};
      map(found, (state) => {
        let {
          name,
          transitions = [],
          path,
          onEntry,
          children
        } = state.props;
        states[name] = {onEntry, transitions, path, children};
      });
      if (0 === (keys(states).length) && (typeof(children) == "object") && children.props && children.props.children) {
        if (this.debugState)
          trace(this.constructor.name +": single child found; finding states inside that child");
        if (debug.enabled) debugger;
        return this.findStates(children.props.children);
      }
      if (!this.states) {
        info(`created state machine ${baseName} with ${Object.keys(states).length} states`);
      }
      if (!info.enabled) trace(`${baseName}: <- findStates():`, Object.keys(states).length, "states");
      debug(`      <-`, states);
      return states;
    }
    hasState(...names) {
      let {currentState="default"} = this.state || {};
      return find(names, (name) => name === currentState);
    }
    componentDidMount() {
      trace(`${baseName}: -> componentDidMount (super)`);
      if (super.componentDidMount) super.componentDidMount();
      trace(`${baseName}: <- componentDidMount (super)`);
      trace(`${baseName}:    componentDidMount (self)`);

      if (!this.states) {
        console.warn("withStateMachine should always have states before it gets componentDidMount.")
      } else {
        const {currentState="default"} = (this.state || {});
        const initialState = this.states[currentState];
        debug(`${baseName}: `, {initialState});
        if (!initialState) {
          this.trigger("error", {error: `${this.constructor.name}: state machine should have a 'default' state.`});
          return;
        }
        if (initialState.onEntry) {
          setTimeout( () => {
            trace(`${baseName}: -> onEntry to ${currentState}`);
            initialState.onEntry();
            trace(`${baseName}: <- onEntry to ${currentState}`);
          }, 1)
        }
        trace(`${baseName}: <- componentDidMount (self)`)

      }
    }
    mkTransition(name) {
      if (!this._transitions) this._transitions = {};

      let displayName = `stateTransition‹${name}›`;
      // let {currentState="default"} = (this.state || {});
      // if (this.states) {
      //   let thisState = this.states[currentState];
      //   if (!thisState) {if(this.debugState > 1) debugger; return null;}
      //
      //   let nextState = thisState.transitions[name];
      //   if (!nextState) {
      //     console.error(
      //     if(this.debugState > 1) debugger;
      //     return null;
      //   }
      // } else {
      //   if(this.debugState > 1) debugger
      //   return (() => null)
      // }

      if (!this._transitions[name]) {
        trace(`${baseName}: mkTransition(): +${displayName}⭞`);
        this._transitions[name] = {
          [displayName]: (event) => {
            event && event.stopPropagation();
            return this.transition(name)
          }
        }[displayName];
      }

      return this._transitions[name];
    }
    transition(name) {
      let {currentState="default"} = (this.state || {});
      this.transitionsUnderway = (this.transitionsUnderway || 0) + 1;
      const tLevel = this.transitionsUnderway > 1 ? `@L${this.transitionsUnderway} ` : ""
      trace(`${baseName}: ${tLevel}-> ${name}⭞ transition`);

      if (info.enabled) {
        const msg = `${baseName}: ${tLevel}${name}⭞  transition${this.props.item && ` (rec ${this.props.item.id})` || ""}`;
        info(msg);
        console.group(msg)
      }
      if(debug.enabled) {
        debug(this.constructor.name, "transition", name, this._transitions[name]);
        debugger
      }

      let thisState = this.states[currentState];
      let nextState = thisState.transitions[name];
      let goodTransitions = keys(thisState.transitions);
      let predicate, effectFn;
      if (nextState instanceof Array) {
        [predicate=() => {
          let e = new Error(`missing predicate definition for transition '${name}' from state '${currentState}'`);
          e.name = "warning";
          console.warn(e);
        }, nextState, effectFn] = nextState;
      }
      if (!nextState) {
        info.enabled && console.groupEnd();

        throw new Error(`${this.constructor.name}: INVALID transition('${name}') from state '${currentState}' (suggested: ${goodTransitions.join(',')})}`);
      }

      const nextStateDef = this.states[nextState];

      if (!nextStateDef) {
        info.enabled && console.groupEnd();

        throw new Error(`${this.constructor.name}: INVALID target state in '${currentState}:transitions['${name}'] -> state '${nextState}'`);
      }

      (info.enabled && info || trace)(`    ${tLevel}${currentState} -> ${predicate && (
        (predicate.name || "‹unnamed predicate›")+ " ->"
      ) || "" } ${nextState}`, predicate || "");
      debug("...with stack trace", new Error("trace"));


      if (predicate) {
        if (typeof(predicate) !== 'function') {
          info.enabled && console.groupEnd();
          throw new Error(`${this.constructor.name}: INVALID predicate (${predicate}); function required.\n...in transition(${name}) from state '${currentState}'`);
        }
        if (predicate.call(this) === false) {
          console.warn(`${this.constructor.name}: ${tLevel}transition(${name}) from state '${currentState}' denied by predicate in state machine`);
          info.enabled && console.groupEnd();
          this.transitionsUnderway = this.transitionsUnderway - 1;

          return false
        }
      }
      if (this.debugState > 1) debugger;
      if (currentState !== nextState) this.setState({currentState: nextState});
      if (effectFn) {
        try {
          trace(`${baseName}: ${tLevel}-> ${name}⭞ effect callback`);
          effectFn();
          trace(`${baseName}: ${tLevel}<- ${name}⭞ effect callback`);
        } catch(e) {
          trace(`${baseName}: ${tLevel}<-!${name}⭞ error in effect callback`, e);
          this.trigger("error", {error: e});
        }
      }
      if (currentState !== nextState && nextStateDef.onEntry) {
        setTimeout( () => {
          trace(`${baseName}: ${tLevel}-> onEntry to '${nextState}'`);
          nextStateDef.onEntry();
          trace(`${baseName}: ${tLevel}<- onEntry to '${nextState}'`);
        }, 0)
      }

      trace(`${baseName}: ${tLevel}<- ${name}⭞ transition`);
      info.enabled && console.groupEnd();
      this.transitionsUnderway = this.transitionsUnderway - 1;
    }
    render() {
      trace(`${baseName}: -> render (super)`);
      let inner = super.render();
      trace(`${baseName}: <- render (super)`);
      let {children} = inner.props;
      let {name} = this.constructor;

      this.states = this.findStates(children);

      let {currentState} = this.state || {};
      let stateDefinition = this.states[currentState];
      let transitions = stateDefinition && stateDefinition.transitions;
      let states = this.states;

      trace(`${baseName}: render (self) in state '${currentState || "‹none!›"}' (${transitions && Object.keys(transitions).length || "no"} transitions)`);

      debug(this.constructor.name, `rendering: `, {transitions,states});

      if (!keys(this.states).length) {
        console.warn("hot loading can't match states by subclass :( ");
        return <div ref={this._stateRef} style={{display:"contents"}}>
          <div className="toast toast-error">Dev error: No <code>‹State›</code> components defined. <br/>... in {name}</div>
          <div className="toast toast-success">Get the State component with this pattern:&nbsp;
            <code>const {"{"}State{"}"} = this.constructor</code>
          </div>
          {inner}
        </div>
      }
      return <div  style={{display:"contents"}} className={`stateMachine state-${currentState}`} ref={this._stateRef}>
        {transitions && Object.entries(transitions).map( ([transitionName, target]) => {
          let actionArgs = {
            [transitionName]: this.mkTransition(transitionName)
          };
          return <Action debug={0} client={this} key={`action-${transitionName}`} {...actionArgs} />
        })}

        {inner}
      </div>
    }
  };
  Object.defineProperty(enhancedBaseClass, "name", {value: dName});
  return Reactor(enhancedBaseClass);
};
export default withStateMachine;
