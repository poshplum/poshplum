import React, { Component } from "react";

import { Link } from "react-router-dom";

// import {Route, withRouter, Link} from 'react-router-dom';
import PropTypes from "prop-types";
import { Layout } from "../Layout";

let Title = Layout.namedSlot("Title").withMarkup(
    ({ className = "", children, ...props }) => {
        return (
            <div key="title" className={`card-title ${className}`} {...props}>
                <h6>{children}</h6>
            </div>
        );
    }
);
// console.log("Title is ", Title, Title.displayName);

let Icon = Layout.namedSlot("Icon").withMarkup(
    ({ className = "", icon, children, ...props }) => {
        return (
            <div
                key="icon"
                className={`chip icon pop-left zero-height ${className}`}
                {...props}
            >
                {icon || children}
            </div>
        );
    }
);

const HeaderRight = Layout.namedSlot("HeaderRight").withMarkup(
    ({ style = {}, className = "", children, ...moreProps }) => {
        return (
            <div className={`header-right ${className} ms-auto`} {...moreProps}>
                {children}
            </div>
        );
    }
);

let Body = Layout.defaultSlot("Body").withMarkup(
    ({ className = "", children, ...props }) => {
        // console.log("body children:", children)
        return (
            <div className={`card-body ${className}`} {...props}>
                {children}
            </div>
        );
    }
);

let Footer = Layout.namedSlot("Footer").withMarkup(
    ({
        overrideClassName = "card-footer footnote",
        className = "",
        ...props
    }) => {
        return (
            <div className={`${overrideClassName} ${className}`} {...props}>
                {props.children}
            </div>
        );
    }
);

let Label = Layout.namedSlot("Label").withMarkup(
    ({ className = "chip pop-right", as: As = "div", style, children }) => {
        return (
            <As className={`card-label ${className}`} {...{ style }}>
                {children}
            </As>
        );
    }
);

// Cards.Route = ({className="",children}) => <div className={`chip pop-right ${className}`}>{children}</div>;
// Cards.Route.displayName="Cards.Route";

export class Card extends Layout {
    static Title = Title;
    static Icon = Icon;
    static HeaderRight = HeaderRight;
    static Body = Body;
    static Footer = Footer;
    static Label = Label;
    static slots = { Title, Icon, HeaderRight, Body, Footer, Label };

    constructor() {
        super();
        this._link = React.createRef();
    }
    render() {
        let {
            active,
            compact,
            tabIndex = "0",
            onClick,
            item,
            debug,
            match,
            children,
            className = "",
            link,
            render,
            ...otherProps
        } = this.props;
        if (render) {
            if (!item) {
                throw new Error(
                    "Card requires an 'item' prop when using the 'render' prop."
                );
            }
            children = render(item);
        }
        if (debug) debugger;
        let { Title, Icon, HeaderRight, Body, Footer, Label } = this.slots;

        if (compact) className += " compact";
        if (link && !onClick) {
            onClick = () => {
                this._link.current &&
                    this._link.current.context.router.history.push(link);
            };
        }

        // let clickFn = (e) => { if (cardItemClicked) cardItemClicked(item) };
        const showScreaderLink = link && (
            <Link
                to={link}
                ref={this._link}
                className="visually-hidden-focusable"
            >
                {Title || "open card"}
            </Link>
        );
        let rightArea =
            HeaderRight || Label ? (
                <div className="zero-height ms-auto">
                    {Label}
                    {HeaderRight}
                </div>
            ) : null;
        let card = (
            <div
                {...otherProps}
                tabIndex={tabIndex}
                onClick={onClick}
                className={`card card-main ${className} ${
                    active ? "active" : ""
                }`}
            >
                {((Icon || Title || Label || HeaderRight) && (
                    <div key="header" className="card-header">
                        {Icon}
                        {Title}
                        {rightArea}
                        {link && Title && showScreaderLink}
                    </div>
                )) ||
                    null}
                {Body}
                {link && !Title && showScreaderLink}
                {Footer}
            </div>
        );

        return card;
    }
}

Card.Empty = function ({ children, className = "", ...props }) {
    return (
        <div className={`${className} 空空兄珍`} {...props}>
            {children}
        </div>
    );
};
Card.Empty.displayName = "Cards.Empty";
