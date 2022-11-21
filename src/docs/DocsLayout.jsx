import { TopMenuLayout, MenuItem } from "../components/layouts/TopMenuLayout";
import AboutLayouts from "./AboutLayouts";
import { Route } from "react-router-dom";
import React, { Component } from "react";
import plumLogo from "../aPoshPlum.svg";
import Layout from "../components/layout";
import { Link } from "react-router-dom";
import { Portal } from "../components/Portal";

export class DocsLayout extends Component {
    static slots = TopMenuLayout.slots;
    render() {
        let { children } = this.props;
        const { Logo, Title, Menu, Breadcrumbs, PageTitle } =
            TopMenuLayout.slots;

        const { Breadcrumbs: Breadcrumb } = Portal;

        return (
            <TopMenuLayout>
                <Title initialize className="d-inline-block">
                    Posh Plum: docs
                </Title>
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

                <Menu>
                    <MenuItem as="h6" className="mb-0">
                        About
                    </MenuItem>
                    <MenuItem Link to="/about" className="ml-4">
                        Posh Plum
                    </MenuItem>
                    <MenuItem Link to="/layouts">
                        Layouts
                    </MenuItem>

                    <MenuItem as="h6" className="mb-0">
                        Examples
                    </MenuItem>

                    <MenuItem Link to="/examples/layouts">
                        Layouts
                    </MenuItem>
                    <MenuItem Link to="/examples/reactor">
                        Reactor
                    </MenuItem>
                </Menu>
                {children}
            </TopMenuLayout>
        );
    }
}
