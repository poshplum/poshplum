import React, { Component } from "react";
import { ContentPortalSlot } from "../ContentPortalSlot";
import Layout from "../layout";
import { Actor, Action, autobind } from "../Reactor";

//!!! todo add Title style so that non-last-child children are display:none
export const Title = ContentPortalSlot({
    name: "Title",
    defaultClassName: "title-area",
    contentComponent: "h2",
});

export const Menu = ContentPortalSlot({
    name: "Menu",
    as: "div",
    defaultClassName: "menu-area float-left",
    contentComponent: MenuItem,
});
export function MenuItem({
    as: As = "div",
    defaultClassName = "menu-item otherCustomStuff",
    className,
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
export const Breadcrumbs = ContentPortalSlot({
    name: "Breadcrumbs",
    defaultClassName: "breadcrumb",
    contentComponent: Breadcrumb,
    as: "nav",
    "aria-label": "breadcrumbs",
});
export function Breadcrumb({
    as: As = "span",
    defaultClassName = "breadcrumb-item",
    className,
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

export class TopMenuLayoutInner extends Layout {
    static Menu = Menu;
    static Title = Title;
    static Body = Body;
    static Breadcrumbs = Breadcrumbs;
    static Breadcrumb = Breadcrumb;
    static MenuItem = MenuItem;
    static slots = { Title, Breadcrumbs, Menu, Body };

    render() {
        let slots = this.slots;
        // let { portalAction } = this.props
        return (
            <div className="page">
                {/* {portalAction} */}

                <nav
                    id="#app-header"
                    className={`px-2 panel-header navbar noPrint`}
                >
                    {slots.Breadcrumbs}
                </nav>

                {slots.Menu}

                <main>
                    {slots.Title || "untitled page"}

                    <div className="page-body">
                        {slots.Body || "empty body area"}
                    </div>
                </main>
            </div>
        );
    }
}
export const TopMenuLayout = Layout.withPortalSlots("app")(TopMenuLayoutInner);
