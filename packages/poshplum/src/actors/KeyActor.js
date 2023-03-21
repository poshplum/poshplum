import React from "react";
import { Reactor } from "../Reactor";
import { Action } from "../reactor/Action";
import { Mousetrap } from "../helpers/mousetrap";
import { isInsideDOM, isOutsideDOM } from "../helpers/isOutsideDOM";
import { Actor } from "../reactor/Actor";
import { autobind } from "@poshplum/utils/browser";

const isMac = !!window.navigator.platform.match(/^Mac/);
function button(s) {
    return <span className="chip bg-gray">{s}</span>;
}

const modRegexp = /mod\+/gi;
const modString = isMac ? "⌘+" : "ctrl+";
const commandRegexp = /(.*)command\+(.*)/gi;
const commandString = isMac ? "$1⌘+$2" : "";
const shiftRegexp = /shift\+?/gi;
const shiftString = "⇧";
const ctrlRegexp = /ctrl\+?/gi;
const ctrlString = "‹ctrl›";
const altRegexp = /alt\+?/gi;
const altString = "‹alt›";

Mousetrap.stopCallback = () => {};

@Actor
export class KeyActor extends React.Component {
    static logFacility = "keyActor";

    constructor(props) {
        super(props);
        this.bindings = new Map();
        this.state = {
            gen: 0,
            helpPanel: false,
        };
    }
    name() {
        return "keys";
    }

    registerKeyHandler = Reactor.bindWithBreadcrumb(
        this.registerKeyHandler,
        this
    );
    removeKeyHandler = Reactor.bindWithBreadcrumb(this.removeKeyHandler, this);
    updateOnFocusChange = Reactor.bindWithBreadcrumb(
        this.updateOnFocusChange,
        this
    );
    findFocusedShortcuts = Reactor.bindWithBreadcrumb(
        this.findFocusedShortcuts,
        this
    );

