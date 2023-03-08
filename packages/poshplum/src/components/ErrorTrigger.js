import React from "react";

import { Reactor } from "../Reactor";

export class ErrorTrigger extends React.Component {
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
        let { error } = this.props;
        if (!error)
            throw new Error(`ErrorTrigger missing required error= prop`);
        Reactor.trigger(this.node.current, "error", {
            error: error,
            single: true,
        });
    }
}
