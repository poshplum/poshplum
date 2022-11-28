import React, { Component } from "react";
import { Link } from "react-router-dom";
import { PortalProvider } from "../PortalProvider";

export const SubNav = PortalProvider({
    name: "Subnav",
    component: NavItem,
});

export function NavItem({
    as: As = "li",
    defaultClassName = "nav-item",
    className = "",
    Link: isLink = false,
    id: subnavPortalId,
    to: linkTo,
    href,
    children,
    ...props
}) {
    const item = isLink ? (
        <Link className={`nav-link`} aria-current="page" to={linkTo}>
            {children}
        </Link>
    ) : href ? (
        <a href={href}>{children}</a>
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
            {subnavPortalId && (
                <div className="nav flex-column small ms-4 mt-0">
                    <ul className="list-unstyled">
                        <SubNav id={subnavPortalId} />
                        {/* <li>thing1</li>
                        <li>thing2</li> */}
                    </ul>
                </div>
            )}
        </As>
    );
}