    shortcutToString(s) {
        return JSON.stringify(s);
    }
    componentDidMount() {
        // console.warn("-> didMount")
        // console.warn("hi");
        // console.warn("hi2")
        let { target: targetNode } = this.props;
        // console.warn("hi")
        if (!targetNode) {
            if (this.props.debug) console.warn("probing for reactor node");
            let probeEvent = Reactor.ReactorProbe({
                single: true,
                // attach to the first found reactor
                onReactor(reactor) {
                    if (targetNode) {
                        throw new Error("this shouldn't happen");
                    }
                    targetNode = reactor.el;
                    return reactor;
                },
            });
            this.trigger(probeEvent);
            if (!targetNode)
                this.trigger(
                    Reactor.ErrorEvent({
                        error: "no reactor found for binding keys",
                    })
                );
        }
        // console.warn("attaching mousetrap to", targetNode.outerHTML)
        this.mousetrap = new Mousetrap(targetNode);
        // console.warn("<- didMount")

        this.registerHelpKeys();
    }
    componentWillUnmount() {
        this.mousetrap?.destroy();
    }
    updateOnFocusChange(e) {
        if (this._unmounting) return;
        if (!this._focusUpdating) {
            requestAnimationFrame(this.findFocusedShortcuts);
            this._focusUpdating = true;
        }
    }
    findFocusedShortcuts() {
        const element = document.activeElement;
        this._focusUpdating = false;
        for (const [shortcutString, binding] of this.bindings) {
            let { handlers, current, focused } = binding;
            let preferred,
                pDepth = 99999;

            for (const [handler, details] of handlers) {
                if (!details.at) continue;

                const depth = isInsideDOM(element, details.at);
                if (depth && depth < pDepth) {
                    pDepth = depth;
                    preferred = handler;
                }
            }
            if (!preferred && binding.focused) binding.focused = null;
            if (preferred) binding.focused = handlers.get(preferred);
        }
        this.bump();
    }
    registerKeyHandler({
        detail: {
            debug = this.props.debug,
            inFormFields = true,
            desc,
            hidden,
            shortcut,
            at,
            trigger,
            handler,
            on,
            preventDefault,
        },
    }) {
        if (debug) {
            const triggerDescription = `->${trigger && " triggers action"} ${
                trigger || handler.name
            }`;
            console.warn(
                `registering keyHandler(${shortcut}) ${triggerDescription} (on ${
                    on || "automatic"
                } event-type)`
            );
        }
        if (debug > 1) console.warn(this);

        const shortcutString = this.shortcutToString(shortcut);
        let thisKeyBinding = this.bindings.get(shortcutString);
        if (thisKeyBinding) {
            if (on !== thisKeyBinding.on) {
                throw new Error(
                    `event-type mismatch: ${shortcut} ${on} -> ${triggerDescription}, vs existing event on ${thisKeyBinding.on}`
                );
            }
        } else {
            const registeredHandlers = new Map();
            const priorities = new Map();
            const mousetrap = this.mousetrap;
            const outerDebug = debug;
            thisKeyBinding = {
                on,
                shortcutOrig: shortcut,
                hidden,
                handleShortcut: (event) => {
                    const debug = outerDebug ||
                        Math.max(
                            0,
                            ...[...thisKeyBinding.handlers.values()]
                                .map((x) => x.debug)
                                .filter((d) => !!d)
                        );
                    this.logger.consoleInfo(`finding handler: ${shortcut}`);
                    if (debug > 1) debugger;
                    if (!thisKeyBinding.current && !thisKeyBinding.focused)
                        return;
                    const element = event.target;
                    const selectedHandler =
                        thisKeyBinding.focused || thisKeyBinding.current;
                    if (!selectedHandler.handler) debugger;
                    if (
                        !selectedHandler.inFormFields &&
                        (element.tagName == "INPUT" ||
                            element.tagName == "SELECT" ||
                            element.tagName == "TEXTAREA" ||
                            element.isContentEditable)
                    )
                        return true;
                    if (selectedHandler) {
                        this.logger.consoleInfo(`finding handler: ${shortcut}`);
                        if (debug > 1) debugger;
                        try {
                            selectedHandler.handler(event);
                        } catch (e) {
                            const errorTarget =
                                selectedHandler.at || this._reactor.el;
                            const description =
                                selectedHandler.description ||
                                selectedHandler.handler.name;
                            this.logger.error(
                                {
                                    detail: {
                                        shortcut,
                                        description,
                                        error: e.message || e.stack || e,
                                    },
                                },
                                `Error in key handler`
                            );

                            Reactor.trigger(errorTarget, "error", {
                                single: true,
                                error:
                                    `Error in keyboard handler ${description}: ` +
                                    (e.message || e.stack || JSON.stringify(e)),
                            });
                        }
                        if (selectedHandler.preventDefault)
                            event.preventDefault();
                    } else {
                        this.logger.consoleInfo(`finding handler: ${shortcut}`);
                    }
                },
                priorities,
                current: null,
                handlers: registeredHandlers,
                remove: (handler) => {
                    const {
                        desc,
                        trigger,
                        handler: innerHandler,
                    } = (handler.boundThis && handler.boundThis.props) || {};
                    const handlerInfo = {
                        desc,
                        hidden,
                        trigger,
                        name: handler.name,
                        innerHandler: innerHandler && innerHandler.name,
                    };
                    if (!registeredHandlers.has(handler)) {
                        debugger;
                        throw new Error(
                            `Keyboard handler: remove(handler): not found ${handler.name}`
                        );
                    } else {
                        this.logger.info(
                            { detail: handlerInfo },
                            "removing keyboard shortcut handler"
                        );
                    }
                    priorities.delete(handler);
                    registeredHandlers.delete(handler);
                    if (registeredHandlers.size) {
                        // if this isn't the currently-active handler, silent removal
                        // (already done above) is OK.
                        if (thisKeyBinding.current.handler == handler) {
                            // But if it's the current handler, we should figure out
                            // the correct replacement:
                            //   * the last stacking handler
                            let lastStacking;
                            for (const [
                                handler,
                                priority,
                            ] of priorities.entries()) {
                                lastStacking = handler;
                            }
                            const nextHandler = lastStacking;
                            thisKeyBinding.current =
                                registeredHandlers.get(nextHandler);
                            this.updateOnFocusChange();
                        }
                    } else {
                        // no remaining registered handlers for this key.
                        // unbinding the key does prevent mousetrap from rebinding it later,
                        //   so we're just retaining the binding, but without keeping any current handler.
                        //   mousetrap.unbind(shortcut, on);
                        thisKeyBinding.current = null;
                    }
                },
            };
            this.bindings.set(shortcutString, thisKeyBinding);
            this.mousetrap.bind(shortcut, thisKeyBinding.handleShortcut, on);
        }
        const thisHandlerPriority = "stacking";
        const thisHandlerDetail = {
            handler,
            at,
            preventDefault,
            desc,
            hidden,
            inFormFields,
            priority: thisHandlerPriority,
        };
        thisKeyBinding.priorities.set(handler, thisHandlerPriority);
        thisKeyBinding.handlers.set(handler, thisHandlerDetail);

        const { handler: currentHandler } = thisKeyBinding.current || {};

        thisKeyBinding.current = thisHandlerDetail;
        this.updateOnFocusChange();
    }
    bump() {
        this.bumping =
            this.bumping ||
            setTimeout(
                () =>
                    this.setState(({ gen }) => {
                        this.logger.progress("bumping keyboard help content");
                        this.bumping = null;
                        return { gen: 1 + gen };
                    }),
                120
            );
    }
    removeKeyHandler({ detail: { shortcut, handler, on } }) {
        this.logger.progress("remove key handler", { shortcut, handler });
        let thisKeyBinding = this.bindings.get(this.shortcutToString(shortcut));
        thisKeyBinding.remove.call(this, handler);
    }

