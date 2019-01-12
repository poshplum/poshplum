import TopMenuLayout, {Menu, Title} from "../components/layouts/topmenu";
import AboutLayouts from "./AboutLayouts";
import React, {Component} from "react";
import Layout from "../components/layout";
import {Link} from "react-router-dom";

export default class DocsLayout extends Component {
  render() {
    let {children} = this.props;
    return <TopMenuLayout>
      <Menu>
        <Link to="/"><img src="./aPoshPlum.svg" style={{height: "2em"}} /></Link>
        <Link to="/layouts">Layouts</Link>
      </Menu>

      {children}
    </TopMenuLayout>

  }
}



