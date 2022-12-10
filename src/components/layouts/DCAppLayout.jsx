import { GeneralAppLayout } from "../components/layouts/GeneralAppLayout";
import AboutLayouts from "./AboutLayouts";
import { Route } from "react-router-dom";
import React, { Component } from "react";
import plumLogo from "../aPoshPlum.svg";
import Layout from "../components/layout";
import { Link } from "react-router-dom";
import { Portal } from "../components/Portal";
import { SidebarSection } from "../components/layouts/SidebarSection";
import { NavItem } from "../components/layouts/NavItem";

export class DCAppLayout extends Component {
    static slots = GeneralAppLayout.slots;
    render() {
        let { children } = this.props;
        const {
            Logo,
            Title: TitleSlot,
            Sidebar,
            Breadcrumbs,
            PageTitle,
        } = GeneralAppLayout.slots;
        const { Title, Breadcrumbs: Breadcrumb } = Portal;
        return (
            <GeneralAppLayout>
                <TitleSlot />
                <Title className="d-inline-block">Posh Plum: docs</Title>
                <Logo>
                    {" "}
                    <Link to="/">
                        <img
                            src={plumLogo}
                            class="plum logo"
                            alt="Posh Plum logo"
                            width="40"
                            height="40"
                        />
                    </Link>
                </Logo>

                <Breadcrumbs />
                <PageTitle />

                <Route path="/examples">
                    <Breadcrumb>Examples</Breadcrumb>
                </Route>

                <Sidebar>
                    <SidebarSection id="about" title="About">
                        <NavItem Link to="/about">
                            Posh Plum
                        </NavItem>

                        <NavItem Link to="/layouts">
                            Layouts
                        </NavItem>
                    </SidebarSection>

                    <SidebarSection id="examples" title="Examples">
                        <NavItem Link to="/examples/layouts">
                            Layouts
                        </NavItem>
                        <NavItem id="ex-reactor" Link to="/examples/reactor">
                            Reactor
                        </NavItem>
                    </SidebarSection>
                </Sidebar>
                {children}
            </GeneralAppLayout>
        );
    }
}
