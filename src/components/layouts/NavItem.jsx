import React, { Component } from "react";
import { Link } from "react-router-dom";

export function NavItem({
    as: As = "li",
    defaultClassName = "nav-item",
    className = "",
    Link: isLink = false,
    id: subnavPortalId,
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
            {subnavPortalId && (
                <div className="nav flex-column small ms-4 mt-0">
                    <ul className="list-unstyled">
                        <li>thing1</li>
                        <li>thing2</li>
                    </ul>
                </div>
            )}
        </As>
    );
}
