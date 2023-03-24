import React from "react";
// these are never changed

import { PortalRegistry } from "../actors/PortalRegistry";
import levenshtein from "fast-levenshtein";

const baseRetryInterval = 100;  // retry no more frequently than this
const maxAttempts = 10;  // only retry this number of times
const minLagTime = 800;  // don't show warnings until this much time (millis) has passed without found portals.

const dummy1 = {},
    dummy2 = {},
    dummy3 = {};

// See bottom for default export.

const instance = React.createRef();

const defaultCompLookup = function () {
    //! it provides a proxy making it easy to extract the default component for a named portal.

    // (that proxy is attached to the prototype of an empty function, which is then 
    //   used as a base class for the portal API)
};

const defaultPortalComponentProxy = new Proxy(dummy1, {
    get(neverChanged, portalName, reg) {
        if ("__zone_symbol__unconfigurables" === portalName) return undefined;
        if ("splice" === portalName) {
            return undefined;
        }

        console.warn("checking for portal ", portalName);
        const foundPortal = hasRequiredInstance()?.portals?.[portalName];
        //! it returns the default component (or facade) for the given portalName
        return foundPortal?.getDefaultComponentOrFacade() || lateOrMissingPortal(portalName)
    },
});

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

function hasRequiredInstance() {
    if (!instance.current) {
        setTimeout(() => {
            // ???
            if (!instance.current) {
                throw new Error(
                    `Posh Plum: Portal: no singleton instance of <Portal.Registry /> found in the application`
                );            
            }
        }, 2000);
    }

    return instance.current;
}

const portalComponentsProxy = new Proxy(dummy2, {
    get(neverChanged, portalName, reg) {
        //! it returns a map of component facades for the given portalName

        const foundProxy = hasRequiredInstance()?.portals[
            portalName
        ]?.getNamedComponentsOrFacades() ||
            lateOrMissingPortalComponents(portalName);

            return foundProxy;
    },
});

const portalTargetProxy = new Proxy(dummy3, {
    get(neverChanged, portalName, reg) {
        if (!hasRequiredInstance()) {
            return lateOrMissingPortal(portalName)
        }
        //! it returns a DOM node for the given portalName

        console.error(`TODO: identify any remaining need for this code path - or, remove it.`)
        return instance.current.portals[portalName]?.getTarget() ||
            lateOrMissingPortal(portalName);
    },
});

