var levenshtein = require('fast-levenshtein');


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
const trace = dbg("trace:reactor");
const logger = dbg('debug:reactor');
const info = dbg('reactor');
const eventDebug = dbg('debug:reactor:events');

const elementInfo = (el) => {
  // debugger
  function esc(inp) {
    return inp.replace(/\./g, '\\.')
  }
  // return [el, esc(el.id)];
  if (el instanceof Document) return "‹document›";
  const classNames = [... el.classList ].map(esc).join('.');
  let {id} = el;
  if (id) id = `#${esc(id)}`;
  return `‹${el.tagName.toLowerCase()}.${classNames}${id}›`;
};

const debugInt = (debug) => {
  return (debug ?
    (typeof debug) == "string" ?
      parseInt(debug)
      : ((0 + debug) || 1)
    : 0);
};

const handledInternally = [Symbol("ReactorInternal")]

const stdHandlers = {
  'error': 1,
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
  trace(`listener creating subclass ${displayName}`);
  const clazz = class Listener extends componentClass {

    constructor(props) {
      super(props);
      this._listenerRef = React.createRef();
      this.listening = new Map();
    }
    get unlistenDelay() {
      throw new Error("listeners must provide an instance-level property unlistenDelay, for scheduling listener cleanups");
    }
    listen(eventName, handler, capture, {
      isInternal,
      observer,
      returnsResult
    }) {
      logger(`${this.constructor.name}: each Listener-ish should explicitly define listen(eventName, handler), with a call to _listen(eventName, handler) in addition to any additional responsibilities it may take on for event-listening`);
      console.warn(`${this.constructor.name}: each Listener-ish should explicitly define listen(eventName, handler), with a call to _listen(eventName, handler) in addition to any additional responsibilities it may take on for event-listening`);
      return this._listen(eventName, handler, capture, {
        isInternal,
        bare,
        observer,
        returnsResult
      });
    }
    notify(event, detail) {
      if (event instanceof Event) {
        throw new Error("notify() requires event name, not Event object");
      }
      event = this.eventPrefix() + event;
      eventDebug(`${this.name()}: notify '${event}':`, {detail});
      return this.trigger(event, detail, () => {});
    }
    trigger(event,detail, onUnhandled) {
      if (!this._listenerRef.current) {

        let {_reactorDidMount: mounted} = (this.state || {});
        if (mounted) {
          console.warn(`attempt to dispatch '${event}' event after Reactor unmounted: ${this.displayName || this.constructor.displayName}}`, {detail})
          return
        }

        if (event.type == "error") {
          console.error("error from unmounted component: "+ event.detail.error + "\n" + event.detail.stack);
          return;
        }
      }
      return Reactor.trigger(this._listenerRef.current, event, detail, onUnhandled);
    }
    actionResult(event, detail, onUnhandled) {
      let {_reactorDidMount: mounted} = (this.state || {});
      if (mounted && !this._listenerRef.current) {
        console.warn(`attempt to dispatch '${event}' event after Reactor unmounted: ${this.displayName || this.constructor.displayName}}`, {detail})
        return
      }
      return Reactor.actionResult(this._listenerRef.current, event, detail, onUnhandled);
    }

    _listen(eventName, rawHandler, capture, {
        isInternal,
        observer,
        returnsResult,
      }={}
    ) {
      const listening = this.listening;
      // console.warn("_listen: ", eventName, handler);
      const note = isInternal ? "" : "(NOTE: listener applied additional wrapper)";

      this._listenerRef.current.addEventListener(eventName, handler, {capture});
      const handler = isInternal ? rawHandler : this._wrapHandler(rawHandler, {
        eventName,
        isInternal,
        observer,
        returnsResult
      });
      trace("listening", {eventName}, "with handler:", handler, note);

      const listenersOfThisType = listening.get(eventName) ||
        listening.set(eventName, new Set()).get(eventName);

      listenersOfThisType.add(handler);
      return handler
    }

    componentDidMount() {
      trace("listener -> didMount");

      if (!this._listenerRef) {
        let msg = `${this.constructor.name}: requires this._listenerRef to be set in constructor.`;
        logger(msg);
        console.error(msg);
        throw new Error(msg)
      }
      if (!this._listenerRef.current) {
        let msg = `${this.constructor.name}: requires this._listenerRef.current to be set with ref={this._listenerRef}`;
        logger(msg);
        console.error(msg);
        throw new Error(msg)
      }
    }
    componentDidUpdate(prevProps, prevState) {
      trace(`${this.constructor.name} listener -> didUpdate`);
      logger("... didUpdate: ", {prevState, prevProps, st:this.state, pr:this.props});

      if ( ((!prevState) || (!prevState._reactorDidMount)) && this.state._reactorDidMount) {
        trace(`-> ${this.constructor.name} wrapped componentDidMount `);
        super.componentDidMount && super.componentDidMount();  // deferred notification to decorated Actor/Reactor of having been mounted
        trace(`<- ${this.constructor.name} wrapped componentDidMount `)
      }
      trace(`${this.constructor.name} listener -> didUpdate (super)`);
      if (super.componentDidUpdate) super.componentDidUpdate(prevProps, prevState);
      trace(`${this.constructor.name} listener <- didUpdate`);
    }

    componentWillUnmount() {
      if (super.componentWillUnmount) super.componentWillUnmount();
      let {debug} = this.props;
      const dbg = debugInt(debug);
      trace(`${this.constructor.name}: unmounting and deferred unlistening all...`);
      if (dbg) {
        console.log(`${this.constructor.name}: unmounting and deferred unlistening all...`);
      }
      let el = this._listenerRef.current;
      const stack = new Error("Backtrace");

      setTimeout(() => {
        const {listening} = this;

        trace(`${this.constructor.name} deferred unlisten running now`);
        if (dbg) console.warn(`${this.constructor.name} deferred unlisten running now`);

        for (const [type, listeners] of listening.entries()) {
          for (const handler of listeners.values()) {
            if (!stdHandlers[type]) {
              const thisPubSubEvent = this.events[type];
              if (thisPubSubEvent) {
                if (thisPubSubEvent.subscribers.size)
                  console.warn(`${this.constructor.name} removed published '${type}' listener, leaving ${thisPubSubEvent.subscribers.size} with no event source.`);
              } else {
                console.warn(`${this.constructor.name} removed remaining '${type}' listener: `, handler);
                if(dbg) console.warn(stack);
              }
            }

            this.unlisten([type, handler], el);
          }
        }
      }, this.unlistenDelay);
    }

    unlisten(typeAndHandler, el=this._listenerRef.current) {
      let [type,handler] = typeAndHandler;
      let listenersOfThisType = this.listening.get(type);

      let foundListening = listenersOfThisType.has(handler);

      if (!foundListening) {
          console.warn(`${type} listener not found/matched `, handler, `\n   ...in listeners`, [...listenersOfThisType.values()]);
          debugger
          return;
        }
      if (!el) throw new Error(`no el to unlisten for ${type}` );

      el.removeEventListener(type, handler);
      listenersOfThisType.delete(handler)
    }

    _wrapHandler(handler, {
        eventName,
        isInternal,
        observer,
        returnsResult
      }={}
    ) {
      const reactor = this;
      const createdBy = new Error("stack");
      function wrappedHandler(event) {
        if (returnsResult && !event.detail.result) {
          event.error = new Error(`event('${eventName}'‹returnsResult›): use Reactor.actionResult(...) or ‹actor›.actionResult(...)`);
          return;
        }
        const {type, detail} = (event || {});
        const {debug} = (detail || {});

        const dbg = debugInt(debug);
        const moreDebug  = (dbg > 1);

        event.handledBy = event.handledBy || [];
        const listenerObj = handler.boundThis || Reactor.bindWarning;
        let handled = {
          reactor,
          reactorNode: this,
          eventName,
          listenerObj,
          createdBy,
          listenerFunction: handler.targetFunction || handler
        };
        if (!handled.reactorNode) debugger;

        const isInternalEvent = type in Reactor.Events || isInternal;
        const listenerTarget = handler.boundThis && handler.boundThis.constructor.name;
        const listenerFunction = (handler.targetFunction || handler);
        const listenerName = listenerFunction.name;

        const showDebug = !isInternalEvent && (dbg || eventDebug.enabled);
        if (showDebug) {
          const msg = `${reactor.constructor.name}: Event: ${type} - calling handler at`;

          console.group(eventDebug.namespace, msg, elementInfo(event.target));
          eventDebug({
            listenerFunction,
            listenerTarget,
          });
        }
        trace(`${displayName}:  ⚡'${type}'`);
        try {
          const result = handler.call(this,event); // retain event's `this` (target of event)
          if (returnsResult) {
            if ("undefined" === typeof result) {
              const msg = `event('${type}'‹returnsResult›) handler returned undefined result`;
              console.error(msg, {handler});
              throw new Error(msg)
            }
            if (result && result.then) {
              const msg = `event('${type}'‹returnsResult›) handler returned a promise.  That might be an unplanned use of an async function, or it might be just what you wanted.  Your call.`;
              console.warn(msg, {handler});
            }
            if (event.error) {
              debugger
            } else {
              if (!isInternalEvent) eventDebug("(event was handled)");
              event.handledBy.push(handled);

              event.detail.result = result;
            }
            return result;
          } else if (!observer) {
            if (event.detail && event.detail.result == Reactor.pendingResult) {
              console.error("handler without returnsResult:", handler);
              throw new Error(`event called with eventResult, but the handler isn't marked with returnsResult.  Fix one, or fix the other.`)
            }
          }

          if (observer && !result) {
            // if (!isInternalEvent) console.log(`observer saw event('${event.type}')`, handled);
            eventDebug("event observer called")
          } else if (result === undefined || !!result) {
            if (!isInternalEvent) eventDebug("(event was handled)");
            if (event.handledBy.length > 8) debugger;
            event.handledBy.push(handled);
          } else {
            if (!isInternalEvent) eventDebug("(event was not handled at this level)");
          }
          return result;
        } catch(error) {
          if (observer) {
            const message = `event('${event.type}') observer ${listenerName} threw an error: `;
            console.error(message, error)
            Reactor.trigger(event.target, "error", {error:message + error.message});
          } else {
            event.error = error
          }
          // console.error(error);
          // logger(error);
          // throw(error)
        } finally {
          if (showDebug) console.groupEnd();
        }
      }
      wrappedHandler.innerHandler = handler && handler.targetFunction || handler;
      return wrappedHandler
    }
  }
  Object.defineProperty(clazz, "name", {value: displayName});
  return clazz;
};

