import {Component} from "react";
import {render} from "react-dom";
import React from "react";
import CodeExample from "../../components/CodeExample";
import Portal from "../../helpers/Portal";
import Panel from "../../components/Panel";
import {Card} from "../../components/Cards";
import Grid from "../../components/Grid";
import {Link} from "react-router-dom";

export default class ReactorExample extends Component {
  render() {

    return <Portal>
      <Panel className="fixed-bottom-right">
        <Panel.Title>
          <img src="/aPoshPlum.svg" alt="" style={{height: "3em", float:"left", position:"relative", top:"-1em", left:"-0.6em", marginBottom:"-1em", marginRight:"-0.66em"}}/>
          <h4>Reactor Example</h4>
        </Panel.Title>

        <h5>About Reactors</h5>

        <p>Reactors are React components that provide event-oriented services for use by other components.  The Reactor
          itself is a container that recognizes <code>{`<Action/>`}</code>s and <code>{`<Actor/>`}</code>s within
          its subtree, and facilitates other components to have access to those actions.  Reactors facilitate application-level
          services using events.
        </p>

        <h5>Example: State Machine</h5>

        <p>Plum's State Machine is an example of a Reactor: it renders Action components such as these, exposing events
          for executing these transitions.  A <code>{`<`}Card/{`>`}</code> might have a state machine, which generates
          actions such as these based on the state transitions defined (see <Link to="/stateMachine/">State Machine</Link> for more info).
        </p>
        <CodeExample>{`<Action open={this.mkTransition('open')} />
<Action close={this.mkTransition('close')} />`}</CodeExample>

        <p>Any component can trigger the state machine's Actions to
          initiate transitions using DOM events.  That might be done by a Product Tour
          component completely outside your application's normal component hierarchy, by a <code>Details...</code>
          button within the <code>{`<`}Card/{`>`}</code> component, or by a <code>{`<`}CardList/{`>`}</code>component
          that signals its first card to expand.  Or by all three.  No props drilling, no global actions.  Each card
          can have its own Reactor.
        </p>

        <h5>Example: Data Loading</h5>
          <p>Reactor also provides <code>{`<`}Publish/{`>`}</code>
            and <code>{`<`}Subscribe/{`>`}</code>, used by actors to inform other components about asynchronous
            events.  The data-loading example triggers the books:dataUpdated event when books:load has completed:
          </p>
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
      <Publish event="dataUpdated" />
    </div>
  }
}

  //... some other component that uses setState() or hooks...
  let {search, pageNumber, results} = this.state || {};
  return <Reactor>
    <Subscribe books$dataUpdated={this.updateResults} />
    <BookFetcher/>
    <button onClick={() => Reactor.dispatchTo(this.myRef, 'books:load',{search,pageNumber})}>Search</button>
      {results.map(...)}
    <button onClick={this.searchNextPage}>More...</button>
  </Reactor>
`}
</CodeExample>
        <p>
          Reactor events leverage the browser's (or jsdom's) CustomEvent and other event infrastructure,
          so they flow through the DOM tree the same way as browser-native events.  Reactor additionally
          includes a built-in event registry, so unknown event names can raise red flags instead of being
          silently ignored.  This makes troubleshooting ever so much easier.
        </p>

        <p>With Actors and Reactors, you can create high-level application services defined
          in their own easily-tested modules, without extra boilerplate.  Your UI code can create
          one-off service instances or trigger centralized services with minimal coupling.  With
          Reactors, your application doesn't need any global state, which can make memory management
          much easier.
        </p>

        <p><i>Reactor provides an event hub, so that components can reliably use actions or
          subscribe to trigger events declared in actors defined in completely different DOM
          subtrees.  Some of the purposes filled by Reactors have similarity to some of the
          purposes filled by Redux, but Reactors are distinct from Redux and can coexist with
          a Redux-based application if you wish.  Since Plum's Reactors are
          entirely component-based, they are easily mounted and unmounted.</i>
        </p>


        <Panel.Footer>
          <Link tabIndex="0" className="btn btn-primary" to="/layouts">More about Layouts</Link>
        </Panel.Footer>
      </Panel>
    </Portal>

  }
}