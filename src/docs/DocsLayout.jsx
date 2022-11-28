import { TopMenuLayout } from "../components/layouts/TopMenuLayout";
import AboutLayouts from "./AboutLayouts";
import { Route } from "react-router-dom";
import React, { Component } from "react";
import plumLogo from "../aPoshPlum.svg";
import Layout from "../components/layout";
import { Link } from "react-router-dom";
import { Portal } from "../components/Portal";
import { SidebarSection } from "../components/layouts/SidebarSection";
import { NavItem } from "../components/layouts/NavItem";

export class DocsLayout extends Component {
    static slots = TopMenuLayout.slots;
    render() {
        let { children } = this.props;
        const {
            Logo,
            Title: TitleSlot,
            Sidebar,
            Breadcrumbs,
            PageTitle,
        } = TopMenuLayout.slots;
        const { Title, Breadcrumbs: Breadcrumb } = Portal;
        return (
            <TopMenuLayout>
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
                    <SidebarSection title="About">
                        <NavItem Link to="/about">
                            Posh Plum
                        </NavItem>

                        <NavItem Link to="/layouts">
                            Layouts
                        </NavItem>
                    </SidebarSection>

                    <SidebarSection title="Examples">
                        <NavItem Link to="/examples/layouts">
                            Layouts
                        </NavItem>
                        <NavItem id="ex-reactor" Link to="/examples/reactor">
                            Reactor
                        </NavItem>
                    </SidebarSection>
                </Sidebar>
                {children}
            </TopMenuLayout>
        );
    }
}
