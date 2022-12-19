import React, { Component } from "react";
import CodeExample from "src/components/CodeExample";
import { Portal } from "src/components/Portal";
import { Card } from "src/components/Cards";
import Grid from "src/components/Grid";
import { Link } from "react-router-dom";
import {autobind} from "src/components/Reactor"
import Collapse  from "react-bootstrap/Collapse";

export class ProjectMock extends Component {
    @autobind
    togglePanel() {
        this.setState(
            ({panel=false}) => { return {panel:!panel} }
        );
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
            <div class="d-flex overflow-hidden w-100">
                <div class="overflow-hidden flex-grow-1">
                    <PageTitle>Some Project Page</PageTitle>
                    <Breadcrumb>Working Group Name</Breadcrumb>

                    <h5>My Great Project</h5>
                    <p>We can keep working on how a project looks</p>
                    <p>
                        Lorem ipsum dolor sit amet consectetur adipisicing elit.
                        Possimus sequi libero nam, neque quos ad earum minima

                        dolore esse omnis quia. Explicabo placeat culpa
                        voluptatem doloremque illum atque nam excepturi.
                    </p>

                    <button className="btn btn-dark" onClick={this.togglePanel} 
                        aria-controls="coPanel"
                        aria-expanded={panel}>
                        Toggle Panel
                    </button>
                </div>
                <Collapse dimension="width" in={panel} appear>
                        <div id="coPanel">
                        Anim pariatur cliche reprehenderit, enim eiusmod high life accusamus
                        terry richardson ad squid. Nihil anim keffiyeh helvetica, craft beer
                        labore wes anderson cred nesciunt sapiente ea proident.
                        </div>
                 </Collapse>
                 <PanelPortal>Panel content
          
                 </PanelPortal>
            </div>
        );
    }
}
