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
                    <div className="alert alert-warning">
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

const portalComponentsUsage = [
    "const {components: {‹somePortalName›: { ‹somePortalComponentName› }} = Portals;\n",
    "    Note the second layer of braces   ^^ \n\n",
    "Did you intend to access the default portal component instead?\n",
    "    const { ‹somePortalName› } = Portals;",
];

function lateOrMissingPortalComponents(badPortalName) {
    const p = new Proxy(
        {
            info: `lateOrMissingPortalComponent‹${badPortalName}›`,
            info2: `a facade for connecting portal-component requests connected to portals`,
            info3: ` - particularly, for portals that may be registered soon *after* the attempt to get the named portal-component`,
            usage: ` - const { somePortalName: { someComponentName } } = Portals;`,
        },
        {
            get(x, componentName, y) {
                const msg = [
                    "returning component for late-or-missing portal component",
                    badPortalName,
                    " ->",
                    componentName,
                ];
                if (componentName == Symbol.toPrimitive) {
                    console.error(
                        `Portal-component request for: `,
                        badPortalName
                    );
                    throw new Error(
                        `Incorrect use of Portal facade (see console log for portal name).  \n\n` +
                            `Likely misuse of { components: { ‹portalName›: {‹portalComponentName›} } } = Portals; \n` +
                            `   (you need to destructure the inner portalComponentName!)\n\n  ` +
                            `Usage: `+ portalComponentsUsage.join("")
                    );
                }
                if (componentName[0] == "_") {
                    msg.push("Usage: ", ...portalComponentsUsage);
                    console.error(...msg);
                } else {
                    console.warn(...msg);
                }
                return lateOrMissingPortal(badPortalName, componentName);
            },
        }
    );

    //! it gives developers a clear signal when they use it wrong and their accessed value
    //  is used as a react component
    const DevErrorIncorrectUsage = function (props) {
        console.warn(`Portal.components‹${badPortalName}› proxy: `, p);
        return (
            <div className="alert alert-danger">
                <p>Developer error: bad use of Portal.components for portal '{badPortalName}' (see devtools console for more info) </p>
                Usage:
                <pre className="ms-3">
                    <code>{portalComponentsUsage.join("")}</code>
                </pre>
            </div>
        );
    };
    DevErrorIncorrectUsage.defaultProps = null;
    DevErrorIncorrectUsage.propTypes = null;
    DevErrorIncorrectUsage.displayName = "invalild‹Portal.components›";
    DevErrorIncorrectUsage.contextType = null;
    DevErrorIncorrectUsage.getDerivedStateFromProps = null;

    //! it returns an object with proxying behavior for later access to the components defined by a portal
    Object.setPrototypeOf(DevErrorIncorrectUsage, p);
    return DevErrorIncorrectUsage; // does it work?
    return p;
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
