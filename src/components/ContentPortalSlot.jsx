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
    //! it uses any defined as= tag name or component as the wrapper element
    //! it EXPECTS the as= element to include any provided children= prop.

    //! it normally uses the predefined defaultClassName but allows usages to override defaultClassName= (e.g. to empty "") or other replacement className
    //! it passes all other predefined  props through to the wrapper component

    //! it provides a clientComponent to be used by pages providing content for the portal

    const content = contentComponent;
    const contentName = content.slotName || content.displayName || content.name;
    const clientComponent =
        // Actor(
        class portalSupplicant extends React.Component {
            static contentComponent = content;
            static displayName = `portalClientFacade‹${contentName}›`;

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
                this.setState({ domNode });
            }

            render() {
                const { raw, children, ...props } = this.props;
                const { domNode: portalTarget } = this.state;
                //! it renders by default with the contentComponent defined for the ContentPortalSlot

                //! if the raw= prop is defined (boolean), the contentComponent is bypassed and
                //    the children are rendered as-is instead.
                //! it renders as raw by default, if no contentComponent is provided.
                const Content = (!raw && contentComponent) || React.Fragment;
                const t1 = portalTarget;
                const t2 = portalTarget?.current;

                return (
                    <div className={`portal-to-${name} d-none`}>
                        {portalTarget &&
                            React.createPortal(
                                <Content {...props}>{children}</Content>,
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
        static slotName = name;
        static displayName = `portalSlot‹${name}›`;

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

            //! if as= is passed as a component, that component is EXPECTED to render a
            //   dom element with ref={props._ref}
            const refProp =
                "string" == typeof As
                    ? { ref: this._ref }
                    : { _ref: this._ref };
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
                        {...refProp}
                        className={`${defaultClassName} ${className}`}
                        {...finalProps}
                    >
                        {children}
                    </As>
                </>
            );
        }
    };
    //! it exposes the predefined contentComponent setting for generic use by content-portal supplicants
    slot.contentComponent = contentComponent;
    slot.clientComponent = clientComponent;

    return slot;
}
