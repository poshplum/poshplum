
import PropTypes from "prop-types";
import React from 'react';
import map from 'lodash-es/map';
import keys from 'lodash-es/keys';
import find from 'lodash-es/find';

import {inheritName} from "../helpers/ClassNames";
import Reactor, {Action} from "./Reactor";

function matchChildType(typeName, children, klass) {
  return React.Children.map(children, (child) => {
    const cType = child && child.type;

    if (klass && cType &&
      ( cType === klass))
      return child;

    if (klass && cType && cType.prototype && klass.prototype &&
      (cType.prototype instanceof klass)
    )
      return child;

    if (cType && cType.name == typeName) return child;
    // displayName ok
    if (cType && cType.displayName == typeName) return child
  });
}


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

  const enhancedBaseClass = class withStateMachine extends baseClass {
    constructor() {
      super();
      this._stateRef = React.createRef();
    }
    static State = State;
    state = {currentState: "default"}

    findStates(children) {
      let found = matchChildType("State", children, State);
      let states = {};
      map(found, (state) => {
        let {
          name,
          transitions = [],
          path,
          children
        } = state.props;
        states[name] = {transitions, path, children};
      });
      if ((keys(states).length == 0) && (typeof(children) == "object") && children.props && children.props.children) {
        if (this.debugState)
          console.warn(this.constructor.name +": single child found; finding states inside that child");
        if (this.debugState > 1) debugger
        return this.findStates(children.props.children);
      }

      return states;
    }
    hasState(...names) {
      let {currentState="default"} = this.state || {};
      return find(names, (name) => name === currentState);
    }
    mkTransition(name) {
      if (!this._transitions) this._transitions = {};

      let displayName = `stateTransition〱${name}ゝ`;

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
      if(this.debugState) {
        console.log(this.constructor.name, "mkTransition", name, this._transitions[name]);
        if (this.debugState > 1) debugger
      }

      return this._transitions[name];
    }
    transition(name) {
      let {currentState="default"} = (this.state || {});
      if (this.debugState) console.group(`${this.constructor.name}: '${name}'⭞ transition `)

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
      if (!this.states[nextState])
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
          return false
        }
      }
      if (this.debugState > 1) debugger;
      this.setState({currentState: nextState});
      if (effectFn) {
        effectFn();
      }
      if (this.debugState) console.log(`${this.constructor.name}: '${name}'⭞\` done`);
      console.groupEnd();
    }
    render() {
      let inner = super.render();

      let {children} = inner.props;
      let {name} = this.constructor;

      this.states = this.findStates(children);
      let {currentState} = this.state || {};
      let stateDefinition = this.states[currentState];
      let transitions = stateDefinition && stateDefinition.transitions;

      if (this.debugState) {
        console.log(this.constructor.name, `rendering: (currentState=${currentState || '(default)'})`, this.states);
        console.log(this.constructor.name, `transitions: `, transitions);
        if (this.debugState > 1) debugger
      }

      if (!keys(this.states).length) {
        console.warn("hot loading can't match states by subclass :(")
        return <div ref={this._stateRef}>
          <div className="toast toast-error">Dev error: No <code>{"<"}State{">"}</code> components defined. <br/>... in {name}</div>
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
