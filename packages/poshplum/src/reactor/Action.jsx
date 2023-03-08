import React from "react";
import { logger, Reactor, elementInfo } from "../Reactor";

export class Action extends React.Component {
    constructor(props) {
        super(props);
        this.Name = "";
        this._actionRef = React.createRef();
    }

    render() {
        let {
            children,
            id,
            name,
            at,
            returnsResult,
            isAsync,
            observer = "",
            bare,
            capture = "",
            client,
            debug,
            ...handler
        } = this.props;
        const foundKeys = Object.keys(handler);
        const foundName = foundKeys[0];

        return (
            <div
                {...{ id }}
                style={{ display: "none" }}
                className={`action${observer && " observer"}${
                    capture && " capture-event"
                } action-${foundName}${
                    (returnsResult && " use-actionResult") || ""
                }`}
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
            observer = "",
            bare,
            capture,
            client = "‹unknown›",
            debug,
            ...handler
        } = this.props;
        if (super.componentDidMount) super.componentDidMount();

        const foundKeys = Object.keys(handler);
        if (foundKeys.length > 1) {
            throw new Error(
                "Actions should only have a single prop - the action name. (plus 'debug', 'id', 'returnsResult', 'observer', or 'bare')\n" +
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

        let registerEvent = Reactor.RegisterAction({
            single: true,
            name,
            returnsResult,
            action: this,
            observer,
            bare,
            at,
            capture,
            handler,
            isAsync,
            debug,
        });
        this.handler = Reactor.actionResult(
            this._actionRef.current,
            registerEvent
        );
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
        const el = this._actionRef.current;
        if (!el) return;

        logger(
            `${this.constructor.name}: scheduling action removal: '${this.fullName}'`
        );
        if (debug)
            console.log(
                `${this.constructor.name}: scheduling action removal: '${this.fullName}'`
            );
        // setTimeout(() => {
        logger(
            `${this.constructor.name}: removing action '${this.fullName}' from client: `,
            client
        );
        if (debug)
            console.log(
                `${this.constructor.name}: removing action '${this.fullName}' from client: `,
                client
            );
        logger(
            "...from el",
            el.outerHTML,
            "with parent",
            elementInfo(el.parentNode)
        );
        if (debug)
            console.log(
                "...from el",
                el.outerHTML,
                "with parent",
                elementInfo(el.parentNode)
            );
        if (debug > 1) console.log(stack);

        try {
            Reactor.trigger(
                el,
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
