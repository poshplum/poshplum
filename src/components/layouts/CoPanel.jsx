import React, { Component } from "react";
import CodeExample from "src/components/CodeExample";
import { Portal } from "src/components/Portal";
import { Card } from "src/components/Cards";
import Grid from "src/components/Grid";
import { Link } from "react-router-dom";

export class CoPanel extends Component {
    render() {
        const {children} = this.props
        return (
            <div className="sidepanel-end-wrapper toggle-open">
                    <div className="sidepanel-end">

                    {children}
                    </div>
            </div>
        );
    }
}
