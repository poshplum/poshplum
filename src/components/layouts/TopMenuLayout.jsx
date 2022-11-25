import React, { Component } from "react";
import { ContentPortalSlot } from "../ContentPortalSlot";
import Layout from "../layout";
import { Link } from "react-router-dom";

import { Actor, Action, autobind } from "../Reactor";
import { PortalProvider } from "../PortalProvider";

//!!! todo add Title style so that non-last-child children are display:none
export const Title = PortalProvider({
    name: "Title",
    as: "span",
    defaultClassName: "title-area",
    component: "h1",
});
export const PageTitle = PortalProvider({
    name: "PageTitle",
    as: "span",
    components: {
        default: "h2",
    },
});

export const Menu = PortalProvider({
    name: "Menu",
    as: "ul",
    defaultClassName: "nav flex-column",
    components: {
        default: MenuItem,
        MenuItem,
        SubMenu,
    },
});
export function SubMenu({}) {
    return <div>Submenu placeholder</div>;
}
export function MenuItem({
    as: As = "li",
    defaultClassName = "nav-item",
    className = "",
    Link: isLink = false,
    to: linkTo,
    children,
    ...props
}) {
    const item = isLink ? (
        <Link className={`nav-link`} aria-current="page" to={linkTo}>
            {children}
        </Link>
    ) : (
        children
    );

    return (
        <As
            className={`${defaultClassName} ${className}`}
            {...props}
            style={
                {
                    /* more custom stuff if you want */
                }
            }
        >
            {item}
        </As>
    );
}
export const Breadcrumbs = PortalProvider({
    name: "Breadcrumbs",
    as: "ol",
    defaultClassName: "breadcrumb",
    components: {
        default: Breadcrumb,
        Breadcrumb,
    },
});

export function Breadcrumb({
    as: As = "li",
    defaultClassName = "breadcrumb-item",
    className = "",
    children,
    ...props
}) {
    return (
        <As
            className={`${defaultClassName} ${className}`}
            {...props}
            style={
                {
                    /* more custom stuff if you want */
                }
            }
        >
            {children}
        </As>
    );
}
export const Body = Layout.defaultSlot("Body");
export const Logo = Layout.namedSlot("Logo");

export class TopMenuLayout extends Layout {
    static displayName = "TopMenuLayout";
    static Menu = Menu;
    static Title = Title;
    static PageTitle = PageTitle;
    static Logo = Logo;
    static Body = Body;
    static Breadcrumbs = Breadcrumbs;
    static Breadcrumb = Breadcrumb;
    static MenuItem = MenuItem;
    static slots = { Logo, Title, PageTitle, Breadcrumbs, Menu, Body };

    render() {
        let slots = this.slots;

        return (
            <div className="page">
                <header class="navbar navbar-dark sticky-top bg-dark text-light flex-md-nowrap p-0 shadow">
                    <div className="navbar-brand col-md-3 col-lg-2 me-0 px-3 fs-6 flex-md-nowrap">
                        {slots.Logo}
                        {slots.Title || "untitled site"}
                    </div>

                    <nav aria-label="breadcrumb">{slots.Breadcrumbs}</nav>
                    <div className="navbar-nav">
                        <span className="nav-item">
                            {slots.PageTitle || "untitled page"}
                        </span>
                    </div>
                    <button
                        class="navbar-toggler position-absolute d-md-none collapsed"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#sidebarMenu"
                        aria-controls="sidebarMenu"
                        aria-expanded="false"
                        aria-label="Toggle navigation"
                    >
                        <span class="navbar-toggler-icon"></span>
                    </button>

                    <div class="navbar-nav">
                        <div class="nav-item text-nowrap">
                            <a class="nav-link px-3" href="#">
                                Sign out
                            </a>
                        </div>
                    </div>
                </header>

                <div class="container-fluid">
                    <div class="row">
                        <nav
                            id="sidebarMenu"
                            className="menu-area col-md-3 col-lg-2 d-md-block bg-light sidebar collapse"
                        >
                            <div className="position-sticky pt-3 sidebar-sticky">
                                {slots.Menu}
                            </div>
                        </nav>
                        <main class="col-md-9 ms-sm-auto col-lg-10 px-md-4">
                            <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                                {slots.Body || "empty body area"}
                            </div>
                        </main>
                    </div>
                </div>
            </div>
        );
    }
}
