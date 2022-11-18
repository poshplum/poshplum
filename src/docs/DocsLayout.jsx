import { TopMenuLayout, MenuItem } from "../components/layouts/TopMenuLayout";
import AboutLayouts from "./AboutLayouts";
import React, { Component } from "react";
import plumLogo from "../aPoshPlum.svg";
import Layout from "../components/layout";
import { Link } from "react-router-dom";
export class DocsLayout extends Component {
    render() {
        let { children } = this.props;
        const { Menu, Title, Breadcrumbs } = TopMenuLayout.slots;

        return (
            <TopMenuLayout>
                <Menu>
                    <MenuItem>
                        <Link to="/">
                            <img
                                src={plumLogo}
                                class="plum logo"
                                alt="Posh Plum logo"
                                width="40"
                                height="40"
                            />
                        </Link>
                    </MenuItem>
                    <MenuItem>
                        <Link to="/layouts">Layouts</Link>
                    </MenuItem>
                    <MenuItem>
                        <Link to="/reactor">Reactor</Link>
                    </MenuItem>
                    <MenuItem>
                        <Link to="/about" className="ml-4">
                            About Posh Plum
                        </Link>
                    </MenuItem>
                </Menu>
                <Breadcrumbs />
                <Title />

                {children}
            </TopMenuLayout>
        );
    }
}
