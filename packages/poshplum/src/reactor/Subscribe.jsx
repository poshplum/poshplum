/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
//!!! todo add types

import React from "react";

import { autobind } from "@poshplum/utils/browser";
import { Reactor } from "../Reactor";

export class Subscribe extends React.Component {
    constructor(props) {
        super(props);
        this._subRef = React.createRef();
    }

    get delegateEl() {
        const {delegate:d} = this.props
        if (d && !d.el) {
            debugger
            throw new Error(`Subscribe: delegate: missing expected .el`)
        }
        return d?.el || this.reactor?.el
    }

    componentDidMount() {
        if (super.componentDidMount) super.componentDidMount();
        const { skipLevel, delegate, optional = false } = this.props;

        this.subscriptionPending = true;

        if (delegate) {
            setTimeout(this.doSubscribe, 1);
            return
        }

        const attempt = tryNow.bind(this);
        attempt();

        function tryNow() {
            let skipped = false;
            let retry;
            const reactor = Reactor.actionResult(
                this._subRef.current,
                "reactorProbe",
                {
                    single: true,
                    onReactor(r) {
                        if (skipLevel && !skipped) {
                            skipped = true;
                            return false;
                        }
                        return r;
                    },
                },
                (caughtError) => {
                    console.warn(
                        "no reactor yet for ‹Subscribe›... will retry (in catch)"
                    );
                    retry = setTimeout(attempt, 100);
                }
            );
            if (!reactor) {
                if (!retry) {
                    console.warn(
                        "no reactor yet for ‹Subscribe›... will retry (outside catch)"
                    );
                    retry = setTimeout(attempt, 100);
                }
                return;
            }
            this.reactor = reactor;

            // defer registering the subscriber for just 1ms, so that
            // any <Publish>ed events from Actors will have their chance
            // to be mounted and registered:
            setTimeout(this.doSubscribe, 1);
        }
    }

    @autobind
    doSubscribe() {
        delete this.subscriptionPending;

        const { optional = false } = this.props;
        const subscriberReq = Reactor.SubscribeToEvent({
            eventName: this.eventName,
            single: true,
            optional: true,
            owner: this,
            listener: this.listenerFunc,
            debug: this.debug,
        });

       if (this.debug > 2) debugger
 
        if (!this._unmounting && this._subRef.current) {
            let ok = true
            Reactor.trigger(
                this.delegateEl,
                subscriberReq,
                {},
                (unhandledEvent) => {
                    ok = false
                    if (this.debug > 2) debugger
                    
                    console.warn(
                        `${(optional && "optional ") || ""}subscribe to '${
                            this.eventName
                        }': no matching Publish, will retry`
                    );
                    const { retries = 0 } = this.state;
                    if (retries > 10) {
                        this.failed = true;
                        console.warn(`giving up on Subscribe ${this.eventName}`);
                        return;
                    }
                    setTimeout(this.doSubscribe, Math.pow(1.27, retries));
                    this.setState({ retries: 1 + retries });
                }
            );
        } else {
            console.log(
                `Subscribe: event '${this.eventName}' didn't get a chance to register before being unmounted.  \n` +
                    `NOTE: In tests, you probably want to prevent this with "await delay(1);" after mounting.`
            );
        }
    }

    componentWillUnmount() {
        if (super.componentWillUnmount) super.componentWillUnmount();

        if (this.failed) return;
        if (!this.delegateEl) {
            console.warn(
                `‹Subscribe› forcibly unmounted; skipping removeSubscriber`
            );
            return;
        }

        if (!this.subscriptionPending && !this.pubUnmounted)
            Reactor.trigger(
                this.delegateEl,
                Reactor.StopSubscribing({
                    eventName: this.eventName,
                    single: true,
                    listener: this.listenerFunc,
                })
            );
        this.unmounting = true;
    }
    publisherUnmounted() {
        this.pubUnmounted = true;
    }

    render() {
        const { children, skipLevel, optional, delegate, debug, ...handler } = this.props;

        const foundKeys = Object.keys(handler);
        if (foundKeys.length > 1) {
            throw new Error(
                `ambiguous event-name (${foundKeys.join(",")}\n` +
                    `  usage: ‹Subscribe [skipLevel] [optional] [debug] ‹eventName›={notifyFunction}›`
            );
        }
        this.eventName = foundKeys[0];
        this.debug = debug;
        if (
            this.listenerFunc &&
            this.listenerFunc !== handler[this.eventName]
        ) {
            throw new Error(
                `‹Subscribe ${this.eventName}› has changed event handlers, which is not supported. ` +
                    `... this can commonly be caused by doing ${this.eventName}={this.someHandler.bind(this)} on a component class.  A good fix can be to bind the function exactly once, perhaps in a constructor.`
            );
        }
        this.listenerFunc = handler[this.eventName];

        return (
            <div
                style={{ display: "none" }}
                className={`listen listen-${this.eventName} ${
                    (delegate && " listensAtSourceDelegate" ) || ""
                }`}
                ref={this._subRef}
            />
        );
    }
}
