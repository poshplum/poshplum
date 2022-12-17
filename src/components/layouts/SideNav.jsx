import React, { Component } from "react";
import { PortalProvider } from "../PortalProvider";
import { NavItem } from "./NavItem";
import { SidebarSection } from "./SidebarSection";

export const SidebarPortal = PortalProvider({
    name: "SideNav",
    as: "ul",
    defaultClassName: "nav flex-column",
    components: {
        default: NavItem,
        NavItem,
        SidebarSection,
    },
});

export class SideNav extends React.Component {
    render() {
        const { children } = this.props;
        return (
            <nav
                id="sidebarMenu"
                className="menu-area col-md-3 col-lg-2 d-md-block bg-light sidebar collapse"
            >
                <div className="position-sticky pt-3 sidebar-sticky">
                    {children}
                    <SidebarPortal />
                </div>
            </nav>
        );
    }
}
