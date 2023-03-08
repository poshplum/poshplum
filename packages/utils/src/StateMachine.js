import cloneDeep from "lodash/cloneDeep.js";

import { forkZoneWithContext, forkZoneWithLogger, ZonedStackTrace } from "./zonedLogger";

import { hasError } from "./hasError";

class UnmetPredicate extends Error {
    static retriable = false;
    retriable = false;
}
class InvalidTransition extends ZonedStackTrace {
    static retriable = false;
    retriable = false;
}

// usage: Create a state machine by using the GenericStateMachine's
//     factory-method withDefinition({...machineStates}).
//
//  An oversimplified machine could look like this:
//    const machineStates = {
//      { green: { warnTraffic: "yellow" } },
//      { yellow: { stopTraffic: "red" } },
//      { red: { allowTraffic: "green", default: true } },
//    }
//
//  This example could work in the real world, given another software module that decides
//    when to trigger allowTraffic and the other transitions.  A version closer to realistic
//    might look like this:
//
//    machineStates: {
//      red: { default: true, onEntry() { return camera.enforceLaw() },
//        allowTraffic: "green",
//      },
//      green: { onEntry() { return watchForCrossTraffic() },
//        warnTraffic: { nextState: "yellow", effect() { return stopWatchingCrossTraffic() } }
//      }
//      yellow: { onEntry() { delayedRed() }
//        stopTraffic: "red",
//      }
//    };
//
//  The states are defined as key/value pairs, where the key is the
//     name of the state, and the value is an object having one
//     or more transitions (defined below) and a few special keys:
//
//      * default: true        // makes it the default state; optional if there is a state named default
//      * label: "string"      // gives a friendlier string, e.g. for onscreen display
//      * onEntry: ‹function›  // called when the machine enters this state.  You can trigger
//                             //  automatic transitions from this callback.
//
//   We recommend state names be clear, static-sounding words.  "-ing" and "-ed" words are typically good choices.
//
//   The transitions defined for each state are also key/values.  The keys are transition names; we recommend
//      these sound like commands ("start", "search") or indications that something happened ("opened", "thingAdded").  
//      Values can either be a simple string (the name of the next state resulting from this transition) or an object with 
//      nextState and optional callbacks for {predicate, effect}:
//
//      * nextState: string    // the next state that the machine will be in when this transition is triggered.
//      * predicate: function  // if defined, it can allow or block the transition by returning true/false.
//                             //   *** do not trigger transitions from this function.  Can be an async function.
//      * effect: function     // if defined, this indicates a side-effect to be triggered before the machine
//                             //   changes to nextState.
//                             //   *** do not trigger transitions from this function.  Can be an async function.
//      * reEntry: boolean     // for a transition that leads from the current state back to the same state, this
//                             //   boolean attributes specifies that the `onEntry()` MUST be re-run.
//
//  All callbacks can be async functions, whose pending promises will block progress of the state machine.
//
//  Integration: A state machine class can also define an onTransition() method, useful for integrating the
//    state-machine with an outside module (i.e. for reflecting the effect of the state having changed).  And a
//    state-machine instance can further define a contextObject property, to which callbacks will be bound - as
//    if those callbacks were defined in the contextObject's class.
//
//  Here's an other example showing all (??) of these together:
//
//  class MyStateMachine extends GenericStateMachine.withDefinition(
//    {
//      blocked: {
//        label: "--- pending host info ---",
//        default: true,
//        detect: "detecting",
//      },
//      detecting: {
//        onEntry() { this.installError = null },
//        needsInstall: "installing",
//        detectedLinux: "preparingAccounts",
//        failed: "failed",
//        rescan: { nextState: "detecting", reEntry: true }
//      },
//      preparingAccounts: {
//        onEntry() { this.installError = null },
//        success: "done",
//        "connectionFailed": "failed",
//      },
//      "preparingAccounts": {
//        async onEntry() {
//          if (this.configurationSatisfied()) return this.transition('startConfiguring')
//        },
//        rescan: "detecting",
//        startConfiguring: {
//          predicate() { return this.configurationSatisfied() },
//          nextState: "configuring",
//        }
//      }
//    }
//  ) { ... }
//

