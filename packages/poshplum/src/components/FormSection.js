import React from "react";
import PropTypes from "prop-types";

export class FormSection extends React.Component {
    static propTypes = {
        label: PropTypes.string,
        style: PropTypes.object,
        className: PropTypes.string,
        children: PropTypes.any,
    };
    render() {
        const { label, style = {}, className = "", children } = this.props;
        return (
            <>
                <h5
                    className={`text-gray mt-2 mb-0 z-10 p-relative`}
                    style={{
                        width: "fit-content",
                        padding: "0 0.5em",
                        marginLeft: "0.5em",
                    }}
                >
                    {label || "‹missing label= prop›"}
                </h5>
                <div
                    className={`${className} border-dotted z-9 p-2`}
                    {...{ style }}
                >
                    {children}
                </div>
            </>
        );
    }
}
