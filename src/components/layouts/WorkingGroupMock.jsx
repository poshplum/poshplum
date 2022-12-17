import React, { Component } from "react";
import CodeExample from "src/components/CodeExample";
import { Portal } from "src/components/Portal";
import { Card } from "src/components/Cards";
import Grid from "src/components/Grid";
import { Link } from "react-router-dom";

export class WorkingGroupMock extends Component {
    render() {
        const {
            PageTitle,
            components: {
                Breadcrumbs: { Breadcrumb },
            },
        } = Portal;

        return (
            <div>
                <PageTitle>A Working Group</PageTitle>
                {/* <Breadcrumb>None</Breadcrumb> */}

                <h5>My Working Group</h5>

                <p>We can keep working on how a project looks</p>
            </div>
        );
    }
}
