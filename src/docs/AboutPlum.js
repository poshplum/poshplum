import {Component} from "react";
import {render} from "react-dom";
import React from "react";
import CodeExample from "../components/CodeExample";

export default class AboutPlum extends Component {
  render() {
    return <React.Fragment><h4>About A Posh Plum</h4>

      <p>A Posh Plum is a small library for React application development. Feel free to use more
        of it, or feel free to use less. Plum provides low-syntax, high-leverage semantic
        components that are <i><b>easy to understand, easy to reuse, and easy to maintain</b></i>.
      </p>
      <CodeExample language="shell">{`$ yarn add plum`}</CodeExample>

      <p>The <code>plum</code> package offers optional material design elements such
        as cards and panels, with semantic stylesheets courtesy of Spectre.css. Our
        UI elements all use Plum's Layouts primitive, with Spectre for styling. You can
        use them as-is, or copy their pattern to help you refactor any existing UI code
        and improve your maintainability.
      </p>

      <p>Import just the files you need; your code bundler will work things out from there.</p>
      <CodeExample language="es6">
        {`import Layout from 'plum/layout';
import TopMenu from 'plum/layouts/topmenu';
import LeftMenu from 'plum/layouts/leftmenu';
import Panel from 'plum/ui/panel';
import Card from 'plum/ui/card';`}
      </CodeExample>

      <p>A Posh Plum seeks to be principle-based, but dogma-free 🚫🐕‍🤰. We believe in quality by
        design, in unit-testing and real-world results, and we reject cargo-cult rules.  As
        Larry says: there's more than one way to do it.  We use existing platform-, language- and library-level
        features where they're useful, and you can too.
      </p>

      <p>Our target developer experience is for things to Just Work<sup>🇹️🇲</sup>.  Any disfunctional
        setup or usage should produce clear, actionable console warnings or errors.  If you find a case that's
        not easily resolved by responding to those console messages, or a use case that seems harder
        than necessary, please submit your minimal test case to demonstrate it (actual fixes are also
        welcome).
      </p>

    </React.Fragment>;
  }
}

