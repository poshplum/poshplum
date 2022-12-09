import React, { Component } from "react";
import { PortalProvider } from "../PortalProvider";
import { NavItem } from "./NavItem";

const BodyPortal = PortalProvider({
    name: "SidebarSection",
    components: {
        default: NavItem,
        NavItem,
    },
});

export class SidebarSection extends React.Component {
    render() {
        const { title, id, children } = this.props;
        return (
            <ul className="nav flex-column">
                <h6 className="px-1 mt-4 mb-1 text-muted">
                    <small className="text-uppercase text-small">{title}</small>
                </h6>
                {!id && (
                    <div className="alert alert-danger">
                        SidebarSection: missing required id= prop
                    </div>
                )}
                {id && <BodyPortal id={id}>{children}</BodyPortal>}
            </ul>
        );
    }
}
