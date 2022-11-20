import React, { Component } from "react";
import Layout from "../../components/layout";

import CodeExample from "src/components/CodeExample";
// import { Link } from "react-router-dom";
import { Card } from "../../components/Cards";
import Reactor, { Actor, Action, autobind } from "../../components/Reactor";
import { State, withStateMachine } from "src/components/withStateMachine";

@Layout.portalClient("app")
export default class ReactorExample extends Component {
    cardRef = React.createRef();
    render() {
        const { PageTitle, Menu, Breadcrumbs } = this.portals;
        return (
            <div>
                <PageTitle>About Reactors</PageTitle>
                <Breadcrumbs>Reactor</Breadcrumbs>
                <Menu Link to="/foo">
                    Foot
                </Menu>
                <p>
                    A <b>Reactor</b> is a component that provides a "front-end
                    microservices" pattern, as an event hub for rich application
                    capabilities segmented into any number of small, focused
                    parts.{" "}
                </p>

                <p>
                    Each Reactor is a container that recognizes{" "}
                    <code>{`<Actor/>`}</code>s and <code>{`<Action/>`}</code>s
                    within its subtree, and allows other components access to
                    those <b>actions</b>.
                </p>

                <p>
                    With Actors and Reactors, you can create high-level{" "}
                    <b>application services</b> defined in their own simple
                    modules. Your UI code can then trigger and interact with
                    those services with minimal coupling.
                </p>

                <p>
                    These services can provide a broad range of functional
                    and/or display capabilities. Good examples of actors with
                    separate responsibilities would include:
                </p>

                <ul>
                    <li>installing keyboard shortcuts</li>
                    <li>showing and hiding help content</li>
                    <li>displaying error messages</li>
                    <li>
                        fetching data updates from a server and issuing
                        notifications for those updates
                    </li>
                </ul>
                <p>
                    These capabilities can be exposed to an application through
                    one or more Reactors. In fact, an application can have
                    dozens of Reactors, each of them serving their own subtree
                    of the application. An app typically has a root-level
                    Reactor to serve general functionality for the app.
                </p>

                <h4>Interacting with Actors and Actions</h4>
                <p>There are four main patterns of interactions for Actors:</p>
                <ul>
                    <li>
                        <b>Triggering an Action</b> - A "fire and forget" signal
                        to an Actor to do an activity. <br />
                        Use{" "}
                        <code>
                            Reactor.trigger(this, "actionName", {options})
                        </code>{" "}
                        <br />
                        Or, inside an Actor or Reactor:{" "}
                        <code>this.trigger("actionName", {options})</code>
                        <br />
                        <br />
                    </li>
                    <li>
                        <b>Triggering an Action that returns a result</b> - An
                        actor exposing an action with a `returnsResult` option
                        can additionally return a result, acting like a remote
                        function-call.
                        <br />
                        <br />
                        If the {component("Action returnsResult  ....")} also
                        has the `async` prop, that result can be returned
                        through a promise.
                        <br />
                        Use <code>Reactor.actionResult()</code> and{" "}
                        <code>this.actionResult()</code> in the same way as for{" "}
                        <code>trigger()</code>.
                        <br />
                        <br />
                    </li>
                    <li>
                        <b>Subscribing to notifications</b> - a component can
                        connect loosely to an actor using{" "}
                        {component(`Subscribe ‹eventName›={myHandlerFunction}`)}
                        , and be notified when it publishes notifications of
                        that event. Any number of components can subscribe to
                        such a notification.
                        <br />
                        <br />
                    </li>

                    <li>
                        <b>Notifying Subscribers</b> - An actor wishing to
                        notify subscribers of an event can declare a{" "}
                        {component(`Publish ‹eventName›`)} and call{" "}
                        <code>
                            this.notify(eventName, {curly("...details")})
                        </code>{" "}
                        to push notifications to subscribers.
                        <br />
                        <br />
                    </li>
                </ul>

                <h4>Reactors, Actors and Events</h4>
                <p>
                    Reactor events leverage the browser's CustomEvent and other
                    event infrastructure, so they flow through the DOM tree the
                    same way as browser-native events. Reactor additionally
                    includes a built-in event registry, so that unknown event
                    names are easy to spot.
                </p>
                <p>
                    <i>
                        Reactor provides an event hub, so that components can
                        reliably use actions or subscribe to trigger events
                        declared in actors defined in completely different DOM
                        subtrees (they need only share a Reactor ancestor).
                        Plum's Reactors are entirely component-based, so they're
                        easily mounted and unmounted.
                    </i>
                </p>
                <h5>Publish and Subscribe</h5>
                <p>
                    Reactor's{" "}
                    <code>
                        {`<`}Publish/{`>`}
                    </code>
                    and{" "}
                    <code>
                        {`<`}Subscribe/{`>`}
                    </code>{" "}
                    can be used by actors to inform other components about
                    asynchronous events. This data-loading example triggers the
                    books:dataUpdated event when books:load has completed:
                </p>

                <div className="text-small container">
                    <div className="col-4">
                        Starting with a defined Actor:
                        <CodeExample>
                            {`@Actor
class BookFetcher extends React.Component {
  static name='books';

  load = async ({detail:{search,pageNumber}}) => {
    const result = await fetch(... search, pageNumber ...) {}
    if (!result.ok) return this.notify('fetchError', {result});
    const json = await result.json()
    this.notify('dataUpdated', json);
  }
  render() {
    return <div>
      <Action load={this.load} />
      <Publish event="fetchError" />
      <Publish event="dataUpdated" />
    </div>
  }
}
`}
                        </CodeExample>
                        <p>
                            The actor's <code>notify</code> method is a trigger
                            for notifying all subscribers of a a published
                            event.
                        </p>
                    </div>
                    <div className="col-8">
                        ...the actor can be used within some other component,
                        with a subscription for updates:
                        <CodeExample>
                            {` 
  return <div>
    <BookFetcher/>
    <Subscribe books$dataUpdated={updateResults} />

    <button onClick={() => Reactor.trigger(this, 'books:load',{search,pageNumber})}>Search</button>

    ... some rendering of the results...
</div>
`}
                        </CodeExample>
                        <p>
                            This example also demonstrates triggering the Action
                            defined in that actor.
                        </p>
                        <p>
                            Starting from this simple example, you might make
                            the BookFetcher actor do more advanced behaviors
                            such as monitoring for new books, and notifying
                            subscribers when the book-list has been updated.
                            Decoupling responsibilities between UI that may
                            render books from the logic to load or freshen a
                            list of books enables more advanced behaviors, such
                            as mentioned in the next example with a Product
                            Tour.
                        </p>
                    </div>
                </div>
                <h5>Example: State Machine internals</h5>
                <div className="container">
                    <div className="col-8">
                        <p>
                            Posh Plum's State Machine is an example of a
                            Reactor. It uses Actions to expose triggers for
                            transitioning between states.{" "}
                        </p>
                        <p>
                            Any component can trigger the state machine's
                            Actions to initiate transitions using DOM events.
                            That might be done by a Product Tour component
                            completely outside your application's normal
                            component hierarchy or somewhere else.
                        </p>
                        <button
                            onClick={() => {
                                React.findDOMNode(
                                    this.cardRef.current
                                ).dispatchEvent(new Event("open"));
                            }}
                        >
                            <code>elem.dispatchEvent(new Event("open"))</code>
                        </button>
                        &nbsp;
                        <button
                            onClick={() => {
                                this.cardRef.current.trigger("close");
                            }}
                        >
                            Close
                        </button>
                        <p>
                            A reactor's `trigger` method can also be used to
                            generate that dom event.
                        </p>
                        <button
                            onClick={() => {
                                this.cardRef.current.trigger("open");
                            }}
                        >
                            <code>cardRef.current.trigger("open")</code>{" "}
                        </button>
                    </div>
                    <div className="col-4">
                        <p className="text-small">
                            Real-world state-machines are good at handling more
                            complicated cases but consider a simple example
                            where an on-screen card can be opened and closed,
                            revealing more details while the card is open.
                        </p>
                        <StateMachineExample ref={this.cardRef} />
                    </div>
                </div>

                <h5>Example: Error Rendering</h5>

                <ErrorExample>
                    <p>
                        {" "}
                        Actors can provide functionality and/or can render
                        information onscreen. Rendering errors that may occur
                        anywhere in an application is a good example.
                    </p>

                    <p>
                        In this example, an <code>error</code> action is
                        defined. When triggered, the action's{" "}
                        <code>message</code> argument is added to the error
                        section.{" "}
                    </p>
                    <p>
                        A more realistic example might expire error messages so
                        that they are removed after some modest delay.
                    </p>
                </ErrorExample>
            </div>
        );
    }
}

