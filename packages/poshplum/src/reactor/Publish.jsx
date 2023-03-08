import React from "react";
import { Reactor } from "../Reactor";

export class Publish extends React.Component {
    constructor(props) {
        super(props);
        this._pubRef = React.createRef();
    }

    render() {
        let { event: name } = this.props;
        return (
            <div
                style={{ display: "none" }}
                className={`published-event event-${name}`}
                ref={this._pubRef}
            />
        );
    }

    componentDidMount() {
        // console.log("Publish didMount");
        if (super.componentDidMount) super.componentDidMount();

        let { children, event: name, global, debug, ...handler } = this.props;

        const foundKeys = Object.keys(handler);
        if (foundKeys.length > 0) {
            throw new Error(
                "‹Publish event=\"eventName\"› events should only have the 'event' name, and optionally 'global' or 'debug')\n"
            );
        }
        Reactor.trigger(
            this._pubRef.current,
            Reactor.PublishEvent({ single: true, name, global, debug })
        );
    }
    componentWillUnmount() {
        if (super.componentWillUnmount) super.componentWillUnmount();

        let { children, event: name, global, debug, ...handler } = this.props;
        if (!this._pubRef.current) {
            console.warn(
                `‹Publish ${name}› has no _pubRef - forcibly unmounted?`
            );
            return;
        }

        Reactor.trigger(
            this._pubRef.current,
            Reactor.RemovePublishedEvent({ single: true, name, global, debug })
        );
    }
}
