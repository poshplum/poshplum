import React from 'react';

import {Link} from 'react-router-dom';
import { Layout } from '../Layout';

let Title = Layout.defaultSlot("Title").withMarkup(({className="", children, ...props}) => {
    return <span key="title" className={`${className}`} {...props}>
        <h6>
            {children}
        </h6>
    </span>
});
// console.log("Title is ", Title, Title.displayName);

let Icon = Layout.namedSlot("Icon").withMarkup(({className="", icon, children, ...props}) => {
    return <div key="icon" className={`avatar avatar-sm ${className}`} {...props}>
        {icon || children}
    </div>
});

let Label = Layout.namedSlot("Label").withMarkup(({as:As="div", className="", icon, children, ...props}) => {
    return <As key="label" className={`float-right ${className}`} {...props}>
        {icon || children}
    </As>
});

let Body = Layout.namedSlot("Body").withMarkup(({as:As="div", className="", children, ...props}) => {
    return <As className={`footnote ml-2 ${className}`} {...props}>
        {children}
    </As>
});

export class Chip extends Layout {
    static as="span"
    static Title = Title;
    static Icon = Icon;
    static Body = Body;
    static Label = Label;
    static slots = {Title, Icon, Body, Label};

    constructor() {
        super()
        this._link = React.createRef()
    }
    render() {
        let {active, as: As="span", halfWidth, fullWidth, compact, multiLine, tabIndex="0", onClick, item, debug, match, children, wrapperProps, wrapperClassName="", className="", link, render, ...otherProps} = this.props;
        let {Title, Icon, HeaderRight, Body, Footer, Label} = this.slots;

        let multiLineClass=""; if (multiLine) multiLineClass='multiLine'
        if (compact) className += " compact";
        if (link && !onClick) {
            onClick = () => {
                this._link.current && this._link.current.context.router.history.push(link)
            } };

        // let clickFn = (e) => { if (cardItemClicked) cardItemClicked(item) };
        const showScreaderLink = link && <Link to={link} ref={this._link} className="visually-hidden">{Title || "expand"}</Link>;

        const widthClass=fullWidth ? "full-width" : halfWidth ? "half-width" : "";
        if (debug) debugger;
        let chip = <As {...wrapperProps} onClick={onClick} className={`chip-wrapper d-inline-block ${widthClass} ${wrapperClassName} ${active ? "active" : ""}`}>
            {Icon}
            <As {...otherProps} tabIndex={tabIndex} className={`chip ${multiLineClass} ${className} ${active ? "active" : ""}`}>
                {Label}
                {Title}
                {link && Title && showScreaderLink}

                {multiLine && Body && <div className="flex-break-line"></div>}
                {Body}

                {link && !Title && showScreaderLink}
            </As>
        </As >;

        return chip;
    }
};

