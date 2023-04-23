import React from "react";

import { autobind } from "@poshplum/utils/browser";
import { Action } from "../reactor/Action";
import { Actor } from "../reactor/Actor";

@Actor
export class PortalRegistry extends React.Component {
    constructor() {
        super();

        this._portals = {};
    }

    name() {
        return "portal";
    }

    get portals() {
        return this._portals
    }
    
    @autobind
    addPortal(name, portalInstance) {
        const {props:{id}} = portalInstance;

        const nameAndId = id ? `${name}:${id}` : name;
        if (this._portals[nameAndId]) {
            debugger
            throw new Error(`duplicate '${nameAndId}' portal`);
        }
        this._portals[nameAndId] = portalInstance
    }
    
    @autobind 
    removePortal(name, instance) {
        const {[name]: found, ...updatedPortals } = this._portals;

        if (found !== instance) {
            throw new Error(`portal '${name}' mismatched during remove`)
        }
        this._portals = updatedPortals;
    }

    registry = React.createRef();
    @autobind
    getRegistry() {
        return {
            instance: this,
            // dom: this.registry.current
        }
    }
    render() {
        // console.error(`PortalRegistry: `, this._portals);
        return (
            <div ref={this.registry}>
                <Action returnsResult registry={this.getRegistry} />
            </div>
        );
    }
}
