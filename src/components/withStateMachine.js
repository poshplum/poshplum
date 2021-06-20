import PropTypes from "prop-types";
import React from 'react';
import map from 'lodash/map';
import keys from 'lodash/keys';
import find from 'lodash/find';

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
  let baseName = baseClass.wrappedName || baseClass.name;
  let dName = inheritName(baseClass,`FSM`);
  const enhancedBaseClass = class withStateMachine extends baseClass {
    get displayName() {
      return baseClass.displayName || baseClass.name
    }
    constructor(props) {
      super(props);
      this._stateRef = React.createRef();
      this.state = {currentState: "default", ...(this.state || {})};
    }
    static State = State;

    setFsmLogger() {
      let component = this.wrappedName || baseName;

      if (this.logger) this.fsmLogger = this.logger.child({
        name:`${this.logger.loggerName}:fsm`,
        component,
        addContext: null
      });
    }
    warn(...args) {
      if (this.fsmLogger) return this.fsmLogger.warn(...args);
      console.warn(...args);
    }
    error(...args) {
      if (this.fsmLogger) return this.fsmLogger.error(...args);
      console.error(...args);
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
    progressInfo(...args) {
      if (this.fsmLogger) return this.fsmLogger.progressInfo(...args)
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
      this.debugLog({detail:{childrenCount: children.length}}, `-> findStates`);
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
        this.debugLog("single child found; finding states inside that child");
        return this.findStates(children.props.children);
      }
      if (!this.states) {
        this.info({detail:{
          stateCount: Object.keys(states).length
        }}, `created state machine`);
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
      this.debugLog(`-> componentDidMount (super)`);
      if (super.componentDidMount) super.componentDidMount();
      this.setFsmLogger()
      this.progress(`<- componentDidMount (super); now for self...`);

      if (!this.states) {
        this.warn("withStateMachine should always have states before it gets componentDidMount.")
      } else {
        const {currentState="default"} = (this.state || {});
        const initialState = this.states[currentState];
        if (!initialState) {
          this.trigger("error", {error: `${this.constructor.name}: state machine should have a 'default' state.`});
          return;
        }
        if (initialState.onEntry) {
          setTimeout( () => {
            this.progressInfo({detail:{initialState: currentState}}, `🡆 onEntry()`);
            initialState.onEntry();
            this.debugLog({detail:{currentState}}, `<- onEntry`);
          }, 1)
        }
        this.progress(`<- componentDidMount (self)`)
      }
    }
    mkTransition(name) {
      if (!this._transitions) this._transitions = {};

      let displayName = `stateTransition‹${name}›`;
      if (!this._transitions[name]) {
        this._transitions[name] = Reactor.bindWithBreadcrumb(function(event) {
            event && event.stopPropagation();
            return this.transition(name)
          }, this,
        displayName
      );}

      return this._transitions[name];
    }
    transition(transitionName) {
      let {currentState="default"} = (this.state || {});

      let thisState = this.states[currentState];
      let nextState = thisState.transitions[transitionName];
      let goodTransitions = keys(thisState.transitions);
      let predicate, effectFn;

      if (Array.isArray(nextState)) {
        [predicate=() => {
          let e = new Error(`missing predicate definition for attempted transition '${transitionName}' from state '${currentState}'`);
          e.name = "warning";
          this.warn(e);
        }, nextState, effectFn] = nextState;
      }
      if (!nextState) {
        this.error({detail:{transitionName, currentState}}, `invalid transition attempt`);
        throw new Error(`${baseName}: INVALID transition('${transitionName}') attempted from state '${currentState}' (suggested: ${goodTransitions.join(',')})}`);
      }
      const nextStateDef = this.states[nextState];

      if (!nextStateDef) {
        this.error({detail:{transitionName, nextState}}, `invalid target state in transition definition`);
        throw new Error(`${baseName}: INVALID target state in '${currentState}:transitions['${transitionName}'] -> state '${nextState}'`);
      }
      this.progress({
        detail: {transitionName, nextState, transitionDef: this._transitions[transitionName]},
        summary: `${transitionName}⭞ ${nextState}`
      }, `transition`);

      if (predicate) {
        if (typeof(predicate) !== 'function') {
          throw new Error(`${baseName}: INVALID predicate (${predicate}); function required.\n...in transition(${transitionName}) from state '${currentState}'`);
        }

        this.progressInfo({
          detail: {currentState, nextState, predicate: predicate.name, stack: new Error("trace")},
          summary: `${currentState} -> ${predicate.name || "predicate"}() -> ${nextState}`,
        }, `running transition predicate`);

        if (predicate.call(this) === false) {
          this.progressInfo(`${this.constructor.name}: transition(${transitionName}) from state '${currentState}' denied by predicate in state machine`);

          return false
        }
      }
      if (this.debugState > 1) debugger;
      if (currentState !== nextState) this.setState({currentState: nextState});
      if (effectFn) {
        try {
          this.progress({
            detail:{transitionName, nextState},
            summary:`-> ${transitionName}⭞ effect() 🡆 ${nextState}`,
          }, `transition effect`);

          effectFn();
          this.progress(`<- ${transitionName}⭞ effect callback`);
        } catch(e) {
          this.error({
            detail: {currentState, transitionName, nextState, error: e.stack||e },
            summary: `<-!${transitionName}⭞ ERROR: ${e.stack||JSON.stringify(e)}`,
          }, `error in effect callback`);
          this.trigger("error", {error: e});
        }
      }
      if (currentState !== nextState && nextStateDef.onEntry) {
        setTimeout( () => {
          this.progress({summary: nextState}, `  ... onEntry() 🡆 `);
          nextStateDef.onEntry();
          this.debugLog({detail:{nextState}}, `<- onEntry()'`);
        }, 0);
      }

      this.progressInfo({summary:nextState}, " 🗸 transitioned 🡆 ");
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
      return <div key="fsmWrapper" style={{display:"contents"}} className={`stateMachine state-${currentState}`} ref={this._stateRef}>
        {inner}

        {transitions && <React.Fragment key="my-transitions" children={Object.entries(transitions).map( ([transitionName, target]) => {
          let actionArgs = {
            [transitionName]: this.mkTransition(transitionName)
          };
          return <Action debug={0} client={this} key={`action-${transitionName}`} {...actionArgs} />
        })} />}

      </div>
    }
  };
  Object.defineProperty(enhancedBaseClass, "name", {value: dName});
  return Reactor(enhancedBaseClass);
};
export default withStateMachine;
