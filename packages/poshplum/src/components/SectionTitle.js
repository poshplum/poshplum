import React from "react";
import { Layout } from "../Layout";

const Heading = Layout.defaultSlot("Heading");

const Icon = Layout.namedSlot("Icon").withMarkup(
    ({
        children,
        style: extraStyle = {},
        onlyStyle,
        className: extraClass = "",
        onlyClassName = "d-inline-block",
        ...otherProps
    }) => {
        const style = {
            ...(onlyStyle || { marginTop: "-1em", marginBottom: "-1em" }),
            ...extraStyle,
        };
        const className = `${onlyClassName} ${extraClass}`;
        return (
            <>
                &nbsp;
                <div {...{ className, style }}>{children}</div>
            </>
        );
    }
);

const HeaderRight = Layout.namedSlot("HeaderRight").withMarkup(
    ({ children, as: As = "span", className, ...otherProps }) => {
        return <As {...{ className, ...otherProps }}>{children}</As>;
    }
);

const SubHeading = Layout.namedSlot("SubHeading").withMarkup(
    ({ children, ...otherProps }) => {
        return (
            <div
                className="z--1 ml-4 footnote focusReveal"
                {...otherProps}
            >
                {children}
            </div>
        );
    }
);
const After = Layout.namedSlot("After");

export class SectionTitle extends Layout {
    static Heading = Heading;
    static Icon = Icon;
    static HeaderRight = HeaderRight;
    static SubHeading = SubHeading;
    static After = After;
    static slots = { Heading, Icon, HeaderRight, SubHeading, After };
    render() {
        const { Heading, Icon, HeaderRight, SubHeading, After } = this.slots;
        //! it uses h4 by default, overridden with as="h2" or other tag name / component
        //! it uses .mr-2.mt-3 by default, overridden with onlyClassName=
        //! it supports additional className= if specified
        //! it
        const {
            as: As = "h4",
            className: extraClass = "",
            onlyClassName = "mr-2 mt-3",
        } = this.props;

        const className = `${onlyClassName} ${extraClass}`;
        if (this.props.debug) debugger;
        return (
            <>
                <div className="focusContainer">
                    {(Heading || Icon || HeaderRight) && (
                        <As {...{ className }} tabIndex="0" role="heading">
                            {Heading}
                            {Icon}
                            {HeaderRight}
                        </As>
                    )}
                    {SubHeading}
                </div>
                {After}
            </>
        );
    }
}
