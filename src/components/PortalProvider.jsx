import React from "react";
import Reactor, { Actor, Action, autobind } from "./Reactor";

export function PortalProvider({ ...options }) {
    const {
        name: portalName,
        as: As = "div",
        defaultClassName: predefinedClassName,
        component,
        components = {},
    } = options;
    if ("string" !== typeof As) {
        debugger;
        throw new Error(
            `portalProvider ${portalName}: 'as' option must be a string such as 'div' or 'h2' naming an html tag`
        );
    }
    if (!components.default) {
        if (!component)
            throw new Error(
                `PortalProvider: missing required 'components.default' or 'component' setting`
            );
        components.default = component;
    }
    return class portalProvider extends React.Component {
        static slotName = portalName;
        portalTarget = React.createRef();
        state = {};
        componentDidMount() {
            this._connectToRegistry();
        }

        @autobind
        _connectToRegistry() {
            const registry = Reactor.actionResult(
                this,
                "portal:registry",
                () => {
                    //! it handles a race between mounting a portal provider and the registry
                    if (this.state.attempts > 5) {
                        throw new Error(
                            `PortalProvider for ${portalName} unable to connect to portal registry after ${attempts} attempts`
                        );
                    }
                    setTimeout(this._connectToRegistry, 1);
                    this.setState(({ attempts = 0 }) => ({
                        attempts: 1 + attempts,
                    }));
                }
            );
            if (registry) {
                const { attempts = 0 } = this.state;
                // console.log(`portal provider got registry after ${attempts} attempts`);
                this.setState({ registry });
                this._initializeFacades();
            }
        }
        render() {
            //! it uses the configured portal name by default
            //!  if an overridden portalName is provided in props, it uses that instead
            const {
                defaultClassName = predefinedClassName,
                className = "",
                portalName: specificPortalName = portalName,
                initialize,
                children,
                ...props
            } = this.props;
            const { registry, ready } = this.state;
            const reserved = ["target", "registry", "components"];

            //! it projects an Action into the portal registry to expose
            //  itself as a portal target, enabling this named portal to be
            //  discovered by portal clients.

            //  As a result, the Action is collected within the nearest Reactor
            //  to the REGISTRY, not to the nearest Reactor to the portal provider.
            //  typically, this would give a global scope to the portal-discovery.

            //! the portal-discovery Action should be accessible to any
            //  requesting portal-clients in the application.

            //! A PortalProvider can be hosted inside another PortalProvider,
            //  and the resulting portal-discovery Actions should all be accessible
            //  in a flat event-name-space.

            //  Note that this implementation uses a portal to project its action
            //  outside the DOM location of the portal provider.  That could be
            //  confusing at first, in that this component provides a portal TARGET.
            //  Projecting the discovery Actions into the PortalRegistry using a portal
            //  is a technique used to serve the requirements detailed above -
            //  not connected to its PROVIDING of a portal.

            //! the Actions provided by the ProtalProvider are accessible to any
            //  application pages, by invoking them with this pattern:
            //
            //    `const result = Reactor.actionResult('portal:‹action›')
            //
            // Available actions include:
            //      portal:‹portalName›  - returns the portal's default React Component
            //      portal:components:‹portalName› - returns a map of all the portal's exposed Components.
            //      portal:target:‹portalName› - returns the portal's destination DOM node

            if (reserved.find((x) => x === specificPortalName)) {
                throw new Error(
                    `invalid use of reserved name "${specificPortalName}" for a PortalProvider`
                );
            }
            const { default: DefaultComponent } = this._facades || {};

            // prettier-ignore
            return (
                <>
                    <As
                        ref={this.portalTarget}
                        className={`${defaultClassName} ${className}`}
                    >
                        {registry &&
                            React.createPortal(
                                <>
                                    <Action
                                        returnsResult
                                        {...{
                                            [`target:${specificPortalName}`]:
                                                this.getTarget,
                                        }}
                                    />
                                    <Action
                                        returnsResult
                                        {...{
                                            [`components:${specificPortalName}`]:
                                                this.getComponentFacades,
                                        }}
                                    />
                                    <Action
                                        returnsResult
                                        {...{
                                            [`${specificPortalName}`]:
                                                this.getDefaultComponentFacade,
                                        }}
                                    />
                                </>,
                                registry
                            )}
                    </As>
                </>
            );
        }
        @autobind getTarget() {
            return this.portalTarget.current;
        }
        @autobind getComponentFacades() {
            return this._facades;
        }
        @autobind getDefaultComponentFacade() {
            return this._facades.default;
        }

        _initializeFacades() {
            // const { components, name: portalName } = options;
            const f = (this._facades = {});
            for (const [name, component] of Object.entries(components)) {
                f[name] = this.mkFacade(component);
            }
            if (!f.default)
                throw new Error(
                    `no components.default provided to PortalProvider '${portalName}'`
                );
        }

        mkFacade(Component) {
            const { portalName: specificPortalName = portalName } = this.props;
            const contentName =
                "string" === typeof Component
                    ? Component
                    : Component.displayName || Component.name;
            if (!contentName) debugger;

            const provider = this;
            return class portalComp extends React.Component {
                // static contentComponent = content;
                static displayName = `portalComp‹${contentName}›`;

                render() {
                    const { children, ...props } = this.props;
                    const { portalTarget: portal } = provider;
                    return (
                        <div
                            className={`_comp-${contentName} _portal-to-${specificPortalName} d-none`}
                        >
                            {portal?.current &&
                                React.createPortal(
                                    <Component {...props}>
                                        {children}
                                    </Component>,
                                    portal.current
                                )}
                        </div>
                    );
                }
            };
        }
    };
}

PortalProvider.client = function PortalClient(Wrapped) {
    const Provider = function portalProvider({ ...props }) {};
    Provider.displayName = `portalProvider‹›`;
};
