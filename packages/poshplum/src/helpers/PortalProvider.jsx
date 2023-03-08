import { __decorate } from "tslib";
import React from "react";
import { Reactor } from "../Reactor";
import { Action } from "../reactor/Action";
import { autobind, autobindMethods } from "@poshplum/utils/browser";

function bumpState(p, m, d) {
    if ("bump" !== m) {
        throw new Error(`@bumpState: expected to decorate method name 'bump()'`)
    }
    d.value = bumpState.inner
    return autobind(p,m,d)
}
bumpState.inner =  function bump() {
    this.setState(({ gen = 0 }) => ({ gen: gen + 1 }));
}

export function PortalProvider({ ...options }) {
    const {
        name: portalName,
        slotName = portalName,
        as: As = "div",
        defaultClassName: predefinedClassName,
        component,
        components = {},
        facade = true, //!!! todo probably some better way of expressing this
        props: portalProviderProps,
    } = options;
    if ("string" !== typeof As) {
        debugger;
        throw new Error(
            `portalProvider ${portalName}: 'as' option must be a string such as 'div' or 'h2' naming an html tag`
        );
    }
    if (!components.default && facade) {
        if (!component)
            throw new Error(
                `PortalProvider: missing 'components.default' or 'component' setting, required for a portal using facade`
            );
        components.default = component;
    }

    // console.warn(`TODO: hot-reloader for factoried portalProvider?`);
    const portalProviderClass = autobindMethods(
        class portalProvider extends React.Component {
            static displayName = `portalProvider‹${portalName}›`;
            static autobindMethods = [
                "_connectToRegistry",
                "getTarget",
                "getNamedComponentsOrFacades",
                "getDefaultComponentOrFacade",
            ];
            static slotName = slotName;
            portalTarget = React.createRef();
            state = {gen:0};
            componentDidMount() {
                this._connectToRegistry();
            }
            bump = bumpState.inner;

            @autobind
            _connectToRegistry() {
                const registry = Reactor.actionResult(
                    this,
                    "portal:registry",
                    () => {
                        //! it handles a race between mounting a portal provider and the registry
                        if ((this.state.attempts || 0) > 5) {
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
                    Object.defineProperty(this, "registry", {value: registry, enumerable: false})
                    registry.instance.addPortal(portalName, this)
                    this._initializeFacades();
                    this.bump()
                }
            }
            componentWillUnmount() {
                this.state?.registry?.instance?.removePortal(portalName, this);
            }
            render() {
                //! it uses the configured portal name by default
                //!  if an overridden portalName is provided in props, it uses that instead
                const {
                    defaultClassName = predefinedClassName,
                    className = "",
                    id,
                    initialize,
                    debug,
                    children,
                    ...props
                } = this.props;
                const { ready } = this.state;
                const reserved = ["target", "registry", "components"];

                const fullId = id ? `${portalName}:${id}` : portalName;
                //! it registers itself with the portal registry to expose
                //  itself as a portal target, enabling this named portal to be
                //  discovered by portal clients.

                //! A PortalProvider can be hosted inside another PortalProvider,
                //  and the resulting portal-discovery Actions should all be accessible
                //  in a flat event-name-space.

                //! the registered portal can be accessed through the Portal utiility 
                //    object: Portal.‹portalName›, Portal.components.‹portalName›
                //    - the returned components automatically project their content into the portal.
                //      ‹portalName›  - returns the portal's default component
                //      components.‹portalName› - returns a map of all the portal's exposed components

                //! Portal providers with facade: false only
                //     returns registered components, without a projection-wrapper - useful as an indirect 
                //     component registry / dependency resolution mechanism

                if (reserved.find((x) => x === portalName)) {
                    throw new Error(
                        `invalid use of reserved name "${id}" for a PortalProvider`
                    );
                }
                const { default: DefaultComponent } = this._components || {};
                if (debug) debugger;

                // prettier-ignore
                return (
                <>
                    <As
                        ref={this.portalTarget}
                        className={`${defaultClassName} ${className}`}
                        {...portalProviderProps}
                    >
                        {children}
                    </As>
                </>
            );
            }
            @autobind getTarget() {
                debugger
                return this.portalTarget.current || this.__parentDomNode;
            }
            @autobind getNamedComponentsOrFacades() {
                return this._components;
            }
            @autobind getDefaultComponentOrFacade() {
                // ok!
                return this._components.default;
            }

            _initializeFacades() {
                // const { components, name: portalName } = options;
                const f = (this._components = {});
                for (const [name, component] of Object.entries(components)) {
                    f[name] =
                        (!facade && component) || this.mkFacade(component);
                }
                if (facade && !f.default)
                    throw new Error(
                        `no components.default provided to PortalProvider '${portalName}'`
                    );
            }

            mkFacade(Component) {
                const { id } = this.props;

                const fullId = id ? `${portalName}:${id}` : portalName;

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
                                className={`_comp-${contentName} _portal-to-${fullId} d-none`}
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
        }
    );

    return portalProviderClass;
}
PortalProvider.client = function PortalClient(Wrapped) {
    const Provider = function portalProvider({ ...props }) {};
    Provider.displayName = `portalProvider‹›`;
};
