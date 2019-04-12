import React from "react";
import {render} from "react-dom";
import TopMenuLayout, {Menu, Title} from "../components/layouts/topmenu";
import AboutLayouts from "./AboutLayouts";
import {Switch, withRouter} from "react-router-dom";
import DocsLayout from "./DocsLayout";
import AboutPlum from "./AboutPlum";
import {Card} from "../components/Cards";
import Grid from "../components/Grid";
import RelativeRoute from "../helpers/RelativeRoute";
import Portal from "../helpers/Portal";
import {Panel} from "../components/Panel";
import LayoutExample from "./examples/LayoutExample";
import withStateMachine from "../components/withStateMachine";
import Reactor, {Subscribe} from "../components/Reactor";
import Redirect from "react-router-dom/es/Redirect";


export default class DocsIndex extends React.Component {
  render() {
    return <DocsLayout>
      <Title>A Posh Plum - Intro</Title>

      <div className="columns">
        <div className="column col-6 col-md-12 columns">
          <div className="column col-6 col-lg-12">
            <h4>What is it?</h4>
            <p>A Posh Plum is a small library for React application development.  It provides a
              concise set of primitives, UI components and feature-level patterns for creating
              rich application functionality with simpler code.
            </p>

            <p>Plum is designed to help you build apps.  You can choose what kind of app: React-Native,
              single-page apps/PWA's, apps that use Plum's UI components, your own UI libraries, or
              widgets from other UI libraries.
            </p>
          </div>

          <div className="column col-6 col-lg-12">
            <h4>Why is it?</h4>

            <p>As UI developers, we have seen many of the same patterns of recurring challenges, year
              after year.  Software development may never be easy, but we think it's still too hard
              to make web apps really great. </p>

            <p>Angular, Vue
              and React do a good job of addressing low-level structuring of applications, yet
              higher-level considerations are left to other libraries, or just left out.  Developers
              pay the costs of fill the gaps on each project.
            </p>

            <p>Higher-level patterns and best practices aren't easy to do well.  That's why we made
              it easier to build apps that are truly excellent.
            </p>
          </div>

          <div className="column col-12">
            <h5>Examples</h5>
            <Grid width="15em">
              <LayoutExampleCard path="example/layout" />

              <Card>
                UI Components
              </Card>
              <Card>
                Reactors
              </Card>
              <Card>
                State Machines
              </Card>
              <Card>
                Hotkeys
              </Card>
              <Card>
                Styles
              </Card>
            </Grid>

            <Giants />
          </div>
        </div>
        <div className="column col-6 col-md-12">
          <AboutPlum/>
        </div>
      </div>

    </DocsLayout>

  }
}
function Giants() {
  return <div className="mt-4"> <h4>...on the shoulders of giants</h4>
    <a target="_blank" href="https://en.wikipedia.org/wiki/Standing_on_the_shoulders_of_giants">https://en.wikipedia.org/wiki/Standing_on_the_shoulders_of_giants</a>

    <p>Special thanks to these projects for inspiration:</p>
      <ul>
        <li><a target="_blank" href="https://developer.mozilla.org">MDN web docs</a></li>
        <li><a target="_blank" href="https://github.com/CurtisHumphrey/react-keyboard-shortcuts">react-keyboard-shortcuts</a></li>
        <li><a target="_blank" href="https://github.com/jxnblk/react-css-grid">react-css-grid</a></li>
      </ul>

    <p>... and to these dependencies (runtime/dev-time):</p>
      <ul>
        <li>React-media-queries?</li>
        <li>The venerable Mousetrap  (🔪🐀 thanks Craig!) </li>
        <li>Webpack</li>
        <li>Neutrino</li>
        <li>Spectre.css</li>
        <li>React, React-Router, Jest, Enzyme</li>
        <li>...and too many others to call out individually</li>
      </ul>
  </div>
}

