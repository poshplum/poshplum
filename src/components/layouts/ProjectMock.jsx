import React, { Component } from "react";
import CodeExample from "src/components/CodeExample";
import { Portal } from "src/components/Portal";
import { Card } from "src/components/Cards";
import Grid from "src/components/Grid";
import { Link } from "react-router-dom";
import {autobind} from "src/components/Reactor"

export class ProjectMock extends Component {
    @autobind
    addPanel() {
        this.setState({panel:true});
    }
    render() {
        const {
            PageTitle,
            Panel: PanelPortal,
            components: {
                Breadcrumbs: { Breadcrumb },
            },
        } = Portal;

        const {panel} = this.state || {}

        return (
            <div>
                <PageTitle>Some Project Page</PageTitle>
                <Breadcrumb>Working Group Name</Breadcrumb>

                <h5>My Great Project</h5>
                <p>We can keep working on how a project looks</p>
    
                <button className="btn btn-dark" onClick={this.addPanel}>Open Panel</button>

                <PanelPortal>
                    Here's something in the Panel.
                </PanelPortal>
            </div>
        );
    }
}
