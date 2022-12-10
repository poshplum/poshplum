import { GeneralAppLayout } from "./GeneralAppLayout";
import { Route } from "react-router-dom";
import React, { Component } from "react";
import Layout from "../layout";
import { Link } from "react-router-dom";
import { Portal } from "../Portal";
import { SidebarSection } from "./SidebarSection";
import { NavItem } from "./NavItem";

export class DCAppLayout extends Component {
    static slots = GeneralAppLayout.slots;
    render() {
        let { children } = this.props;
        const {
            Logo: LogoSlot,
            Title: TitleSlot,
            Sidebar,
            Breadcrumbs,
            PageTitle,
        } = GeneralAppLayout.slots;
        const { Logo, Title, Breadcrumbs: Breadcrumb } = Portal;
        return (
            <GeneralAppLayout>
                <TitleSlot />
                <Title className="d-inline-block">Done Collectively</Title>
                <LogoSlot />
                {/* TODO */}
                <Logo>
                    <Link to="/">
                        <img
                            // src={plumLogo}
                            class="plum logo"
                            alt="Done Collectively logo"
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
                    <SidebarSection id="mainMenu" title="">
                    <NavItem Link to="/myDashboard">
                            My Dashboard
                        </NavItem>
                        <NavItem Link to="/myCollaborators">
                            My People
                        </NavItem>
                    
                    </SidebarSection>

                    <SidebarSection id="myProjects" title="Projects" className="fs-6">
                        <small>
                        <NavItem Link to="/org_abc/projects/prj-123">
                            Dred - Realtime State Channel with Redis
                        </NavItem>
                        <NavItem Link to="/org_abc/projects/prj-123">
                            Done Collectively - Smart Contracts
                        </NavItem>
   
                       <small>
                         <NavItem Link to="/org_abc/projects/prj-123">
                            Littlefish - Ikigai
                        </NavItem>
                        </small>
                        </small>
                    </SidebarSection>

                    <SidebarSection id="orgs" title="My Orgs">
                        <small><small>
                    <NavItem Link to="/myDashboard">
                            Littlefish
                        </NavItem>
                        <NavItem Link to="/myDashboard">
                            Done Collectively
                        </NavItem>
                        <NavItem Link to="/myDashboard">
                            Cardano After Dark
                        </NavItem>
                        <NavItem Link to="/myDashboard">
                            Swarm
                        </NavItem>
                        <NavItem Link to="/myDashboard">
                            Cardano 4 Climate
                        </NavItem>
                        <NavItem Link to="/myDashboard">
                            todo: align to bottom
                        </NavItem>
                        </small></small>
                    </SidebarSection>

                </Sidebar>
                {children}
            </GeneralAppLayout>
        );
    }
}
