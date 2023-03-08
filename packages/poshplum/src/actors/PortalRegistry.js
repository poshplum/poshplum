import React from "react";

import { autobind } from "@poshplum/utils/browser";
import { Action } from "../reactor/Action";
import { Actor } from "../reactor/Actor";

@Actor
export class PortalRegistry extends React.Component {
    state = {portals: {}};
    name() {
        return "portal";
    }

    get portals() {
        return this.state.portals || {}
    }
    
    @autobind
    addPortal(name, portalInstance) {
        const {props:{id}} = portalInstance;
        const nameAndId = id ? `${name}:${id}` : name;
        if (this.state.portals[nameAndId]) {
            debugger
            throw new Error(`duplicate '${nameAndId}' portal`);
        }

        this.setState({portals: {
            ...this.state.portals,
            [nameAndId] : portalInstance
        }})
    }
    @autobind 
    removePortal(name, instance) {
        const {portals: {[name]: found, ...portals }} = this.state;

        if (found !== instance) {
            throw new Error(`portal '${name}' mismatched during remove`)
        }
        this.setState({portals})
    }

    registry = React.createRef();
    @autobind
    getRegistry() {
        return {
            instance: this,
            dom: this.registry.current
        }
    }
    render() {
        return (
            <div ref={this.registry}>
                <Action returnsResult registry={this.getRegistry} />
            </div>
        );
    }
}