export const Actor = (componentClass) => {
  if (!componentClass.prototype.name || ("function" !== typeof componentClass.prototype.name)) {
    throw new Error("Actors require a name() method; this name identifies the actor's delegate name for its Reactor, and scopes its Actions");
  }

  const listenerClass = Listener(componentClass);

  const displayName = inheritName(componentClass, "🎭");
  const className = inheritName(componentClass, "Actor");

  const clazz = class ActorInstance extends listenerClass {
    static get name() { return displayName };
    get unlistenDelay() {
      return 50
    }
    eventPrefix() { return `${this.name()}:` }

    constructor(props) {
      super(props);
      trace(`${displayName}: +Actor`);
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
      trace(`${displayName}: registering ‹Publish›ed event`, newName);
      event.detail.actor = this;
      event.detail.name = newName;
    }

    removePublishedEvent(event) {   // doesn't handle the event; augments it with actor & actor-name
      let {name, debug} = event.detail;
      let newName = `${this.name()}:${name}`;
      trace("unregistering ‹Publish›ed event", newName);
      event.detail.actor = this;
      event.detail.name = newName;
    }

    addActorNameToRegisteredAction(registrationEvent) {
      if(!registrationEvent.detail) {
        logger(`${this.constructor.name}: registerAction: registration event has no details... :(`);
        console.error(`${this.constructor.name}: registerAction: registration event has no details... :(`);
        debugger
      }
      let {name, debug, observer, bare} = registrationEvent.detail;
      let dbg = debugInt(debug);
      let moreDebug = (dbg > 1);
      let newName = (bare || observer) ? name : `${this.name()}:${name}`;
      logger(`${this.constructor.name} delegating registerAction(${name} -> ${newName}) to upstream Reactor`);
      if (dbg) console.log(`${this.constructor.name} delegating registerAction(${name} -> ${newName}) to upstream Reactor`);
      if (moreDebug) {
        console.log(registrationEvent);
        debugger
      }

      registrationEvent.detail.name = newName;
      // super.registerActionEvent(registrationEvent);
      // registrationEvent.stopPropagation();
    }

    listen(eventName, handler, capture, {
        isInternal,
        observer,
        returnsResult
      }={}
    ) {
      let {debug} = this.props;
      let dbg = debugInt(debug);
      trace(`${this.constructor.name}: listening to ${eventName}`);
      if (dbg) {
        console.log(`${this.constructor.name}: listening to ${eventName}`);
      }
      return this._listen(eventName, handler, capture, {
        isInternal,
        observer,
        returnsResult
      });
    }

    render() {
      let {_reactorDidMount: mounted} = (this.state || {});
      trace(`${this.constructor.name}: actor rendering`);

      return <div style={{display:"contents"}} className={`actor for-${displayName}`} ref={this._listenerRef}>
        {mounted && super.render && super.render()}
      </div>;
    }
    shouldComponentUpdate(nextProps, nextState) {
      if (nextState && nextState._reactorDidMount && ((!this.state) || (!this.state._reactorDidMount)) ) {
        return true;
      }
      if (super.shouldComponentUpdate) return super.shouldComponentUpdate(nextProps, nextState);
      return true;
    }

    componentDidMount() {
      let name = this.name();
      trace(`${displayName}: ${name} -> didMount`);

      if (super.componentDidMount) super.componentDidMount();
      let {debug} = this.props;

      let dbg = debugInt(debug);
      logger(`${this.constructor.name} didMount`);
      if (dbg) {
        console.log(`${this.constructor.name} didMount`);
      }

      this.listen(Reactor.Events.registerAction, this.addActorNameToRegisteredAction, false, {isInternal:true, observer:true});
      this.listen(Reactor.Events.registerPublishedEvent, this.registerPublishedEventEvent, false, {isInternal:true});
      this.listen(Reactor.Events.removePublishedEvent, this.removePublishedEvent, false, {isInternal:true});

      // if(foundKeys[0] == "action") debugger;
      const {detail:{
        registeredWith:reactor
      }} = this.trigger(
        Reactor.RegisterActor({name, actor:this, debug})
      ) || {};
      this._reactor = reactor

      this.setState({_reactorDidMount: true});
      trace(`${displayName}: ${name} <- didMount`);
    }

    componentWillUnmount() {
      if (super.componentWillUnmount) super.componentWillUnmount();

      let name = this.name();
      trace(`${displayName}: Actor unmounting:`, name);
      Reactor.trigger(this._listenerRef.current,
        Reactor.RemoveActor({name})
      );

    }

  }
  Object.defineProperty(clazz, "name", {value: className});
  Object.defineProperty(clazz, "displayName", {value: displayName});
  return clazz;
};


