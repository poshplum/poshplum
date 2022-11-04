import TopMenuLayout, {Menu, Title} from "../components/layouts/topmenu";
import AboutLayouts from "./AboutLayouts";
import React, {Component} from "react";
import plumLogo from "../aPoshPlum.svg";
import Layout from "../components/layout";
import {Link} from "react-router-dom";

export default class DocsLayout extends Component {
  render() {
    let {children} = this.props;
    return <TopMenuLayout>
        <Menu>

            <Link to="/">
            <img
                        src={plumLogo}
                        class="plum logo"
                    alt="Posh Plum logo"
                    width="40" height="40"
                    />
            </Link>
        <Link to="/layouts">Layouts</Link>
        <Link to="/about" className="ml-4">About Posh Plum</Link>
      </Menu>

      {children}
    </TopMenuLayout>

  }
}



