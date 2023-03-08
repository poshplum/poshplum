import React from "react";
import * as ReactDOM from "react-dom";

import { Reactor } from "../Reactor";
import { ErrorTrigger } from "./ErrorTrigger";
import { autobind } from "@poshplum/utils/browser";

// declares keyboard shortcuts, assuming there is a registered KeyActor
// props: {shortcut, handler, desc, on}.  These correspond to Moustrap options.
export class Keyboard extends React.Component {
    // static propTypes = {
    //   shortcut, optional, desc, handler, at, trigger, preventDefault, on, debug=0 } = this.props;
    //
    // }
    // node?: Element | Text | null;
    unmounting = false;
    added = false;

    componentDidMount() {
        this.node = ReactDOM.findDOMNode(this);
        let {
            shortcut,
            optional,
            desc,
            hidden,
            handler: hProp,
            at,
            trigger,
            on,
            inFormFields,
            preventDefault,
            debug = 0,
        } = this.props; //!!! todo add propTypes

        const handler = hProp || this.triggerAction;

        // console.log({debug})
        setTimeout(() => {
            if (this.unmounting) return;
            if (!at) {
                const reactor = Reactor.actionResult(
                    this.node,
                    "reactorProbe",
                    { single: true },
                    () => {
                        /*ignored*/
                    }
                );
                if (reactor) at = reactor._listenerRef.current;
            }
            Reactor.trigger(this.node, "keys:keyboardShortcutHandler", {
                debug,
                single: true,
                optional,
                hidden,
                at,
                shortcut,
                desc,
                handler,
                on,
                inFormFields,
                preventDefault,
            });
            this.added = true;
        }, 100);
    }

    @autobind
    triggerAction(e) {
        // (e : Event) {
        //@ts-expect-error
        const { trigger, single = true } = this.props;
        Reactor.trigger(this.node, trigger, { single });
    }
    componentWillUnmount() {
        const {
            //@ts-expect-error  - fixme
            shortcut,
            //@ts-expect-error  - fixme
            handler: hProp,
            //@ts-expect-error  - fixme
            trigger,
            //@ts-expect-error  - fixme
            desc,
            //@ts-expect-error  - fixme
            on,
            //@ts-expect-error  - fixme
            debug,
        } = this.props;
        const handler = hProp || this.triggerAction;

        this.unmounting = true;
        if (!this.added) return;
        Reactor.trigger(
            this.node,
            "keys:removeShortcutHandler",
            { debug, single: true, shortcut, handler, on, desc },
            (err) => {
                // err
                // when the KeyActor is unmounted before the Keyboard action,
                // the listener is gone (and things are already cleaned up).
                // no need to get the "unhandled event" warning normally issued in that case.
                // any disfunction in setup will reveal itself on the keyboardShortcutHandler anyway.
            }
        );
        if (debug)
            console.log(
                `removed Keyboard shortcut ${shortcut} -> ${handler.name}`
            );
    }
    render() {
        //@ts-expect-error  - fixme
        const { shortcut, handler, trigger, on } = this.props;
        if (!(shortcut && (handler || trigger))) {
            return (
                <ErrorTrigger error="<Keyboard /> requires (shortcut=, handler=) or (shortcut=, trigger=) props" />
            );
        }
        if (handler && trigger) {
            return (
                <ErrorTrigger error="<Keyboard /> shortcut= and trigger= props can't be used together" />
            );
        }
        const name =
            (trigger && `trigger-${trigger}`) || handler.name || "handler";
        return (
            <div
                className="keyHandler"
                key={`keyHandler-${shortcut}-${on}-${name}`}
            ></div>
        );
    }
}