const lateOrMissingPortals = new Map();
function lateOrMissingPortal(portalName, componentName) {
    const k = `${portalName}:::${componentName}`;

    //! it keeps a cache of missing-portal components, based on portal+componentName
    const found = lateOrMissingPortals.get(k);
    if (found) return found;

    const c = class sendToLazyPortal extends React.Component {
        static displayName = `sendToLazyPortal‹${portalName}›`;
        state = {
            attempts: 1,
            started: new Date().getTime(),
        };
        componentDidMount() {
            setTimeout(() => {
                this.tryConnection();
            }, baseRetryInterval);
        }
        tryConnection() {
            const action = componentName
                ? `portal:components:${portalName}`
                : `portal:${portalName}`;

            console.warn(`checking for late bound ${action}`);
            const { attempts } = this.state;
            const debug = attempts > 9 ? 1 : undefined;
            // eslint-disable-next-line no-debugger
            if (debug) debugger;

            //??? here?

            
            let LateBound;
            const matchingPortal = instance.current?.portals[portalName];
            const foundPortal = {};
            if (matchingPortal) {
                if (componentName) {
                    LateBound =
                        matchingPortal.getNamedComponentsOrFacades()[
                            componentName
                        ];
                    if (!LateBound) {
                        console.warn(
                            `late bound found ${portalName}: missing component '${componentName}'`
                        );
                        foundPortal.foundPortal = true;
                    }
                } else {
                    console.warn(
                        `late bound found ${portalName} default component`
                    );
                    LateBound = matchingPortal.getDefaultComponentOrFacade();
                }
                this.setState({ LateBound, ...foundPortal });
            } else {
                if (attempts >= maxAttempts) {
                    console.error(
                        `giving up on lazy send-to-portal ${portalName}`
                    );
                    return;
                }
                this.setState({ attempts: 1 + attempts });
                setTimeout(
                    this.tryConnection.bind(this),
                    baseRetryInterval * Math.pow(1.27, attempts)
                );
            }
        }
        render() {
            const { LateBound, foundPortal, attempts, started } = this.state;
            if (LateBound) {
                console.log(
                    `rendering a late-bound component ${portalName}:${
                        componentName || "‹default›"
                    }`
                );
                return <LateBound {...this.props} />;
            }

            const elapsed = new Date().getTime() - started;
            const needsWarning = (elapsed > minLagTime) ? true : undefined;
            if (!componentName) {
                const likely = orderedPossibilities(portalName, Object.keys(instance.current?.portals)).join(", ")
                
                return (needsWarning &&
                    <div className="alert alert-warning">
                        qx1: warning: unknown portal {portalName} after {attempts}{" "}
                        tries...<br/>
                        Did you mean {likely}
                    </div>
                );
            }

            if (foundPortal)
                return ( needsWarning &&
                    <div className="alert alert-warning">
                        pu2: error: portal {portalName} found (after {attempts}{" "}
                        tries), but it doesn't have a &lt;{componentName}&gt;
                        component.
                    </div>
                );

            return (
                needsWarning && <div className="alert alert-warning">
                    uf3: warning: no &lt;{componentName}&gt; in unknown portal:{" "}
                    {portalName} after {attempts} tries
                </div>
            );
        }
    };

    lateOrMissingPortals.set(k, c);
    return c;
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
                if (Symbol.toPrimitive === componentName) {
                    console.error(
                        `Portal-component request for: `,
                        badPortalName
                    );
                    throw new Error(
                        `Incorrect use of Portal facade (see console log for portal name).  \n\n` +
                            `Likely misuse of { components: { ‹portalName›: {‹portalComponentName›} } } = Portals; \n` +
                            `   (you need to destructure the inner portalComponentName!)\n\n  ` +
                            `Usage: ` +
                            portalComponentsUsage.join("")
                    );
                }
                if ("_" === componentName[0]) {
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
    const DevHelper = function usageInfoComponent(props) {
        console.warn(`Portal.components‹${badPortalName}› proxy: `, p);
        return (
            <div className="alert alert-danger">
                <p>
                    Developer error: bad use of Portal.components for portal '
                    {badPortalName}' (see devtools console for more info){" "}
                </p>
                Usage:
                <pre className="ms-3">
                    <code>{portalComponentsUsage.join("")}</code>
                </pre>
            </div>
        );
    };
    // fixes up the function for developer-errors to fit interface requirements of Preact.
    // probably these are the same way React does things :pray:
    DevHelper.defaultProps = null;
    DevHelper.propTypes = null;
    DevHelper.displayName = "invalild‹Portal.components›";
    DevHelper.contextType = null;
    DevHelper.getDerivedStateFromProps = null;
    // without these ^, the proxy prototype returns values these properties that cue Preact incorrectly.

    //! it returns an object with proxying behavior for later access to the components defined by a portal
    const ProxyAndDevHelper = DevHelper;
    Object.setPrototypeOf(ProxyAndDevHelper, p);
    // ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ sweet magic here

    return ProxyAndDevHelper;
}

function orderedPossibilities(wrong, possibles=[]) {
    const distances = possibles.map((candidate) => [
        levenshtein.get(candidate, wrong) / wrong.length,
        candidate,
    ])
        .sort(([d1], [d2]) => (d1 < d2 ? -1 : 1))

    const closeDistances = distances.filter(
        ([distance, x]) => distance < 0.6
    );

    const likelyCandidates = closeDistances
        .map(distanceToCandidate);

    if (likelyCandidates.length) return likelyCandidates

    const lessLikely = distances.filter(
        ([distance, x]) => distance < 1
    );

    if (lessLikely.length) return lessLikely.map(distanceToCandidate);

    return distances.map(distanceToCandidate);
    // return distances.map(([d, x]) => `${x}@${d}`);

    function distanceToCandidate([distance, candidate]) { return candidate }
}


// vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv
export const Portal = new PortalAPI();
//  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^