    helpPanel = React.createRef();
    helpHeader = React.createRef();
    render() {
        const { helpPanel, onRight, showHidden } = this.state;

        let itemCount = 0;
        const rendered = (
            <div ref={this.helpPanel}>
                <span className="visually-hidden" aria-live="assertive">
                    Keyboard Help: press Control+slash
                </span>
                <Action
                    bare
                    at={document}
                    capture
                    focus={this.updateOnFocusChange}
                />
                <Action
                    bare
                    at={document}
                    capture
                    blur={this.updateOnFocusChange}
                />

                <Action
                    debug={0}
                    keyboardShortcutHandler={this.registerKeyHandler}
                />
                <Action
                    debug={0}
                    removeShortcutHandler={this.removeKeyHandler}
                />
                <div
                    className={`bg-dark text-light ${
                        helpPanel ? `` : `hidden`
                    }`}
                    style={{
                        position: "fixed",
                        bottom: "0vh",
                        borderRadius: "4px",
                        opacity: "80%",
                        zIndex: 42,
                        padding: "0.5em",
                        ...(onRight ? { right: 0 } : {}),
                    }}
                    role="complementary"
                >
                    <h3
                        className="bb-dashed"
                        ref={this.helpHeader}
                        tabIndex="0"
                        aria-live="assertive"
                        aria-atomic="true"
                    >
                        Keyboard and Controls Help
                        <span className="visually-hidden">
                            Overlay Panel: Control+slash to close
                        </span>
                    </h3>
                    <table>
                        {[...this.bindings.entries()].map(
                            ([shortcutString, binding]) => {
                                const {
                                    current,
                                    focused,
                                    at,
                                    hidden,
                                    shortcutOrig: shortcut,
                                } = binding;
                                if (!current) return null;
                                const shortcuts = (
                                    Array.isArray(shortcut)
                                        ? shortcut.map(
                                              (s) =>
                                                  s &&
                                                  this.mungeKeyboardShortcut(s)
                                          )
                                        : [this.mungeKeyboardShortcut(shortcut)]
                                ).filter((x) => !!x);

                                const lastShortcut = shortcuts.length - 1;
                                const shortcutsJoined = shortcuts.flatMap(
                                    (x, i) =>
                                        i == lastShortcut ? (
                                            <code>{x}</code>
                                        ) : (
                                            [<code>{x}</code>, " or "]
                                        )
                                );

                                const { handler, desc = handler.name } =
                                    focused || current;
                                if (hidden && !showHidden) return null;
                                const hiddenProps = hidden
                                    ? { className: "text-gray" }
                                    : {};
                                itemCount++;
                                return (
                                    <tr>
                                        <th>{shortcutsJoined}</th>
                                        <td {...hiddenProps}>{desc}</td>
                                    </tr>
                                );
                            }
                        )}
                    </table>
                </div>
            </div>
        );
        this.logger.progress(
            `rendering keyboard help content with ${itemCount} entries`
        );

        return rendered;
    }
    mungeKeyboardShortcut(s) {
        return s
            .replace(modRegexp, modString)
            .replace(commandRegexp, commandString)
            .replace(ctrlRegexp, ctrlString)
            .replace(altRegexp, altString)
            .replace(shiftRegexp, shiftString);
    }
    componentDidUpdate(pProps, pState) {
        if (this.state.helpPanel && !pState.helpPanel)
            this.helpHeader.current.focus();
    }
    registerHelpKeys() {
        this.registerKeyHandler({
            detail: {
                shortcut: "ctrl+/",
                handler: this.toggleHelpPanel,
                desc: "Toggle help panel",
            },
        });
        this.registerKeyHandler({
            detail: {
                shortcut: "ctrl+alt+shift+/",
                hidden: true,
                handler: this.toggleHelpHidden,
                desc: "toggle hidden keyboard shortcuts",
            },
        });
        this.registerKeyHandler({
            detail: {
                shortcut: "?",
                inFormFields: false,
                handler: this.showHelpPosition,
                desc: "Toggle help panel / position",
            },
        });
    }

    @autobind
    toggleHelpPanel(x) {
        x.preventDefault();
        const showHiddenDefault = "development" === process.env.NODE_ENV;
        this.setState(({ helpPanel, showHidden = showHiddenDefault }) => ({
            helpPanel: !helpPanel,
            showHidden,
        }));
    }

    @autobind
    toggleHelpHidden(x) {
        x.preventDefault();
        this.setState(({ showHidden }) => ({ showHidden: !showHidden }));
    }

    @autobind
    showHelpPosition(x) {
        x.preventDefault();
        if (this.state.helpPanel) {
            if (!this.state.onRight) return this.setState({ onRight: true });
        }
        this.setState(({ helpPanel }) => ({
            helpPanel: !helpPanel,
            onRight: false,
        }));
    }
}
