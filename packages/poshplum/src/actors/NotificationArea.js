import React from "react";
import * as shortid from "shortid";

import { autobind } from "@poshplum/utils/browser";
import { Action, Subscribe, Actor } from "../reactor/index";
import { Reactor } from "../Reactor";

@Actor
export class NotificationArea extends React.Component {
    logFacility = "notificationArea";
    alertsRef = React.createRef();
    name() {
        return "notificationArea"
    }

    @autobind
    addSuccess(event) {
        return this.addNotice("success", event);
    }

    @autobind
    addWarning(event) {
        return this.addNotice("warning", event);
    }

    @autobind
    addError(event) {
        return this.addNotice("error", event);
    }

    @autobind
    hold() {
        if (this.releaser) return;
        const holdPendingPromise = new Promise((res, rej) => {
            this.releaser = res;
        });
        this.setState({
            hold: holdPendingPromise,
        });
    }

    @autobind
    releaseHold(event) {
        if (!this.state.hold) return;

        const { currentTarget, relatedTarget, target } = event;
        const stuff = { currentTarget, relatedTarget, target };
        // console.log(stuff);
        // console.log(
        //     Object.entries(stuff).map(
        //         ({ k, t }) => t === this.alertsRef.current
        //     )
        // );

        this.releaser();
        this.releaser = null;
        this.setState({ hold: false });
    }

    @autobind
    addNotice(severity, event) {
        let { id, [severity]: notice, reactor, isDecorated } = event.detail;
        if (!id) {
            id = shortid.generate();
            event.detail.id = id;
        }
        event.stopPropagation();
        if (!notice) notice = JSON.stringify(event.detail);

        let message = notice.message || notice;
        const { name = "‹NotificationArea without name=›" } = this.props;

        if ("error" === severity) {
            if (isDecorated) {
                // probably redundant, but we want to be certain that errors in particular do arrive somewhere
                console.error(
                    `(at ${name}):`,
                    message + (reactor ? `\n   ${reactor}` : "")
                );
            } else if (reactor) {
                message = message + ` ${reactor}`;
                console.error(`(at ${name}):`, message); // probably redundant, but we want to be certain that errors in particular do arrive somewhere
            }
        }

        const timeout = setTimeout(async () => {
            await this.state.hold;
            this.setState(removeThisMessage);
        }, 6000);

        notice = { id, message, severity, timeout };

        this.setState(({ notices = [] } = {}) => {
            notices = [...notices, notice];
            console.log(
                `notification area ${name} -> ${notices.length} notices`,
                notice
            );
            return { notices };
        });

        function removeThisMessage(state) {
            let { notices } = state;
            notices = notices.filter((n) => n.id !== id);
            return { notices };
        }
    }

    render() {
        let { notices = [], hold = "" } = this.state || {};
        let tooltip = (hold && { "data-tooltip": "✋ 🖱️" }) || {};

        return (
            <>
                <Subscribe error={this.addError} />
                <Subscribe success={this.addSuccess} />
                <Subscribe warning={this.addWarning} />

                <Action bare mouseover={this.hold} />
                <Action bare mouseleave={this.releaseHold} />

                <div
                    role="alert"
                    ref={this.alertsRef}
                    className={
                        hold ? "tooltip tooltip-bottom tooltip-left" : ""
                    }
                    {...tooltip}
                    aria-relevant="additions"
                >
                    {" "}
                    {/*  aria-live="polite"  - omitted to avoid double speaking issues in iOS per https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Live_Regions#content */}
                    {notices.map(({ severity, message }, i) => (
                        <div
                            aria-label={`${severity} notice`}
                            key={i}
                            className={`toast toast-${severity}`}
                        >
                            {this.mungeMessage(message)}
                        </div>
                    ))}
                </div>
            </>
        );
    }
    mungeMessage(message) {
        //! it displays a react element as-is
        if (message.type && message.props) return message;

        const t = message.split("\n").flatMap((m) => [
            m,
            <React.Fragment>
                <br />
                &nbsp;&nbsp;
            </React.Fragment>,
        ]);
        t.pop();
        return t;
    }
}
