import React from "react";
import { BrowserRouter } from 'react-router-dom'
import {render} from "react-dom";
import TopMenuLayout, {Menu, Title} from "../components/layouts/topmenu";
import AboutLayouts from "./AboutLayouts";
import {Route, Switch} from "react-router-dom";
import AboutPlum from "./AboutPlum";


export class DocsApp extends React.Component {
  render() {
    return       <BrowserRouter>

        <Switch>
      <Route exact path="/about" component={AboutPlum}/>
      <Route path="/" component={AboutLayouts}/>
    </Switch>
</BrowserRouter>
  }
}

