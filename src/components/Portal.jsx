import React from "react";
import { Action, Actor, autobind } from "./Reactor";

@Actor
export class PortalRegistry extends React.Component {
    name() {
        return "portal";
    }

    registry = React.createRef();
    @autobind
    getRegistry() {
        return this.registry.current;
    }
    render() {
        return (
            <div ref={this.registry}>
                <Action returnsResult registry={this.getRegistry} />

                {/* 
                this is an area where portal-providers will project 
                their own ‹Action› elements.  Those Actions will respond to 
                portal-discovery events, and will be automatically mounted 
                and unmounted with the components that provide them.
            */}
            </div>
        );
    }
}

// these are never changed
const dummy1 = {},
    dummy2 = {},
    dummy3 = {};

let instance = React.createRef();
function instanceRequired() {
    if (!instance.current)
        throw new Error(
            `Posh Plum: Portal: no singleton instance of <Portal.Registry /> found in the application`
        );
}
const defaultPortalComponentProxy = new Proxy(dummy1, {
    get(neverChanged, portalName, reg) {
        instanceRequired();
        //! it returns the default component (facade) for the given portalName
        return instance.current.actionResult(
            `portal:${portalName}`,
            {},
            (err) => {
                return lateOrMissingPortal(portalName);
            }
        );
    },
});

const portalComponentsProxy = new Proxy(dummy2, {
    get(neverChanged, portalName, reg) {
        instanceRequired();
        //! it returns a map of component facades for the given portalName
        return instance.current.actionResult(
            `portal:components:${portalName}`,
            {},
            (event, err) => {
                return lateOrMissingPortalComponents(portalName);
            }
        );
    },
});

const portalTargetProxy = new Proxy(dummy3, {
    get(neverChanged, portalName, reg) {
        instanceRequired();
        //! it returns a DOM node for the given portalName
        return instance.current.actionResult(
            `portal:target:${portalName}`,
            {},
            (err) => {
                return lateOrMissingPortal(portalName);
            }
        );
    },
});

function lateOrMissingPortal(portalName, componentName) {
    return class lateBoundPortal extends React.Component {
        componentDidMount() {
            setTimeout(() => {
                const action = componentName
                    ? `portal:components:${portalName}`
                    : `portal:${portalName}`;

                console.warn(`checking for late bound ${action}`);
                let LateBound = instance.current.actionResult(
                    action,
                    {},
                    () => {}
                );
                const foundPortal = {};
                if (LateBound) {
                    if (componentName) {
                        LateBound = LateBound[componentName];
                        if (!LateBound) {
                            console.warn(
                                `late bound found ${portalName}: missing ${componentName}`
                            );
                            foundPortal.foundPortal = true;
                        }
                    } else {
                        console.warn(
                            `late bound found ${portalName} default component`
                        );
                    }
                    this.setState({ LateBound, ...foundPortal });
                }
            }, 44);
        }
        render() {
            const { LateBound, foundPortal } = this.state;
            if (LateBound) {
                console.log(
                    `rendering a late-bound component ${portalName}:${
                        componentName || "‹default›"
                    }`
                );
                return <LateBound {...this.props} />;
            }

            if (!componentName)
                return (
                    <div className="alert alert-warning">
                        warning: unknown portal: {portalName}
                    </div>
                );

            if (foundPortal)
                return (
                    <div className="alert alert-error">
                        error: portal {portalName} found, but it doesn't have a
                        &lt;{componentName}&gt; component.
                    </div>
                );

            return (
                <div className="alert alert-warning">
                    warning: no &lt;{componentName}&gt; in unknown portal:{" "}
                    {portalName}
                </div>
            );
        }
    };
}

function lateOrMissingPortalComponents(badPortalName) {
    return new Proxy(
        {},
        {
            get(x, componentName) {
                return lateOrMissingPortal(badPortalName, componentName);
            },
        }
    );
}

const defaultCompLookup = function () {};
defaultCompLookup.prototype = defaultPortalComponentProxy;
// const portalComponents = function () { }; portalComponents.prototype = portalComponentsProxy;
class PortalAPI extends defaultCompLookup {
    Registry() {
        return <PortalRegistry ref={instance} />;
    }
    get registry() {
        return instance.current;
    }
    components = portalComponentsProxy;
    raw = portalTargetProxy;
}
export const Portal = new PortalAPI();