const reactorTag = Symbol("Reactor");
const Reactor = (componentClass) => {
  if (componentClass[reactorTag]) return componentClass;

  const listenerClass = Listener(componentClass);
  const componentClassName = componentClass.name;
  const reactorName = inheritName(componentClass, "Rx");
  trace(`Reactor creating branch+leaf subclass ${reactorName}`);
  const clazz = class ReactorInstance extends listenerClass {
    // registerActionEvent = Reactor.bindWithBreadcrumb(this.registerActionEvent, this);
    constructor(props) {
      trace(`${reactorName}: -> constructor(super)`);
      super(props);
      trace(`${reactorName}: -> constructor(self)`);
      this.Name = reactorName;
      this.name = () => reactorName;
      Object.defineProperty(this.name, "name", {value: reactorName});

      this.reactorProbe = Reactor.bindWithBreadcrumb(this.reactorProbe, this);
      // this.addReactorName = this.addReactorName.bind(this)
      this.addReactorName = Reactor.bindWithBreadcrumb(this.addReactorName, this)

      this.registerActionEvent = Reactor.bindWithBreadcrumb(this.registerActionEvent, this);
      this.removeAction = Reactor.bindWithBreadcrumb(this.removeAction, this);

      this.registerActor = Reactor.bindWithBreadcrumb(this.registerActor, this);
      this.removeActor = Reactor.bindWithBreadcrumb(this.removeActor, this);

      this.registerPublishedEventEvent = Reactor.bindWithBreadcrumb(this.registerPublishedEventEvent, this);
      this.removePublishedEvent = Reactor.bindWithBreadcrumb(this.removePublishedEvent, this);

      this.registerSubscriber = Reactor.bindWithBreadcrumb(this.registerSubscriber, this);
      this.removeSubscriberEvent = Reactor.bindWithBreadcrumb(this.removeSubscriberEvent, this);

      this.actions = {}; // known direct actions
      this.events = {};  // known events for publish & subscribe
      this.actors = {};  // registered actors
      trace(`${reactorName}: <- constructors`);
    }

    componentDidMount(...args) {
      // always true (listener branch class)
      // Note, the listener will defer calling the originally-decorated
      // class's componentDidMount() until state._reactorDidMount is changed
      // to true, which aligns with the timing of that class's first call
      // to render().
      trace(`${reactorName}: -> mounting(super)`);
      for (const init of Reactor.onInit) {
        init.call(this)
      }
      if (super.componentDidMount) super.componentDidMount(...args);
      trace(`${reactorName}: -> mounting(self)`);

      this.el = this._listenerRef.current;
      if (this.hasNotifications) {
        this.registerPublishedEvent({name:"success", target: this});
        this.registerPublishedEvent({name:"warning", target: this});
        this.registerPublishedEvent({name:"error", target: this});
      } else {
        this.registerAction({observer:true, isInternal: true, name:"error", handler:this.addReactorName});
      }
      const _l = this.internalListeners = new Set();
      const isInternal = {isInternal: true};
      this.listen(Reactor.Events.reactorProbe, this.reactorProbe, false, isInternal);

      this.listen(Reactor.Events.registerAction, this.registerActionEvent, false, {returnsResult: true, ...isInternal});
      this.listen(Reactor.Events.removeAction, this.removeAction, false, isInternal);

      this.listen(Reactor.Events.registerActor, this.registerActor, false, isInternal);
      this.listen(Reactor.Events.removeActor, this.removeActor, false, isInternal);

      this.listen(Reactor.Events.registerPublishedEvent, this.registerPublishedEventEvent, false, isInternal);
      this.listen(Reactor.Events.removePublishedEvent, this.removePublishedEvent, false, isInternal);

      this.listen(Reactor.Events.registerSubscriber, this.registerSubscriber, false, isInternal);
      this.listen(Reactor.Events.removeSubscriber, this.removeSubscriberEvent, false, isInternal);
      trace(`${reactorName}: +mounting flag`);

      this.setState({mounting: true});
      trace(`${reactorName}: <- didMount (self)`)
    }
    componentDidUpdate(...args) {
      const {mounting, _reactorDidMount:mounted} = this.state || {}
      if (!mounted) {
        trace(`${reactorName}: +didMount flag`);
        this.setState({_reactorDidMount: true});
        return
      }
      if (super.componentDidUpdate) return super.componentDidUpdate(...args)
    }
    shouldComponentUpdate(nextProps, nextState) {
      if (nextState && nextState._reactorDidMount && ((!this.state) || (!this.state._reactorDidMount)) ) {
        return true
      }
      if (nextState && nextState.mounting && ((!this.state) || (!this.state.mounting)) ) {
        return true
      }
      if (super.shouldComponentUpdate) return super.shouldComponentUpdate(nextProps, nextState);
      return true;
    }

    get unlistenDelay() {
      return 100
    }

    listen(eventName, handler, capture, {
        isInternal,
        observer,
        returnsResult
      }={}
    ) { // satisfy listener
      if (observer && returnsResult) throw new Error(`Action observer('${eventName}') can't also be returnsResult.  It's fine to observe a returnsResult event, but don't mark the observer with returnsResult.`)
      let effectiveHandler = this._listen(eventName, handler, capture, {
        isInternal,
        observer,
        returnsResult
      });
      trace(`${reactorName}: +listen ${eventName}`);

      logger("+listen ", eventName, handler, {t:{t:this}}, this.actions);
      return effectiveHandler;
    }

    addReactorName(event) { // for error events
      if (event.detail && !event.detail.reactor) event.detail.reactor = `(in ${this.constructor.name})`;
      return null
    }

    reactorProbe(event) {
      let {onReactor} = event.detail;
      trace(`${reactorName}: responding to reactorProbe`);
      if (!onReactor) {
        this.trigger(Reactor.ErrorEvent({error: "reactorProbe requires an onReactor callback in the event detail"}));
        return;
      }
      onReactor(this);
      event.handledBy = handledInternally;

    }

    registerActionEvent(event) {
      const {debug, name, capture, handler, ...moreDetails} = event.detail;
      const effectiveHandler = this.registerAction({debug, event, name, handler, capture, ...moreDetails});
      event.stopPropagation();
      event.handledBy = handledInternally;
      // satisfies the returnsResult/actionResult interface, without wrapper overhead.
      event.detail.result = effectiveHandler;
    }

    registerAction({
        debug,
        event,
        name,
        returnsResult,
        isInternal,
        handler,
        capture,
        observer="",
        bare,
        ...moreDetails
    }) {
      trace(`${reactorName}: +action ${name}`);
      if (!handler) {
        console.error(`RegisterAction: ${name}: no handler`, event.target)
        throw new Error(`RegisterAction: ${name}: no handler (see console for more details)`);
      }
      logger("...", moreDetails, `handler=${handler.name}`, handler);

      const priorityHandlers = [];

      const actionDescription = bare ? `bare '${name}' event ${observer || "handler"}` : `Action ${observer && "observer: "}'${name}'`;
      const existingActionHandler = this.actions[name];
      if (existingActionHandler && !bare && !observer) {
        let info = {
          listenerFunction: (existingActionHandler.targetFunction || existingActionHandler).name,
          listenerTarget: (
            (existingActionHandler.boundThis && existingActionHandler.boundThis.constructor.name)
            || Reactor.bindWarning
          ),
        };

        const msg = `${this.constructor.name}: ${actionDescription} is already registered with a handler`;
        console.error(msg);
        console.warn("existing handler info: ", info);
        throw new Error(msg);
      } else if ((bare || observer) && existingActionHandler) {
        console.warn(`vvvvvvvvv ${actionDescription} may not be called due to an existing Action listener`)
        console.dir(handler)
      }
      if (this.listening[name]) {
        console.warn(`there are existing listeners that may modify or stop the event before ${actionDescription} sees it;`)
        for (const listener of (this.listening[name])) {
          if (listener == existingActionHandler) continue;

          console.dir(listener)
        }
      }

      const effectiveHandler = this.listen(name, handler, capture, {
        isInternal,
        observer,
        bare,
        returnsResult,
      });
      if (!(bare || observer)) {
        this.actions[name] = effectiveHandler;
      }
      return effectiveHandler
    }

    removeAction(event) {
      const {
        debug,
        name,
        handler,
        observer="",
        bare,
        ...moreDetails
      } = event.detail;
      trace(`${reactorName}: -action ${name}`);
      if(debug) console.log(`${this.constructor.name}: removing action:`, event.detail);
      // debugger

      if (!this.actions[name] && !(bare || observer)) {
        logger(`can't removeAction '${name}' (not registered)`, new Error("Backtrace"));
        console.warn(`can't removeAction '${name}' (not registered)`, new Error("Backtrace"));
      } else {
        if (bare || observer) {
          this.unlisten([name, handler], this.el)
        } else {
          this.unlisten([name, this.actions[name]], this.el);
          delete this.actions[name];
        }
        event.stopPropagation();
        event.handledBy = handledInternally;
      }
    }
    registerPublishedEventEvent(event) {
      const {target, detail:{name, debug, actor, global}} = event;
      if (global && !this.isRootReactor) {
        logger(`${this.constructor.name}: passing global registerPublishedEvent to higher reactor`, event.detail);
        if (debug) console.warn(`${this.constructor.name}: passing global registerPublishedEvent to higher reactor`, event.detail);
        return;
      }
      this.registerPublishedEvent({name,debug, target, actor});
      event.handledBy = handledInternally;

      event.stopPropagation();
    }

    registerPublishedEvent({name, debug, target, actor}) {
      const message = `registering event '${name}'` + (actor ? ` published by ${actor.constructor.name}` : "");
      trace(`${reactorName}: `, message);

      if (debug) console.warn(message);


      const thisEvent =
        this.events[name] =
          this.events[name] || {
            publishers: new Set(),
            subscribers: new Set(),
            subscriberOwners: new Map(),
            _listener: this.listen(name, subscriberFanout)
          };

      thisEvent.publishers.add(actor);


      function subscriberFanout(event) {
        logger(`got event ${name}, dispatching to ${thisEvent.subscribers.size} listeners`);
        if (debug) console.warn(`got event ${name}, dispatching to ${thisEvent.subscribers.size} listeners`);

        let anyHandled = null;
        for (const subscriberFunc of thisEvent.subscribers) {
          eventDebug(`'${name}: delivering to subscriber`, subscriberFunc);

          const r = subscriberFunc(event);
          if (r == undefined || !!r) {
            anyHandled = r
          }
          // ?? honor stopPropagation[immediate] ?
        }
        return anyHandled;
      }
    }

    eventPrefix() { return "" }

    removePublishedEvent(event) {
      let {target, detail:{name, global, actor, debug}} = event;

      if (global && !this.isRootReactor) {
        logger(`${this.constructor.name}: passing global removePublishedEvent to higher reactor`, event.detail);
        if (debug) console.warn(`${this.constructor.name}: passing global removePublishedEvent to higher reactor`, event.detail);
        return;
      }

      const thisEvent = this.events[name]; if (!thisEvent) {
        console.warn(`can't removePublishedEvent ('${name}') - not registered`);
        throw new Error(`removePublishedEvent('${name}') not registered...  Was its DOM element moved around in the tree since creation?`);
      }
      const {subscriberOwners: owners, publishers} = thisEvent;
      if (!publishers.has(actor)) {
        console.warn(`can't removePublishedEvent('${name}') - actor not same as those who have registered`, {actor, publishers});
        return;
      }
      publishers.delete(actor);

      if (!publishers.size) {
        const subs = thisEvent.subscribers;

        for (const sub of subs.values()) {
          const owner = owners.get(sub);
          if (owner && owner.publisherUnmounted) {
            // avoid spurious warnings when publisher and subscriber are being unmounted in a single batch:
            owner.publisherUnmounted();
            owners.delete(sub)
          } else {
            console.warn(`${this.constructor.name}: removePublishedEvent('${name}'): subscriber function had no matching owner:`, sub);
          }
          subs.delete(sub);
        }
        if (subs.size) {
          console.error(`removing published event with ${subs.size} orphaned subscribers...\n...owners & subscribers:`,
            [...subs.values()].map(s => [ owners.get(s), s ])
          );
        }
        this.unlisten([name, thisEvent._listener], target);
        delete this.events[name];
        event.stopPropagation();
      } else {
        logger(`${this.constructor.name}: event '${name}' is still published by ${publishers.size} actors:`, [...publishers.values()] );
        if (debug) console.warn(`${this.constructor.name}: event '${name}' is still published by ${publishers.size} actors:`, [...publishers.values()] );
      }
      event.handledBy = handledInternally;
    }

    registerActor(event) {
      let {name, actor, debug} = event.detail;
      trace(this.constructor.name, `registering actor '${name}'`);

      if (debug) console.info(this.constructor.name, `registering actor '${name}'`);
      if (this.actors[name]) {
        console.error(`Actor named '${name}' already registered`, this.actors[name]);
      } else {
        this.actors[name] = actor;
        event.detail.registeredWith = this;
        event.handledBy = handledInternally;
      }
      event.stopPropagation();
    }

    removeActor(event) {
      let {name} = event.detail;
      if(this.actors[name]) {
        delete this.actors[name];
        event.stopPropagation();

        event.handledBy = handledInternally;
      } else {
        console.error(`ignoring removeActor event for name '${name}' (not registered)`)
      }
    }

    // matches a registerSubscriber event to a Reactor node by inspecting its
    // known publishers.  If it's not matched, it passes the event on to a higher-level
    // Reactor, after decorating the event with a list of published event-names that are similar
    // to the requested one.  And if the current Reactor is a root-reactor ("isRootReactor=true"),
    // it issues an error event with a friendly message for the developer.
    // When the requested event-name is found, it stops the registerSubscriber from further
    // propagation and calls through to registerSubscriberEvent().
    registerSubscriber(event) {
      let {eventName, owner, candidates: deeperCandidates = [], listener, debug} = event.detail;
      eventName = eventName.replace(/\u{ff3f}/u, ':');
      if (!this.events[eventName]) {
        const possibleMatches = Object.keys(this.events);

        const distances = possibleMatches.map(candidate =>
            [levenshtein.get(candidate, eventName) / eventName.length, candidate]
        );
        const closeDistances = distances.filter(([distance,x]) => distance < 0.6);
        const likelyCandidates = closeDistances.
            sort(([d1],[d2]) => ( (d1 < d2) ? -1 : 1)).
            map(([distance, candidate]) => candidate);

        let allKnownCandidates = [
            ...likelyCandidates,
            ...deeperCandidates
        ];

        if (this.isRootReactor) {
          const candidatesMessage = allKnownCandidates ? ` (try one of: ${allKnownCandidates.join(",")})` : "";
          const message = `${this.constructor.name}: ‹Subscribe ${eventName}›: no matching ‹Publish›${candidatesMessage}`;
          console.warn(message);

          this._listenerRef.current.dispatchEvent(
            Reactor.ErrorEvent({error: message, detail:event.detail, backtrace: new Error("stack"), listener})
          );
          return true
        } else {
          // augment the event with candidates we identified at this level,
          // before letting the event propage up through the tree.
          event.detail.candidates = allKnownCandidates;

          logger(`${this.constructor.name}: unknown registerSubscriber request; passing to higher reactor`, event.detail);
          if (debug) console.warn(`${this.constructor.name}: ignored unknown registerSubscriber request`, event.detail);
        }
        return false
      } else {
        eventDebug(`${this.constructor.name}: +subscriber:`, {eventName, debug, listener});
        logger(`${this.constructor.name}: +subscriber:`, {eventName, debug, listener});
        if (debug) console.warn(`${this.constructor.name}: +subscriber:`, {eventName, debug, listener});
      }
      event.stopPropagation();
      event.handledBy = handledInternally;

      logger(`${this.constructor.name}: registering subscriber to '${eventName}': `, listener, new Error("...stack trace"));
      if (debug > 1) console.warn(`${this.constructor.name}: registering subscriber to '${eventName}': `, listener, new Error("...stack trace"));

      // setTimeout(() => {
      this.addSubscriberEvent(eventName, owner, listener, debug);
      // }, 1)
    }

    // takes a validated ‹Publish› event-name, a subscribing actor reference and a subscriber-function,
    // and adds the subscriber to the event's set of subscribers.
    addSubscriberEvent(eventName, owner, subscriberFn, debug) {
      const thisEvent = this.events[eventName];
      if (thisEvent) {
        const {subscribers, subscriberOwners:owners} = thisEvent;
        if (subscribers.has(subscriberFn)) {
          const existingOwner = owners.get(subscriberFn);
          const ownerBit = existingOwner ? [ "\n...with existing owner", existingOwner ] : [];
          console.error(`addSubscriberEvent('${eventName}'): ignoring duplicate subscription:`, subscriberFn, ...ownerBit,
            `\n---> have you subscribed using a method in your class as an event handler?  \n`+
              `     you should probably bind that function to its instance in constructor.`
          );
          return;
        } else {
          const pOwner = owners.get(subscriberFn);
          if (pOwner) {
            // this isn't supposed to happen - it's just for sanity-checking.
            const message = `addSubscriberEvent('${eventName}'): subscriberOwners already has this subscriberFunction registered to another owner`;
            console.error(message, {subscriberFn, owner:pOwner});
            throw new Error(message + " (see console for more detail)")
          }

          subscribers.add(subscriberFn);
          if (owner) {
            owners.set(subscriberFn, owner);
          } else {
            const message = `addSubscriberEvent('${eventName}'): registering subscriber without an owner.  \n`+
              `   ...if you add event.detail.owner pointing to an object with .publisherUnmounted(), you can get `+
              `      notifications when the publisher is unmounting, which can help you suppress spurious warnings `+
              `      (and possible memory leaks as well) when ‹Publish› and ‹Subscribe› are unmounted at the same time.`;
            console.warn(message, subscriberFn);
          }
        }
      } else {
        throw new Error(`addSubscriberEvent('${eventName}'): bad event name in subscription request`)
      }
    }

    removeSubscriberEvent(event) {
      let {eventName, owner, listener, debug} = event.detail;
      eventName = eventName.replace(/\u{ff3f}/u, ':');

      const thisEvent = this.events[eventName];
      if (!thisEvent) {
        if (this.isRootReactor) {
          const message = `${this.constructor.name} in removeSubscriber: unknown event ${eventName}`;
          logger(message)
          console.warn(message);
          this._listenerRef.current.dispatchEvent(
            Reactor.ErrorEvent({error: message, backtrace: new Error("stack"), listener})
          )
        }
        return
      }
      eventDebug(`${this.constructor.name}: -subscriber removed:`, {eventName, debug, listener});
      event.handledBy = handledInternally;

      event.stopPropagation();
      this.removeSubscriber(eventName, owner, listener, debug);
    }

    removeSubscriber(eventName, owner, subscriberFn, debug) {
      const thisEvent = this.events[eventName];
      const {subscribers, subscriberOwners:owners} = thisEvent;

      logger(`${this.constructor.name}: removing subscriber to '${eventName}': `, subscriberFn);
      if (debug) console.warn(`${this.constructor.name}: removing subscriber to '${eventName}': `, subscriberFn,
        new Error("...stack trace")
      );

      if (!subscribers.delete(subscriberFn)) {
        logger(`${this.constructor.name}: no subscribers removed for ${eventName}`);
        console.warn(`${this.constructor.name}: no subscribers removed for ${eventName}`)
      } else {
        // it's ok to just delete the owner entry here - it's only needed during
        //   Publish-removal, when it's possible that this code path can't run
        //   properly because the Publish and Subscribe are both removed from
        //   the DOM at the same time.
        if (!owners.delete(subscriberFn)) {
          console.warn(`${this.constructor.name}: removed a subscriber with no matching owner:`, subscriberFn, "\n     ... did the registerSubscriber event have details.owner?");
        }
        const after = thisEvent.subscribers.size;
        logger(`${this.constructor.name}: removed a subscriber for ${eventName}; ${after} remaining`);
        if (debug)
          console.warn(`${this.constructor.name}: removed a subscriber for ${eventName}; ${after} remaining`);

        // we don't currently stop listening if no subscribers are left
        // so that we don't have to deal with re-listening.  Unmounted
        // publishers will unlisten as part of their lifecycle.
      }
    }

    filterProps(props) {
      if (super.filterProps)
          return super.filterProps(props);

      return props;
    }
    render() {
      let {mounting=false, _reactorDidMount: mounted} = (this.state || {});
      trace(`${reactorName}: reactor rendering`, {mounted});
      let props = this.filterProps(this.props);
      let {isFramework=""} = this;
      if (isFramework) isFramework=" _fw_";
      if (this.debug || this.props.debug) debugger;

      return <div
        style={{display:"contents"}}
        ref={this._listenerRef}
        className={`reactor for-${componentClassName}${isFramework}`}
        {...props}
      >
        {mounting && Reactor.universalActors}
        {mounted && super.render()}
      </div>
    }
  };
  Object.defineProperty(clazz, reactorTag, { value: true });
  Object.defineProperty(clazz, 'name', { value: reactorName});
  return clazz;
};
Reactor.pendingResult = Symbol("‹pending›")
Reactor.onInit = []
Reactor.universalActors = []

