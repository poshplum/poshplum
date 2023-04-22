import React from "react";
import { Reactor, elementInfo, logger } from "../Reactor";

export class Action extends React.Component {
    constructor(props) {
        super(props);
        this.Name = "";
        this._actionRef = React.createRef();
    }

    get delegateEl() {
        const {delegate:d} = this.props
        if (d && !d.el) {
            debugger
            throw new Error(`Action: delegate: missing expected .el`)
        }
        return d?.el || this._actionRef.current;
    }

    render() {
        const {
            children,
            id,
            name,
            at,
            returnsResult,
            isAsync,
            observer = "",
            bare,
            _info,
            capture = "",
            client,
            delegate,
            debug,
            ...handler
        } = this.props;
        const foundKeys = Object.keys(handler);
        const foundName = foundKeys[0];

        return (
            <div
                {...{ id }}
                style={{ display: "none" }}
                className={`action${observer && " observer"}${capture &&
                    " capture-event"} action-${foundName}${(returnsResult &&
                    " use-actionResult") ||
                    ""}${(delegate && " listensAtSourceDelegate") || ""}`}
                ref={this._actionRef}
            />
        );
    }

    componentDidMount() {
        let {
            children,
            id,
            name,
            at,
            returnsResult,
            isAsync,
            _info,
            observer = "",
            bare,
            capture,
            client = "‹unknown›",
            delegate,
            debug,
            ...handler
        } = this.props;
        if (super.componentDidMount) super.componentDidMount();

        const foundKeys = Object.keys(handler);
        if (foundKeys.length > 1) {
            throw new Error(
                "Actions should only have a single prop - the action name. (plus 'debug', 'id', 'delegate', 'returnsResult', 'observer', or 'bare')\n" +
                    "If your action name can't be a prop, specify it with name=, and the action function with action="
            );
        }
        const foundName = foundKeys[0];
        handler = handler[foundName];
        logger(`Action '${foundName}' created by client:`, client);
        if (debug)
            console.log(`Action '${foundName}' created by client:`, client);
        if (this.handler && this.handler !== handler[foundName]) {
            const message =
                "handler can't be changed without unmount/remount of an Action";
            console.error(message, this);
            throw new Error(message);
        }
        name = name || foundName;
        if (this._unmounting) return;
        if (debug > 1) debugger;

        let registerEvent = Reactor.RegisterAction({
            single: true,
            name,
            returnsResult,
            action: this,
            debug,
            observer,
            bare,
            at,
            capture,
            handler,
            isAsync,
        });
        this.handler = Reactor.actionResult(this.delegateEl, registerEvent);
        this.fullName = registerEvent.detail.name;
        Object.defineProperty(this, "Name", {
            value: (observer && "👁️") + (bare ? "⚡" : "🏒") + this.fullName,
        });
    }

    componentWillUnmount() {
        if (super.componentWillUnmount) super.componentWillUnmount();

        let {
            children,
            id,
            name,
            at,
            returnsResult,
            isAsync,
            _info,
            observer = "",
            bare,
            capture,
            client = "‹unknown›",
            debug,
            ...namedHandler
        } = this.props;

        const stack = new Error("Backtrace");
        const handler = this.handler;

        client = client || (handler && handler.name) || "‹no handler›";
        this._unmounting = true;
        const { delegate } = this.props;
        const el = this._actionRef.current;
        if (!el) return;

        // setTimeout(() => {
        logger(
            `${this.constructor.name}: removing action '${this.fullName}' from client: `,
            client
        );
        if (debug) {
            console.log(
                `${this.constructor.name}: removing action '${this.fullName}' from client: `,
                client
            );
            console.log(
                "...from el",
                el.outerHTML,
                "with parent",
                elementInfo(el.parentNode),
                "\n",
                el,
                ...((delegate && ["delegate => ", delegate]) || [
                    "(no delegate)",
                ])
            );
            console.log(stack);
        }

        try {
            if (debug > 1) debugger;
            Reactor.trigger(
                this.delegateEl,
                Reactor.RemoveAction({
                    single: true,
                    instance: this,
                    debug,
                    at,
                    capture,
                    observer,
                    bare,
                    name: this.fullName,
                    handler,
                }),
                removalFailure
            );
        } catch (e) {
            debugger;
            console.error(
                `${this.constructor.name}: error while removing action:`,
                e
            );
        }
        logger(`<- Removing action '${this.fullName}'`);
        if (debug) console.log(`<- Removing action '${this.fullName}'`);
        // }, 2)
        function removalFailure(event, err) {
            debugger;
        }
    }
}
Object.defineProperty(Action, "displayName", { value: "🏒Action" });
Object.defineProperty(Action, "name", { value: "Action" });