@withRouter
@withStateMachine
class LayoutExampleCard extends React.Component {
  // x it detects its "base route" - as matched by a parent router
  // x it has a (relative) 'path' prop, used for route-detection and opening its matched panel
  // x it detects when being opened in a new tab, pushing the context-path into history and triggering an Open event
  // x it pushes the target path into history when Opening
  // ? it does history.back() during a Close transition, if the path is still current
  // it detects when a route-change is closing the panel, triggering a Close event

  static keyboard = { // only to do this when the card is open
    esc: {
      priority: 1,
      handler(e) {
        if (this.hasState("open")) {
          Reactor.dispatchTo(this._stateRef.current, new CustomEvent("back", {bubbles:true, detail: {debug:0}}));
        }
      }
    }
  };

  componentDidUpdate(prevProps, prevState) {
    const {
      history,
      match:{path:routeContext},  // the matched part of the current url (route nesting context)
    } = this.props;
    const {path} = this.props;

    const currentUrl = this.getPath();
    // const myTargetUrl = routeContext + path;

    // if (!this.knownUrl) { // first mount
      if (this.isLocationAtTargetPath() && history.length == 1) {
        console.warn("opening panel via bookmark");

        history.replace(routeContext);
        Reactor.dispatchTo(this._stateRef.current, new CustomEvent("open", {bubbles:true, detail: {debug:0}}));
      // }
    } else {
      let priorPath = this.getPath(prevProps.location);
      let nextPath = this.getPath(this.props.location);
      let {currentState} = this.state || {};

      let priorState = prevState.currentState;
      let nextState = this.state.currentState;

      let stateDidChange = (!priorState || priorState !== nextState);
      if (stateDidChange) console.log(`state is changing ${priorState} -> ${nextState}`);

      let pathDidChange = (!this.knownUrl || priorPath !== nextPath)
      if (pathDidChange) {
        console.log("path changing", {nextPath, currentState});

        if (this.isLocationAtTargetPath(prevProps.location) && this.hasState("open")) {
          Reactor.dispatchTo(this._stateRef.current, new CustomEvent("back", {bubbles:true, detail: {debug:0}}));
        } else if (this.isLocationAtTargetPath() && !this.hasState("open")) {
          Reactor.dispatchTo(this._stateRef.current, new CustomEvent("open", {bubbles:true, detail: {debug:0}}));
        }
      } else {
        console.log("path NOT changing", {priorPath, nextPath, currentState, knownUrl: this.knownUrl})
      }
      // console.log({prevProps, prevState});
      // console.log({props: this.props, state:this.state});
    }
    this.knownUrl = currentUrl;
  }
  isLocationAtTargetPath(location=this.props.location) {
    const myTargetUrl = this.targetUrl();

    return (this.getPath(location).indexOf(myTargetUrl) === 0)
  }

  getPath(location=this.props.location) {
    const {pathname, search, hash} = location;
    const p = pathname + search + hash;

    return p;
  }

  targetUrl() {
    const {path, match:{path:routeContext}} = this.props;
    const myTargetUrl = routeContext + path;

    return myTargetUrl;
  }

  openCard = (event) => {
    const {history} = this.props;
    if (!this.isLocationAtTargetPath()) {
        history.push(this.targetUrl());
    }
  };

  closeCard = () => {
    const {history} = this.props;
    if (this.isLocationAtTargetPath()) {
      history.go(-1);
    }
  };
  closeOnPageClick = (e) => {
    this.transition("back")
  }

  debugState = 0;
  render() {
    const {State} = this.constructor;
    const {match, location, history} = this.props;

    console.log({history});
    let open = [null, "open", this.openCard]
    return <div>
      <State name="default" transitions={{click: open, "open": open}} />
      <State name="open" transitions={{back: [ null, "default", this.closeCard ]}} />
      {this.hasState("open") && <Subscribe debug={1} pageClicked={this.closeOnPageClick} />}

      <Card>
        Layouts - {this.state.currentState}
      </Card>
      <RelativeRoute path="/example/layout" component={LayoutExample} />
    </div>
  }
}