Reactor.actionResult = function getEventResult(target, eventName, detail={}, onUnhandled) {
  let event;
  if (eventName instanceof Event) {
    event = eventName;
    eventName = event.type
  } else {
    if ("string" !== typeof eventName) throw new Error("actionResult: must give a string eventName or Event.");
    event = new CustomEvent(eventName, {bubbles: true, detail});
  }

  event.detail.result = Reactor.pendingResult;
  if (!onUnhandled) onUnhandled = (unhandledEvent, error = "") => {
    if (error) {
      const msg = `caught error in action('${eventName}'‹returnsResult›):`;
      error.stack = `${msg}\n${error.stack}`;
      Reactor.trigger(target, "error", {error:`${msg} ${error.message}`}); // this helps when a synchronous action is called from an async function
      throw error;
    } else {
      const msg = `actionResult('${eventName}'): Error: no responders (check the event name carefully)!`;
      error = new Error(msg);
      console.error("unhandled event:", unhandledEvent, "\n", error);
      throw error;
    }
  };

  Reactor.dispatchTo(target, event, detail, onUnhandled);
  if (Reactor.pendingResult === event.detail.result) {
    if (onUnhandled) {
      return result
    }
    throw new Error(`actionResult('${eventName}') did not provide event.detail.result`)
  }

  if (event.detail) return event.detail.result;
};

