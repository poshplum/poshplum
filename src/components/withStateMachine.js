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
  let dName = inheritName(baseClass,`FSM`);
  debug(`creating stateMachine component ${dName}`)
  const enhancedBaseClass = class withStateMachine extends baseClass {
    constructor() {
      super();
      this._stateRef = React.createRef();
    }
    static State = State;
    state = {currentState: "default"}

    findStates(children) {
      trace(`${dName}: findStates (${children.length} children)`)
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
      if ((keys(states).length == 0) && (typeof(children) == "object") && children.props && children.props.children) {
        if (this.debugState)
          debug(this.constructor.name +": single child found; finding states inside that child");
        if (debug.enabled) debugger
        return this.findStates(children.props.children);
      }
      trace(`<- ${dName}: findStates`)
      debug(`      <-`, states)
      return states;
    }
    hasState(...names) {
      let {currentState="default"} = this.state || {};
      return find(names, (name) => name === currentState);
    }
    componentDidMount() {
      trace(`${dName}: componentDidMount (super)`)
      if (super.componentDidMount) super.componentDidMount();
      trace(`${dName}: componentDidMount (self)`)

      if (!this.states) {
        console.warn("withStateMachine should always have states before it gets componentDidMount.")
      } else {
        const {currentState="default"} = (this.state || {});
        const initialState = this.states[currentState]
        trace(`${dName}: `, {initialState});
        if (initialState.onEntry) {
          trace(`${dName}: -> onEntry ${currentState}`)
          initialState.onEntry();
          trace(`${dName}: <- onEntry ${currentState}`)
        }
      }
    }
    mkTransition(name) {
      if (!this._transitions) this._transitions = {};

      let displayName = `stateTransition‹${name}›`;
      trace(`${dName}: mkTransition`, {displayName});
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
        this._transitions[name] = {
          [displayName]: () => {
            return this.transition(name)
          }
        }[displayName];
      }
      if(debug.enabled) {
        debug(this.constructor.name, "mkTransition", name, this._transitions[name]);
        debugger
      }

      return this._transitions[name];
    }
    transition(name) {
      let {currentState="default"} = (this.state || {});
      trace(`${dName}: -> transition '${name}'⭞`)

      if (info.enabled) {
        const msg = `${this.constructor.name}: '${name}'⭞ transition `;
        console.group(msg)
        info(msg)
      }

      let thisState = this.states[currentState];
      let nextState = thisState.transitions[name];
      let goodTransitions = keys(thisState.transitions);
      let predicate, effectFn;
      if (nextState instanceof Array) {
        [predicate=() => {
          let e = new Error(`missing predicate definition for transition '${name}' from state '${currentState}'`)
          e.name = "warning";
          console.warn(e);
        }, nextState, effectFn] = nextState;
      }
      if (!nextState)
        throw new Error(`${this.constructor.name}: INVALID transition('${name}') from state '${currentState} (try ${goodTransitions.join(' | ')})}'`);

      const nextStateDef = this.states[nextState]

      if (!nextStateDef)
        throw new Error(`${this.constructor.name}: INVALID target state in '${currentState}:transitions['${name}'] -> state '${nextState}'`);

      if (this.debugState) {
        console.warn(this.constructor.name, `'${name}'⭞`, currentState, "->", nextState, (predicate ? [`after verification via function '${predicate.name}'`, predicate] : "(immediate)"));
        console.warn("...with stack trace", new Error("trace"));
      }
      if (predicate) {
        if (typeof(predicate) !== 'function')
          throw new Error(`${this.constructor.name}: INVALID predicate (${predicate}); function required.\n...in transition(${name}) from state '${currentState}'`);
        if (predicate.call(this) === false) {
          console.warn(`${this.constructor.name}: transition(${name}) from state '${currentState}' denied by predicate in state machine`);
          info.enabled && console.groupEnd();
          return false
        }
      }
      if (this.debugState > 1) debugger;
      this.setState({currentState: nextState});
      if (effectFn) {
        try {
          trace(`${dName}: ${name}:   -> effect callback`)
          effectFn();
          trace(`${dName}: ${name}:   <- effect callback`)
        } catch(e) {
          trace(`${dName}: ${name}:   <- error in effect callback`, e)
          this.trigger("error", {error: e});
        }
      }
      if (nextStateDef.onEntry) {
        trace(`${dName}: ${nextState}   -> onEntry`)
        nextStateDef.onEntry();
        trace(`${dName}: ${nextState}   <- onEntry`)
      }

      trace(`${dName}: <- transition '${name}'⭞`);
      info && console.groupEnd();
    }
    render() {
      trace(`${dName}: -> render (super)`);
      let inner = super.render();

      trace(`${dName}: -> render (self)`);
      let {children} = inner.props;
      let {name} = this.constructor;

      this.states = this.findStates(children);
      let {currentState} = this.state || {};
      let stateDefinition = this.states[currentState];
      let transitions = stateDefinition && stateDefinition.transitions;

      info(this.constructor.name, `rendering: (currentState=${currentState || '(default)'})`, this.states);
      debug(this.constructor.name, `transitions: `, transitions);

      if (!keys(this.states).length) {
        console.warn("hot loading can't match states by subclass :(")
        return <div ref={this._stateRef}>
          <div className="toast toast-error">Dev error: No <code>‹State›</code> components defined. <br/>... in {name}</div>
          <div className="toast toast-success">Get the State component with this pattern:&nbsp;
            <code>const {"{"}State{"}"} = this.constructor</code>
          </div>
          {inner}
        </div>
      }
      return <div className="stateMachine" ref={this._stateRef}>
        {transitions && Object.entries(transitions).map( ([transitionName, target]) => {
          let actionArgs = {
            [transitionName]: this.mkTransition(transitionName)
          };
          return <Action debug={0} client={this} key={`action-${transitionName}`} {...actionArgs} />
        })}

        {inner}
      </div>
    }
  }
  Object.defineProperty(enhancedBaseClass, "name", {value: dName});
  return Reactor(enhancedBaseClass);
};
export default withStateMachine;
