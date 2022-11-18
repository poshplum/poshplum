import React from "react";
import Reactor, { Actor, Action, autobind } from "./Reactor";

export const IS_PORTAL_SLOT = Symbol("isPortalSlot");

export function ContentPortalSlot({
    name,
    as: As = "div",
    contentComponent,
    defaultClassName: predefinedClassName,
    ...predefinedProps
}) {
    //! it uses any defined as= tag name as the wrapper element, but requires that it be a string / valid element name
    if ("string" !== typeof As)
        throw new Error(
            `{as} must be a string valid as an html dom element name (default is 'div')`
        );

    //! it normally uses the predefined defaultClassName but allows usages to override defaultClassName= (e.g. to empty "") or other replacement className
    //! it passes all other predefined  props through to the wrapper component

    //! it provides a clientComponent to be used by pages providing content for the portal

    const content = contentComponent;
    const clientComponent =
        // Actor(
        class portalSupplicant extends React.Component {
            static contentComponent = content;
            static displayName = `portalClientFacade‹${content.displayName}›`;

            name() {
                return `clientComponent:${name}`;
            }

            //! it discovers for itself the target dom-node where content should be added.
            //! it EXPECTS the rendered portal slot to provide a bare `portal:‹name›` action returning a proxy for portal-slot details.
            connectToPortal(domNode) {
                this.setState({ domNode });
            }
            componentDidMount() {
                const domNode = Reactor.actionResult(this, `portal:${name}`);
                debugger;
                this.setState({ domNode });
            }

            render() {
                const { raw, children } = this.props;
                const { domNode: portalTarget } = this.state;
                //! it renders by default with the contentComponent defined for the ContentPortalSlot

                //! if the raw= prop is defined (boolean), the contentComponent is bypassed and
                //    the children are rendered as-is instead.
                //! it renders as raw by default, if no contentComponent is provided.
                const Content = (!raw && contentComponent) || React.Fragment;
                debugger;
                return (
                    <div className={`portal-to-${name}`}>
                        {portalTarget &&
                            React.createPortal(
                                <Content>{children}</Content>,
                                portalTarget.current
                            )}
                    </div>
                );
            }
        };
    // );

    //! it returns a slot to be used within the layout
    const slot = class namedPortalSlot extends React.Component {
        static [IS_PORTAL_SLOT] = true;
        name() {
            return name;
        }
        _ref = React.createRef();
        @autobind
        getRef() {
            return this._ref;
        }
        render() {
            const {
                children,
                // _ref,
                defaultClassName = predefinedClassName,
                className,
                ...props
            } = this.props;
            // if (!_ref) throw new Error(`missing required _ref prop for content-portal slot`)

            //! it adds any className= prop to the defined/overridden defaultClassName
            //! it passes runtime props (e.g. from React.createElement(‹portal-slot-name›, ...props)) through to the wrapper compoennt
            const finalProps = { ...predefinedProps, ...props };
            return (
                <>
                    <Action
                        returnsResult
                        bare
                        {...{
                            [`portal:${name}`]: this.getRef,
                        }}
                    />
                    <As
                        ref={this._ref}
                        className={`${defaultClassName} ${className}`}
                        {...finalProps}
                    >
                        {children}
                    </As>
                </>
            );
        }
    };
    slot.displayName = name;
    //! it exposes the predefined contentComponent setting for generic use by content-portal supplicants
    slot.contentComponent = contentComponent;
    slot.clientComponent = clientComponent;

    return slot;
}
