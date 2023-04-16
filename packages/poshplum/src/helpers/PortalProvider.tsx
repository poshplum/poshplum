/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
// import { __decorate } from "tslib";
import React from "react";
import { createPortal } from "react-dom";

import { autobind, autobindMethods } from "@poshplum/utils/browser";
import { Reactor } from "../Reactor";

// import { Action } from "../reactor/Action";
//!!! todo verify we can get rid of slotName, and do it.  Or remove this note.  

interface hasGen {
    gen: number
}

interface BasePortalProviderProps {
    defaultClassName?: string,
    className?: string,
    id?: string,
    // initialize,
    debug?: number,
    children: typeof React.Children,
}

type specificPortalProviderProps = BasePortalProviderProps & {
    [key: string]: any
}

interface PortalProviderState extends hasGen {
    attempts: number,
    registry: any,
    ready: boolean
}

interface PortalProviderOptions {
    name: string
    slotName: string,
    as: React.ComponentType,
    defaultClassName?: string,
    component? : React.ComponentType, 
    components? : Record<string, React.ComponentType>,
    facade?: boolean,
}
export function PortalProvider({ ...options }: PortalProviderOptions) {
    const {
        name: portalName,
        slotName = portalName,
        as: As = "div",
        defaultClassName: predefinedClassName,
        component,
        components = {},
        facade = true, //!!! todo probably some better way of expressing this
    } = options;
    if ("string" !== typeof As) {
        // eslint-disable-next-line no-debugger
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

    const portalProviderClass = autobindMethods(
        class portalProvider extends React.Component<specificPortalProviderProps, PortalProviderState> {
            static displayName = `portalProvider‹${portalName}›`;
            static autobindMethods = [
                "_connectToRegistry",
                "getTarget",
                "getNamedComponentsOrFacades",
                "getDefaultComponentOrFacade",
            ];
            static slotName = slotName;
            componentDidMount() {
                this._connectToRegistry();
            }
            bump() {
                this.setState(({ gen = 0 }) => ({ gen: gen + 1 }));
            }
            portalTarget: React.Ref<any>
            _components?: Record<string, React.ComponentType>

            constructor(props: specificPortalProviderProps) {
                super(props);
                this.portalTarget = React.createRef();
                this.state = {
                    gen: 0,
                    attempts: 0,
                    registry: null,
                    ready: false
                }
            }

            //!!! todo: revisit autobind if/when it can be valid inside this dynamic class : (
            // @autobind
            _connectToRegistry() {
                const registry = Reactor.actionResult(
                    this,
                    "portal:registry",
                    () => {
                        const attempts = this.state.attempts;
                        //! it handles a race between mounting a portal provider and the registry
                        if ((attempts || 0) > 5) {
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
            registry!: any
            componentWillUnmount() {
                this.registry.instance.removePortal(this.portalId, this);
            }
            render() {
                //! it uses the configured portal name by default
                //!  if an overridden portalName is provided in props, it uses that instead
                const {
                    defaultClassName = predefinedClassName || "",
                    className = "",
                    id,
                    // initialize,
                    debug,
                    children,
                    ...props
                } = this.props;
                const { ready } = this.state;
                const reserved = ["target", "registry", "components"];

                const portalId = this.portalId;
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
                // eslint-disable-next-line no-debugger
                if (debug) debugger;

                // prettier-ignore
                return (
                <>
                    <As
                        ref={this.portalTarget}
                        data-portalid={portalId}
                        className={`${defaultClassName} ${className}`}
                        {...props}
                    >
                        {children as any}
                    </As>
                </>
            );
            }
            private get portalId() {
                const {id} = this.props
                return id ? `${portalName}:${id}` : portalName;
            }

            //!!! todo: revisit autobind if/when it can be valid inside this dynamic class : (
            // @autobind
            getTarget() {
                //!!! todo: work on this type
                //@ts-expect-error until we figure out the type problem with target?.current
                return this.portalTarget?.current || this.__parentDomNode;
            }
            //!!! todo: revisit autobind if/when it can be valid inside this dynamic class : (
            // @autobind
            getNamedComponentsOrFacades() {
                return this._components;
            }
            //!!! todo: revisit autobind if/when it can be valid inside this dynamic class : (
            // @autobind
            getDefaultComponentOrFacade() {
                // ok!
                return this._components?.default;
            }

            _initializeFacades() {
                // const { components, name: portalName } = options;
                const f : Record<string, React.ComponentType> = (this._components = {});
                for (const [name, component] of Object.entries(components)) {
                    f[name] =
                        (!facade && component) || this.mkFacade(component);
                }
                if (facade && !f.default)
                    throw new Error(
                        `no components.default provided to PortalProvider '${portalName}'`
                    );
            }

            mkFacade(Component : React.ComponentType) {
                const { id } = this.props;

                const fullId = id ? `${portalName}:${id}` : portalName;

                const contentName =
                    "string" === typeof Component
                        ? Component
                        : Component.displayName || Component.name;
                if (!contentName) {
                    console.warn("PortalProvider: unknown component (see debugger for more info)");
                    // eslint-disable-next-line no-debugger
                    debugger;
                }
                // eslint-disable-next-line @typescript-eslint/no-this-alias
                const provider = this;
                return class portalComp extends React.Component {
                    // static contentComponent = content;
                    static displayName = `portalComp‹${contentName}›`;

                    render() {
                        const { children, ...props } = this.props as any
                        const { portalTarget: portal } = provider;
                        return (
                            <div
                                className={`_c--${contentName} _portal-to-${fullId} d-none`}
                            >
                                {
                                    //@ts-expect-error  for now
                                portal?.current &&
                                    createPortal(
                                        <Component {...props}>
                                            {children}
                                        </Component>,
                                        //@ts-expect-error until we figure out how to correct portal.current's type
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

// PortalProvider.client = function PortalClient(Wrapped) {
//     throw new Error(`unused?`);
    
//     const Provider = function portalProvider({ ...props }) {};
//     Provider.displayName = `portalProvider‹›`;
// };