export class StateMachine {
    constructor({
        currentState,
        contextObject,
        contextLabel,
        logFacility,
        logProperties = {},
    }) {
        // TODO: test perf changes with these
        this.currentState = currentState;
        //  //  this._stateValues = null;
        //  they should give better optimization opportunities to V8

        this.contextObject = contextObject || this;
        this.contextLabel = contextLabel;
        this.logFacility = logFacility || "stateMachine";
        this.logProperties = logProperties;
        this.recentGeneration = 0;
    }
    mkTransition(transitionName) {
        return this.transition.bind(this, transitionName)
    }

    static withDefinition(machineDef, name, options = {}) {
        if (!name)
            throw new Error(
                `StateMachine.withDefinition(def, name): missing required 'name' of state-machine`
            );

        let defaultState = machineDef.default && "default";
        if (!defaultState)
            for (const [
                defaultStateName,
                { default: isDefault },
            ] of Object.entries(machineDef)) {
                if (isDefault) {
                    defaultState = defaultStateName;
                    break;
                }
            }
        if (!defaultState)
            throw new Error(`Each state machine requires a default state`);

        const { asyncEnhancements = false } = options;
        return class DefinedStateMachine extends StateMachine {
            //! it allows the definition to include options, which are transparently
            //  available on the resulting state-machine class as a static member
            static get options() {
                return options;
            }

            static get name() {
                return name;
            }
            get name() {
                return name;
            }

            static get defaultState() {
                return defaultState;
            }
            get defaultState() {
                return defaultState;
            }

            static get def() {
                throw new Error("where is this used?");
                return machineDef;
            }
            get def() {
                if (asyncEnhancements && this.enhanced) return this.enhanced;
                if (this._enhancing)
                    throw new Error(
                        `can't get def synchronously with a pending async enhancement`
                    );
                return machineDef;
            }
            get asyncEnhancements() {
                return asyncEnhancements;
            }

            delegateSetupTrigger(triggerFunction) {
                if (this._enhancementTrigger) {
                    debugger
                    throw new Error(`can't set a second delegateSetupTrigger`)
                }

                const enhancementTrigger = (this._enhancementTrigger = async () => {
                    const enhancements = await triggerFunction();
                    return this.enhanceWith(enhancements);
                });
                return enhancementTrigger;
            }

            async enhanceWith(enhancementPromise) {
                let enhanceDone, enhanceFailed;
                this._enhancing = new Promise((res, rej) => {
                    enhanceDone = res;
                    enhanceFailed = rej;
                });
                const enhancement = await enhancementPromise;

                const enhancing = cloneDeep(machineDef);
                for (const [stateName, enhancementStateDef] of Object.entries(
                    enhancement
                )) {
                    const origStateDef = machineDef[stateName];

                    const label = `${this.name}@${stateName}`;
                    if (!origStateDef) {
                        enhancing[stateName] = enhancementStateDef;
                        //!!! todo add logger
                        // logger.progress(
                        //     { summary: { label, stateDef } },
                        //     "enhanced with new state"
                        // );
                        continue;
                    }

                    const enhancingThisState = enhancing[stateName];

                    for (const [
                        transName,
                        enhancementTransDef,
                    ] of Object.entries(enhancementStateDef)) {
                        const origTransDef = origStateDef?.[transName];
                        if (!origTransDef) {
                            enhancingThisState[transName] = enhancementTransDef;
                            //!!! todo add logger
                            // console.warn(
                            //     { summary: { label, stateDef, transName } },
                            //     "adding transition"
                            // );

                            continue;
                        }

                        const enhancingThisTrans =
                            enhancingThisState[transName];
                        // at this point, this state existed already, and we have an enhancment to apply to it
                        // if that enhancement is an onEntry hook...

                        if (transName == "onEntry") {
                            const { onEntry: origOnEntry } = origStateDef;

                            //! it adds onEntry to an existing state not having one, if provided by the enhancement
                            if (!origOnEntry) {
                                enhancingThisState.onEntry =
                                    enhancementTransDef;
                                continue;
                            }

                            //! if the base machine has an onEntry() it chains the enhancement's onEntry() after it.
                            const enhancedOnEntry = enhancementTransDef;
                            const machine = this;
                            enhancingThisState.onEntry = async function (
                                machineArg
                            ) {
                                const { currentState: entryState } = machine;
                                try {
                                    await origOnEntry.apply(this, arguments);
                                } catch (e) {
                                    throw e;
                                }

                                //! it honors the priority of the base machine's onEntry(), if it transitions to a different state
                                //    - and doesn't call the enhancement's onEntry()
                                //    NOTE: if this is a problem, consider any pending use-cases in any proposed change.
                                const nextState = machine.currentState;
                                if (entryState == nextState) {
                                    return enhancedOnEntry.apply(
                                        this,
                                        arguments
                                    );
                                } else {
                                    // logger.progress({summary:{name: this.name, nextState}}, `baseline onEntry() asserted control over implicit transition to next state`)
                                }
                            };
                            continue;
                        }

                        // At this point, the transition name existed already, and we have an enhancement to apply to it

                        // console.warn( `merging transition '${transName}'`);

                        const origNextState = nextState(origTransDef);
                        const enhancedNextState =
                            nextState(enhancementTransDef);
                        //! doesn't allow override of the semantics of a transition by redirecting it to a different state.
                        if (origNextState && enhancedNextState) {
                            throw new Error(
                                `Enhancement can't redirect an established transition to a different state: ${label}: ${transName} -> ${origNextState}`
                            );
                        }
                        const enhancementPredicate =
                            enhancementTransDef.predicate;
                        if (enhancementPredicate) {
                            if (!origTransDef.predicate) {
                                enhancingThisTrans.predicate =
                                    enhancementPredicate;
                                continue;
                            }
                            enhancingThisTrans.predicate =
                                async function composedPredicate(machine) {
                                    try {
                                        const result =
                                            await origTransDef.predicate.call(
                                                this,
                                                machine
                                            );
                                        if (!result) return result;
                                    } catch (e) {
                                        throw e;
                                    }
                                    return enhancementPredicate.call(
                                        this,
                                        machine
                                    );
                                };
                        }

                        const enhancementEffect = enhancementTransDef.effect;
                        if (enhancementEffect) {
                            debugger;
                            if (!origTransDef.effect) {
                                enhancingThisTrans.effect = enhancementEffect;
                                continue;
                            }
                            enhancingThisTrans.effect =
                                async function composedEffects(machine) {
                                    try {
                                        await origTransDef.effect.call(
                                            this,
                                            machine
                                        );
                                        debugger;
                                    } catch (e) {
                                        //!!! todo use logger
                                        const e2 = ZonedStackTrace.fromError(e);
                                        console.warn(
                                            `in state machine ${this.name}: error  in base effect: `,
                                            e2.stack()
                                        );
                                        console.warn(
                                            `Continuing to execute stacked effect from delegate after base effect error in state machine ${this.name}`
                                        );
                                    }
                                    return enhancementEffect.call(
                                        this,
                                        machine
                                    );
                                };
                        }
                    }
                }
                let { currentState = this.defaultState } = this;

                if (!enhancement[currentState]) {
                    const fail = new ZonedStackTrace(
                        `${this.name}: state ${currentState} is invalid`
                    );
                    const failedPromise = this._enhancing;
                    this._enhancing = fail;
                    enhanceFailed(fail);
                    return failedPromise;
                }

                this._enhancing = undefined;
                this._stateValues = undefined;
                this.enhanced = enhancing;
                enhanceDone(enhancement); // delayed resolution of promise for the enhancement
                return enhancing;

                function nextState(transDef) {
                    return "string" === typeof transDef
                        ? transDef
                        : transDef.nextState;
                }
            }

            get label() {
                return `${name} @${this.currentState}`;
            }
        };
    }

