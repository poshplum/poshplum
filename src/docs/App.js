import React from "react";
import {render} from "react-dom";
import TopMenuLayout, {Menu, Title} from "../components/layouts/topmenu";
import AboutLayouts from "./AboutLayouts";
import {Route, Switch} from "react-router-dom";
import DocsIndex from "./index";


export default class DocsApp extends React.Component {
  render() {
    return <Switch>
      <Route exact path="/layouts" component={AboutLayouts}/>
      <Route path="/" component={DocsIndex}/>
    </Switch>

  }
}

