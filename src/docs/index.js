import React from "react";
import {render} from "react-dom";
import TopMenuLayout, {Menu, Title} from "../components/layouts/topmenu";
import AboutLayouts from "./AboutLayouts";
import {Switch} from "react-router-dom";
import DocsLayout from "./DocsLayout";
import AboutPlum from "./AboutPlum";
import {Card} from "../components/Cards";
import Grid from "../components/Grid";
import RelativeRoute from "../helpers/RelativeRoute";
import Portal from "../helpers/Portal";
import {Panel} from "../components/Panel";
import LayoutExample from "./examples/LayoutExample";


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
              <Card link="/example/layout">
                Layouts
                <RelativeRoute exact path="/example/layout" component={LayoutExample} />
              </Card>
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