    get stateValues() {
        if (this._stateValues) return this._stateValues;
        const labels = {};
        for (const [statename, { label = statename }] of Object.entries(
            this.def
        )) {
            if ("apiActions" === statename) continue;
            labels[statename] = label;
        }
        return (this._stateValues = labels);
    }
    validateState(state) {
        if (!state) return false;
        const def = this.def;
        if (def[state]) return state;
        throw new Error(`invalid state ${state}`);
    }
    get currentState() {
        throw new Error(
            `currentState getter must be implemented by your State Machine adapter`
        );
    }
    set currentState(newState) {
        throw new Error(
            `currentState setter must be implemented by your State Machine adapter`
        );
    }
    hasEffectiveTransition(transitionName) {
        return this.hasTransition(transitionName, "effective");
    }
    hasTransition(transitionName, requireEffectiveTransition) {
        let { currentState = this.defaultState } = this;
        let thisState = this.def[currentState] || this.def[this.defaultState];

        let {
            onEntry,
            default: isDefaultState,
            ...goodTransitions
        } = thisState;

        let transition = goodTransitions[transitionName];
        if (typeof transition === "string")
            transition = { nextState: transition };
        if (transition && requireEffectiveTransition) {
            if (transition.nextState == currentState && !transition.reEntry)
                return false;
        }
        return !!transition;
    }

