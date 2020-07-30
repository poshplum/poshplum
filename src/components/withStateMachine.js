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
  const enhancedBaseClass = class withStateMachine extends baseClass {
    constructor(props) {
      super(props);
      this._stateRef = React.createRef();
    }
    static State = State;
    state = {currentState: "default"};

    setFsmLogger() {
      if (this.logger) this.fsmLogger = this.logger.child({name:`${this.logger.loggerName}:fsm`});
    }
    warn(...args) {
      if (this.fsmLogger) return this.fsmLogger.warn(...args);
      console.warn(...args);
    }
    info(...args) {
      if (this.fsmLogger) return this.fsmLogger.info(...args);
      info(...args);
    }
    get infoEnabled() {
      if (this.fsmLogger && this.fsmLogger.isLevelEnabled("info")) return true;
      return info.enabled
    }
    progress(...args) {
      if (this.fsmLogger) return this.fsmLogger.progress(...args)
      trace(...args)
    }
    debugLog(...args) {
      if (this.fsmLogger) {
        return this.fsmLogger.debug(...args)
      }
      if (this.debugState) {
        return debug(...args)
      }
    }
    findStates(children) {
      this.debugLog(`${baseName}: -> findStates(${children.length} children)`);
      let found = matchChildType("State", children, State);
      let states = {};
      map(found, (state) => {
        if (!state) return;
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
        this.debugLog(this.constructor.name +": single child found; finding states inside that child");
        return this.findStates(children.props.children);
      }
      if (!this.states) {
        this.info(`created state machine ${baseName} with ${Object.keys(states).length} states`);
      }
      return states;
    }
    hasState(...names) {
      let {currentState="default"} = this.state || {};
      return find(names, (name) => name === currentState);
    }
    hasStates() {
      if (!this.states) return {};

      let {currentState="default"} = this.state || {};
      const states = {};
      for (const [state, _] of Object.entries(this.states)) {
        states[state] = (currentState == state);
      }
      return states;
    }
    componentDidMount() {
      this.progress(`${baseName}: -> componentDidMount (super)`);
      if (super.componentDidMount) super.componentDidMount();
      this.setFsmLogger()
      this.progress(`${baseName}: <- componentDidMount (super); now for self...`);

      if (!this.states) {
        this.warn("withStateMachine should always have states before it gets componentDidMount.")
      } else {
        const {currentState="default"} = (this.state || {});
        const initialState = this.states[currentState];
        this.debugLog(`${baseName}: `, {initialState});
        if (!initialState) {
          this.trigger("error", {error: `${this.constructor.name}: state machine should have a 'default' state.`});
          return;
        }
        if (initialState.onEntry) {
          setTimeout( () => {
            this.debugLog(`${baseName}: -> onEntry to ${currentState}`);
            initialState.onEntry();
            this.progress(`${baseName}: <- onEntry to ${currentState}`);
          }, 1)
        }
        this.progress(`${baseName}: <- componentDidMount (self)`)
      }
    }
    mkTransition(name) {
      if (!this._transitions) this._transitions = {};

      let displayName = `stateTransition‹${name}›`;
      if (!this._transitions[name]) {
        this.debugLog(`${baseName}: mkTransition(): +${displayName}⭞`);
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
      this.progress(`${baseName}: ${tLevel}-> ${name}⭞ transition`);

      let thisState = this.states[currentState];
      let nextState = thisState.transitions[name];
      let goodTransitions = keys(thisState.transitions);
      let predicate, effectFn;

      if (Array.isArray(nextState)) {
        [predicate=() => {
          let e = new Error(`missing predicate definition for attempted transition '${name}' from state '${currentState}'`);
          e.name = "warning";
          this.warn(e);
        }, nextState, effectFn] = nextState;
      }
      if (!nextState) {
        this.infoEnabled && console.groupEnd();

        throw new Error(`${this.constructor.name}: INVALID transition('${name}') attempted from state '${currentState}' (suggested: ${goodTransitions.join(',')})}`);
      }
      if (this.infoEnabled) {
        const msg = `${baseName}: transition${
          this.props.item && ` (rec ${this.props.item.id})` || ""
        } ${tLevel}${name}⭞ ${nextState}`;
        this.info(msg);
        console.group(msg)
      }
      const nextStateDef = this.states[nextState];

      if (!nextStateDef) {
        this.infoEnabled && console.groupEnd();

        throw new Error(`${this.constructor.name}: INVALID target state in '${currentState}:transitions['${name}'] -> state '${nextState}'`);
      }
      this.progress({detail: {def: this._transitions[name]}}, `${this.constructor.name}: transition ${name}⭞ ${nextState}`);


      if (predicate) {
        const detail = {predicate};
        const msg = `   trans predicate ${tLevel}${currentState} -> ${
          (predicate.name || "‹unnamed›")+ " ->"} ${nextState}`;

        if (this.infoEnabled) {
          this.info(msg)
        } else {
          detail.stack = new Error("trace");
          this.progress({detail}, msg);
        }

        if (typeof(predicate) !== 'function') {
          this.infoEnabled && console.groupEnd();
          throw new Error(`${this.constructor.name}: INVALID predicate (${predicate}); function required.\n...in transition(${name}) from state '${currentState}'`);
        }
        if (predicate.call(this) === false) {
          this.warn(`${this.constructor.name}: ${tLevel}transition(${name}) from state '${currentState}' denied by predicate in state machine`);
          this.infoEnabled && console.groupEnd();
          this.transitionsUnderway = this.transitionsUnderway - 1;

          return false
        }
      }
      if (this.debugState > 1) debugger;
      if (currentState !== nextState) this.setState({currentState: nextState});
      if (effectFn) {
        try {
          this.debugLog(`${baseName}: ${tLevel}-> ${name}⭞ effect callback`);
          effectFn();
          this.progress(`${baseName}: ${tLevel}<- ${name}⭞ effect callback`);
        } catch(e) {
          this.progress(`${baseName}: ${tLevel}<-!${name}⭞ error in effect callback`, e);
          this.trigger("error", {error: e});
        }
      }
      if (currentState !== nextState && nextStateDef.onEntry) {
        setTimeout( () => {
          this.debugLog(`${baseName}: ${tLevel}-> onEntry to '${nextState}'`);
          nextStateDef.onEntry();
          this.progress(`${baseName}: ${tLevel}<- onEntry to '${nextState}'`);
        }, 0)
      }

      this.progress(`${baseName}: ${tLevel}<- ${name}⭞ transition`);
      this.infoEnabled && console.groupEnd();
      this.transitionsUnderway = this.transitionsUnderway - 1;
    }
    render() {
      this.debugLog(`${baseName}: -> render (super)`);
      let inner = super.render();
      let {children} = inner.props;
      let {name} = this.constructor;

      this.states = this.findStates(children);

      let {currentState} = this.state || {};
      let stateDefinition = this.states[currentState];
      let transitions = stateDefinition && stateDefinition.transitions;
      let states = this.states;

      this.progress({detail:{transitions,states}},
        `${baseName}: render state='${currentState || "‹none!›"}' (${
            Object.keys(states).length || "no"
          } states, ${
            transitions && Object.keys(transitions).length || "no"
          } transitions)`
      );

      if (!keys(this.states).length) {
        if (module.hot) this.warn("NOTE: hot loading can't match states by subclass :( ");

        debugger // left here to help developers determine the cause of having no states

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
