import React from "react";
import { Reactor } from "../Reactor";

export class Notification extends React.Component {
    render() {
        const { children, className } = this.props;
        this.node = this.node || React.createRef();
        if (!children || (Array.isArray(children) && !children.length)) {
            return <span className={className} ref={this.node} />;
        }

        return (
            <div className={className} ref={this.node}>
                {children}
            </div>
        );
    }
    componentDidMount() {
        let { success, warning, error } = this.props;
        const severity =
            (success && "success") ||
            (warning && "warning") ||
            (error && "error");
        const message = this.props[severity];
        if (!message)
            throw new Error(
                `Notification missing message in one of {success=, warning=, error=} props`
            );
        Reactor.trigger(this.node.current, severity, {
            [severity]: message,
            single: true,
        });
    }
}