    nextState(transitionName) {
        let { currentState = this.defaultState } = this;
        let thisState = this.def[currentState] || this.def[this.defaultState];
        let {
            onEntry,
            default: isDefaultState,
            ...goodTransitions
        } = thisState;

        if ("default" == transitionName) {
            if (isDefaultState || "default" == currentState) {
                return currentState;
            }
        }

        let transition = goodTransitions[transitionName];

        if (typeof transition === "string")
            transition = { nextState: transition };

        let nextState =
            (transition && transition.nextState) || "‹undefined transition›";

        return nextState;
    }
    contextInfo() {
        let { currentState = this.defaultState } = this;
        return `🗜️${this.contextLabel} @${currentState}`;
    }
    transitionContextInfo(transitionName) {
        return `${this.contextInfo()} transition ${transitionName}⦡ ${this.nextState(
            transitionName
        )}`;
    }

    async transition(transitionName) {
        const location = new ZonedStackTrace();
        const transitionContext = this.transitionContextInfo(transitionName);
        let label = this.label || this.constructor.name;

        if (this.asyncEnhancements) {
            if (!this.enhanced) {
                if (this._enhancing) {
                    await this._enhancing;
                } else if (this._enhancementTrigger) {
                    debugger;
                    await this._enhancementTrigger.call(this);
                }

                // this.enhanced isn't filled if there's no delegate record.
                //   if (!this.enhanced) throw new Error(`enhanced should be filled after enhancements`);
            }
        }

        const stateMachineName = `state-machine: ${label}`;

        const logProps = {
            transitionName,
            ...this.logProperties,
        };
        const logLevel = this.def.logLevel;
        if (logLevel) {
            logProps.levels = {
                [this.logFacility]: logLevel,
                _message: `state-machine: ${this.name} definition`,
            };
        }
        let transitionZone = forkZoneWithLogger(this.logFacility, logProps, {
            name: stateMachineName,
            properties: {
                location,
                addContext: transitionContext,
            },
        });
        let logger = transitionZone.get("logger");
        return transitionZone.run(
            this.transitionInZone.bind(this, transitionName)
        );
    }
    async optionalTransition(transitionName) {
        try {
            const result = await this.transition(transitionName);
            return result;
        } catch (e) {
            if (e instanceof UnmetPredicate) return false;
            if (e instanceof InvalidTransition) return false;
            console.warn(
                "optionalTransition: non-predicate error: ",
                e.stack || e
            );
            //   Zone.current.get("logger").warn({detail:{error: e.stack || e}}, "optionalTransition: non-predicate error")
            throw e;
        }
    }
    async transitionInZone(transitionName) {
        let logger = Zone.current.get("logger");

        if (this._enhancing) await this._enhancing;

        let { currentState = this.defaultState } = this;
        let machineLabel = this.label || this.constructor.name;
        let shortLabel = this.shortLabel || this.constructor.name;

        let thisState = this.def[currentState];
        if (!thisState)
            throw new Error(
                `${machineLabel}: bad current state ${currentState}`
            );
        let {
            onEntry,
            default: isDefaultState,
            label,
            ...goodTransitions
        } = thisState;
        const contextObject = this.contextObject || this;

        let transition = goodTransitions[transitionName];

        if (typeof transition === "string")
            transition = { nextState: transition };
        // const stateMachineName = `state-machine: ${machineLabel}`;

        let nextState = this.nextState(transitionName),
            isDefaultTransition;
        if ("default" == transitionName) {
            if (isDefaultState || "default" == currentState) {
                isDefaultTransition = true;
                transitionName = "default-state onEntry";
            }
        }

        if (isDefaultTransition) {
            const msg = `default transition`;
            logger.progressInfo(
                { detail: { transition: transitionName } },
                msg
            );
            this.recentGeneration++;
            if (onEntry) {
                const zone = forkZoneWithContext(
                    `🗜️${shortLabel} ↝ ${transitionName} onEntry()`
                );

                this.needsDefaultTransition = undefined;
                return zone.run(onEntry.bind(contextObject, this));
            }
            return;
        }
        if (this.needsDefaultTransition) {
            const msg =
                true === this.needsDefaultTransition
                    ? ""
                    : `(${this.needsDefaultTransition})`;

            throw new ZonedStackTrace(
                `${machineLabel}: has not run its defaultTransition yet ${msg}`
            );
        }

        if (!transition) {
            if (transitionName !== "onUpdate")
                logger.progressInfo(
                    {
                        summary: `${machineLabel}: invalid: ${transitionName}`,
                        detail: {
                            transitionName,
                            stack: new Error("called from"),
                        },
                    },
                    `throwing InvalidTransition`
                );
            //      debugger
            throw new InvalidTransition(`${machineLabel}: INVALID transition('${transitionName}') from state '${currentState}' 
  (suggested: ${
      Object.keys(goodTransitions).join(",") ||
      "‹none! this state appears to be terminal›"
  })}`);
        }
        let { predicate, effect, reEntry = false } = transition;

        if (!transition.nextState)
            throw new Error(
                `${machineLabel}: INVALID transition definition '${transitionName}' from state '${currentState}'; should be string nextState or object {predicate,nextState,effect}`
            );

        const nextStateDef = this.def[nextState];

        if (!nextStateDef) {
            const msg = `${machineLabel}: INVALID target state in ${currentState}.transitions.${transitionName} -> state '${nextState}'`;

            logger.error(
                { detail: { currentState, transitionName, nextState } },
                `invalid target state in transition definition`
            );
            const invalidTrans = new InvalidTransition(msg);
            invalidTrans.stack =
                invalidTrans.stack + "\n" + Zone.current.get("location").stack;
            throw invalidTrans;
        }
        let pName = "";
        if (predicate && "predicate" !== predicate.name) pName = predicate.name;

        logger.progressInfo(
            {
                // detail: { transitionName },
                summary: `${this.label} ⤻${transitionName} ${
                    pName && `if(${pName}())`
                } ➜ ${nextState}`,
            },
            `running transition`
        );

        if (predicate) {
            if (typeof predicate !== "function")
                throw new Error(
                    `${machineLabel}: INVALID predicate (${predicate}); function required.\n...in transition(${transitionName}) from state '${currentState}'`
                );

            const logProps = {};
            logProps.predicateName = pName || predicate.name;

            const predicateZone = forkZoneWithContext(
                `${shortLabel} @${currentState}: ⤻${transitionName}: predicate ${pName}(❓)`,
                { logProps }
            );
            const predicateLogger = predicateZone.get("logger");
            const promise = predicateZone.run(predicate.bind(contextObject));
            const predicateError = await hasError(promise);
            if (predicateError) {
                predicateLogger.error(
                    {
                        detail: {
                            error: predicateError.stack || predicateError,
                        },
                    },
                    `error thrown in transition predicate`
                );
                return promise;
            }

            const predicateResult = await promise;
            if ("undefined" === typeof predicateResult) {
                throw new Error(
                    `${machineLabel}: INVALID predicate result (${predicateResult}) true/false required.\n...in transition(${transitionName}) from state '${currentState}'`
                );
            }
            if (predicateResult === false) {
                const message = `${machineLabel}: ${currentState} ⤻${pName}${
                    pName && "(❌)"
                } in ${transitionName}↝ `;
                predicateZone
                    .get("logger")
                    .progressInfo(
                        { summary: message },
                        `predicate blocked transition`
                    );
                throw new UnmetPredicate(
                    "predicate blocked transition: " + message
                );
            }
        }

        this.recentGeneration++;
        const fromState = this.currentState.valueOf();
        this.currentState = nextState;

        if (effect) {
            const zone = forkZoneWithContext(
                `🗜️: ... ⤻${transitionName} effect() ➜ ${nextState}`
            );
            try {
                await zone.run(effect.bind(contextObject, this));
            } catch (e) {
                e.message =
                    `${machineLabel}: <-! ⤻${transitionName}: error in effect callback:\n` +
                    (e.message || e);
                zone.get("logger").warn(
                    { detail: { error: e.message || e } },
                    `error in effect callback`
                );
                throw e;
            }
        }
        if (nextStateDef.onEntry) {
            const changedState = fromState !== nextState.valueOf();

            if (changedState || reEntry) {
                const zone = forkZoneWithContext(
                    `🗜️ ${shortLabel} ➜ ${nextState} onEntry()`
                );

                await zone.runWithWarnings(
                    nextStateDef.onEntry.bind(contextObject, this)
                );
            } else {
                logger.debug(`➜ ${nextState} has no defined onEntry`);
            }
        }

        if (this.currentState != nextState) {
            logger.consoleInfo(
                {
                    summary:
                        `${machineLabel} ${pName&&"⤻"}${pName}${pName && "(✓) "} ➜ ` +
                        `${nextState}:onEntry ⟹ ➜ ${this.currentState}`,
                },
                " ✓ trampolined "
            );
            // because it already transitioned to another state,
            // we don't need to trigger the onTransition again.
            if (this.onTransition)
                logger.progressInfo(
                    {
                        summary: machineLabel,
                    },
                    "      onTransition notification already pending"
                );

            return;
        }
        //! uses a freshened machineLabel if the transition causes it to change
        //   XXX didn't work for model's state-machine : (
        //   machineLabel = this.label || this.constructor.name

        //no further transition during the onEntry
        logger.consoleInfo(
            {
                summary: `${machineLabel} ${pName}${
                    pName && "(✓) "
                } ➜ ${nextState}`,
            },
            " ✓ transitioned"
        );

        if (this.onTransition) {
            const integrationHookZone = forkZoneWithContext("onTransition");

            const { recentGeneration } = this;

            const result = await integrationHookZone.run(
                this.onTransition.bind(contextObject, {
                    transitionName,
                    currentState,
                    fromState,
                    recentGeneration,
                    logger: integrationHookZone.get("logger"),
                })
            );
            return result;
        }
    }
}
StateMachine.UnmetPredicate = UnmetPredicate;
StateMachine.InvalidTransition = InvalidTransition;