Reactor.dispatchTo =
  Reactor.trigger = function dispatchWithHandledDetection(
    target, event, detail,
    onUnhandled
  ) {
  let backTrace = new Error("trace");
  backTrace.stack = backTrace.stack.split("\n").slice(2).join("\n");
  let bubbles = true;
  if ("function" == typeof(detail)) {
    if (!(event instanceof Event)) throw new Error("missing object for event details in arg 3");

    onUnhandled = detail;
    detail = {}
  } else {
    if (!detail) detail = {};
    if (detail.bubbles) {
      bubbles = detail.bubbles;
      delete detail.bubbles;
    }
  }

  if (!(event instanceof Event)) {
    event = new CustomEvent(event, {bubbles, detail});
  }
  if (!(target instanceof Element)) {
    try {
      target = ReactDOM.findDOMNode(target)
    } catch(e) {
      // no-op; will fall through to errors below
    }
  }
  if (!(target instanceof Element)) {
    if (event.type == 'error') {
      console.warn("Can't dispatch error (no DOM node target), so raising to console instead");
      console.error(event.detail);
      return
    }
    const msg = `Reactor.dispatchTo: ${event.type} event missing required arg1 (must be a DOM node or React Component that findDOMNode() can use)`;
    logger(msg);
    backTrace.stack = msg + backTrace.stack;
    console.warn(backTrace);
    throw backTrace;
  }

  target.dispatchEvent(event);
  let error = event.error;
  if (event.handledBy && event.handledBy.length) {
    if (error) {
      const msg = `Handled(!) event('${event.type}') had error: `;
      Reactor.trigger(target, "error", {error: msg + error.message});
      console.error(msg, error, "\nhandledBy:", event.handledBy);
    }
    return event;
  }

  if (onUnhandled) {

    const result = onUnhandled(event, error);
    if (event.detail.result == Reactor.pendingResult) {
      event.detail.result = result
      return result;
    }
    return event;
  } else if (!error && null === onUnhandled ) {
    return event;
  }

  warnOnUnhandled.bind(this)(event, error);

  function warnOnUnhandled(event, caughtError) {
    if (detail && detail.optional) {
      const message = `unhandled event ${event.type} was optional, so no error event`;
      logger(message);
      console.warn(message);
      return;
    }
    const eventDesc = (this.events && this.events[event.type]) ?
      `Published event '${event.type}'`
      : `action '${event.type}'`;

    const isErrorAlready = event.type == "error";
    let helpfulMessage
    if (!isErrorAlready) {
      // console.error(event);
      const error = (caughtError ? "Error thrown in" : "unhandled event:");
      const errorWithFriendlyStack = new Error(""); {
        let foundFramework = false;
        let callerStack = [];
        let handlerStack = [];
        for (const line of (caughtError || errorWithFriendlyStack).stack.split("\n")) {
          if (line.match(/wrappedHandler|trigger|dispatchWithHandledDetection/)) {
            foundFramework = true;
          } else if (!line.match(/react-dom/)) {
            if (foundFramework) {
              callerStack.push(line)
            } else {
              handlerStack.push(line);
            }
          }
        }
        const filteredStack = [
          ...handlerStack,
          "in handler ^^^^^  ...called from vvvvv",
          ...callerStack
        ].join("\n");
        let firstReactor = "";
        let elInfo = []; {
          for (let p=event.target; !!p; p = p.parentNode) {
            if (!p.classList) continue;
            if (!p.classList.contains("reactor")) continue;
            if (p.classList.contains("_fw_")) continue;
            const thisElInfo = elementInfo(p);
            firstReactor = firstReactor || ` (in ${thisElInfo})`;
            elInfo.push(thisElInfo);
          }
          elInfo = elInfo.reverse().join("\n");
        }
        helpfulMessage = `${error} ${eventDesc}`+
          ((caughtError && (": "+caughtError.message)) || "")+
          firstReactor;

        errorWithFriendlyStack.message = helpfulMessage;
        if (foundFramework) errorWithFriendlyStack.stack = `${helpfulMessage}\n${elInfo}\n${filteredStack}`;
        if (caughtError) errorWithFriendlyStack.originalError = caughtError;
      }
      const unk = new CustomEvent("error", {bubbles:true, detail: {
        // debug:1,
        error: helpfulMessage,
        reactor: " ", // suppress redundant info (??? move all of this to the error-notification?)
        ...detail
      }});
      target.dispatchEvent(unk);
      // if the error event is handled, it indicates the error was successfully
      // processed by a UI-level actor (displaying it for the user to act on)
      if (!(unk.handledBy && unk.handledBy.length)) {
        // when that ‹unk› event isn't handled, it's typically thrown to the
        // console as an error that was not presented to the user (in a later call
        // into this same method)
      } else {
        // still, we show the full error detail on the console for the developer
        // to be able to act on:
        return console.error(errorWithFriendlyStack);
      }

      // event = unk
    }

    if (caughtError) {
      caughtError.stack = `Error thrown in ${eventDesc}:\n` + caughtError.stack;

      throw caughtError;
    }

    const message = this.events && this.events[event.type] ?
      `unhandled ${eventDesc} with no ‹Subscribe ${event.type}={handlerFunction}›\n` :
      `unhandled ${eventDesc}.  Have you included an Actor that services this event?\n`+
        (isErrorAlready ? "" : "Add an 'error' event handler to catch errors for presentation in the UI.");


    logger(message,
      event.detail,
      `...at DOM Target:  `, (event.target && event.target.outerHTML), "\n",
      backTrace
    );
    console.error(message,
      event.detail,
      `...at DOM Target:  `, (event.target && event.target.outerHTML), "\n",
      backTrace
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
    logger(`+Event: ${type}: `, eventProps);
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
    this.Name = "";
    this._actionRef= React.createRef();
  }

  render() {
    let {children, returnsResult, capture, observer="", bare, id, client, debug, ...handler} = this.props;
    const foundKeys = Object.keys(handler);
    const foundName = foundKeys[0];

    return <div {...{id}} style={{display:"none"}} className={`action${observer && " observer"} action-${foundName}${returnsResult && " use-actionResult" || ""}`} ref={this._actionRef} />;
  }

  componentDidMount() {
    let {
      children,
      id,
      name,
      returnsResult,
      observer="",
      capture,
      client="‹unknown›",
      debug,
      ...handler
    } = this.props;
    if (super.componentDidMount) super.componentDidMount();

    const foundKeys = Object.keys(handler);
    if (foundKeys.length > 1) {
      throw new Error("Actions should only have a single prop - the action name. (plus 'debug', 'id', 'returnsResult', 'observer', or 'bare')\n"+
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
    name = name || foundName;

    let registerEvent = Reactor.RegisterAction({
      name,
      returnsResult,
      observer,
      bare,
      capture,
      handler,
      debug});
    this.handler = Reactor.actionResult(this._actionRef.current,
      registerEvent
    );
    this.fullName = registerEvent.detail.name;
    Object.defineProperty(this, "Name", {value: (observer && "👁️")+(bare ? "⚡" : "🏒") + this.fullName});
  }


  componentWillUnmount() {
    if (super.componentWillUnmount) super.componentWillUnmount();

    let {
      client,
      observer,
      bare,
      debug
    } = this.props;

    const stack = new Error("Backtrace");
    const handler = this.handler

    client = client || (handler && handler.name || "‹no handler›");
    const el = this._actionRef.current;
    if (!el) throw new Error("no el")

    logger(`${this.constructor.name}: scheduling action removal: '${this.fullName}'`);
    if (debug) console.log(`${this.constructor.name}: scheduling action removal: '${this.fullName}'`);
    // setTimeout(() => {
      logger(`${this.constructor.name}: removing action '${this.fullName}' from client: `, client);
      if (debug) console.log(`${this.constructor.name}: removing action '${this.fullName}' from client: `, client);
      logger("...from el", el.outerHTML, "with parent", elementInfo(el.parentNode));
      if (debug) console.log("...from el", el.outerHTML, "with parent", elementInfo(el.parentNode));
      if (debug > 1) console.log(stack);

      try {
        Reactor.trigger(el,
          Reactor.RemoveAction({
            debug,
            observer,
            bare,
            name: this.fullName,
            handler
          })
        );
      } catch(e) {
        console.error(`${this.constructor.name}: error while removing action:`, e);
      }
      logger(`<- Removing action '${this.fullName}'`);
      if (debug) console.log(`<- Removing action '${this.fullName}'`);
    // }, 2)
  }
}
Object.defineProperty(Action, "displayName", {value: "🏒Action"})
Object.defineProperty(Action, "name", {value: "Action"});
Reactor.Action = Action;

export class Publish extends React.Component {
  constructor(props) {
    super(props);
    this._pubRef= React.createRef();
  }

  render() {
    let {event:name} = this.props;
    return <div style={{display:"none"}} className={`published-event event-${name}`} ref={this._pubRef}/>;
  }

  componentDidMount() {
    // console.log("Publish didMount");
    if (super.componentDidMount) super.componentDidMount();

    let {children, event:name, global, debug, ...handler} = this.props;

    const foundKeys = Object.keys(handler);
    if (foundKeys.length > 0) {
      throw new Error("‹Publish event=\"eventName\"› events should only have the 'event' name, and optionally 'global' or 'debug')\n");
    }
    Reactor.trigger(this._pubRef.current,
      Reactor.PublishEvent({name, global, debug})
    );
  }
  componentWillUnmount() {
    if (super.componentDidMount) super.componentDidMount();

    let {children, event:name, global, debug, ...handler} = this.props;
    Reactor.trigger(this._pubRef.current,
      Reactor.RemovePublishedEvent({name, global, debug})
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
    let subscriberReq = Reactor.SubscribeToEvent(
      {eventName: this.eventName, owner: this, listener: this.listenerFunc, debug: this.debug});
    let {optional = false} = this.props;
    this.subscriptionPending = true;
    // defer registering the subscriber for just 1ms, so that
    // any <Publish>ed events from Actors will have their chance
    // to be mounted and registered:
    setTimeout(() => {
      delete this.subscriptionPending;
      if (!this.unmounting && this._subRef.current) {
        Reactor.trigger(this._subRef.current, subscriberReq, {},
          optional ? (unhandledEvent) => {
              this.failedOptional = true;
              console.warn(`unhandled subscribe to '${this.eventName}' was optional, so no error event.`)
          } : undefined
        );
      } else {
        console.log(
          `Subscribe: event '${this.eventName}' didn't get a chance to register before being unmounted.  \n`+
          `NOTE: In tests, you probably want to prevent this with "await delay(1);" after mounting.`
        );
      }
    }, 1)
  }

  componentWillUnmount() {
    if (super.componentWillUnmount) super.componentWillUnmount();

    if (this.failedOptional) return;
    if (!this.subscriptionPending && !this.pubUnmounted) Reactor.trigger(this._subRef.current,
      Reactor.StopSubscribing({eventName: this.eventName, listener: this.listenerFunc})
    );
    this.unmounting = true;
  }
  publisherUnmounted() {
    this.pubUnmounted = true;
  }

  render() {
    let {children, optional, debug, ...handler} = this.props;

    const foundKeys = Object.keys(handler);
    if (foundKeys.length > 1) {
      throw new Error("‹Subscribe eventName={notifyFunction}› events should only have a single prop - the eventName to subscribe. ('optional' and 'debug' props also allowed)\n");
    }
    this.eventName = foundKeys[0];
    this.debug = debug;
    if (this.listenerFunc && this.listenerFunc !== handler[this.eventName]) {
      throw new Error(
        `‹Subscribe ${this.eventName}› has changed event handlers, which is not supported. `+
        `... this can commonly be caused by doing ${this.eventName}={this.someHandler.bind(this)} on a component class.  A good fix can be to bind the function exactly once, perhaps in a constructor.`
      );
    }
    this.listenerFunc = handler[this.eventName];

    return <div style={{display:"none"}} className={`listen listen-${this.eventName}`} ref={this._subRef} />;
  }


}