@withStateMachine
class StateMachineExample extends React.Component {
    render() {
        return (
            <Card>
                <State name="default" transitions={{ open: "open" }} />
                <State name="open" transitions={{ close: "default" }} />
                This card has a built-in state-machine
                {this.hasState("open") && (
                    <>
                        <div>more detail in an open card</div>
                        <Link className="button btn" to="/stateMachine/">
                            More about State Machine
                        </Link>
                    </>
                )}
                <Card.Footer>
                    {(this.hasState("default") && (
                        <button onClick={this.mkTransition("open")}>
                            Open
                        </button>
                    )) || (
                        <button onClick={this.mkTransition("close")}>
                            Close
                        </button>
                    )}
                </Card.Footer>
            </Card>
        );
    }
}

@Reactor
class ErrorExample extends React.Component {
    state = { c: 1, errors: [] };

    @autobind
    addError(e) {
        const { message = "some error message" } = e.detail;
        this.setState(({ c = 1, errors = [] }) => {
            errors.push(`Error ${c}: ${message}`);

            return { c: 1 + c, errors };
        });
    }
    render() {
        const { children } = this.props;
        return (
            <div id="me" className="container">
                <Action bare error={this.addError} />
                <div className="col-12">
                    {this.state.errors.map((e) => (
                        <div className="alert alert-warning">{e}</div>
                    ))}
                </div>
                <div className="col-4">
                    {children}

                    <button onClick={() => this.trigger("error")}>
                        trigger an error
                    </button>
                </div>
                <div className="col-8 text-small">
                    <CodeExample>
                        {`@Reactor
class ErrorExample extends React.Component {
    state = { c: 1, errors: [] };

    @autobind
    addError(e) {
        const { message = "some error message" } = e.detail;
        this.setState(({ c = 1, errors = [] }) => {
            errors.push(\`Error $\{c}: $\{message}\`);

            return { c: 1 + c, errors };
        });
    }
    render() {
        const {errors} = this.state;
        return <div>
            <Action error={this.addError} />
            {errors.map((e) => (
                <div className="toast toast-error">{e}</div>
            ))}

        </div>
    }
}
`}
                    </CodeExample>
                </div>
            </div>
        );
    }
}
