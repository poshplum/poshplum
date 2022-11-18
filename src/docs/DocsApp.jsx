import React from "react";
import { BrowserRouter } from "react-router-dom";
import { render } from "react-dom";
import AboutLayouts from "./AboutLayouts";
import { Route, Switch } from "react-router-dom";
import ReactorExample from "src/docs/examples/ReactorExample";
import AboutPlum from "./AboutPlum";
import Reactor from "../components/Reactor";
import { DocsLayout } from "./DocsLayout";

@Reactor
export class DocsApp extends React.Component {
    render() {
        return (
            <BrowserRouter>
                <DocsLayout>
                    <Switch>
                        <Route exact path="/about" component={AboutPlum} />
                        <Route path="/layouts" component={AboutLayouts} />
                        <Route
                            exact
                            path="/reactor"
                            component={ReactorExample}
                        />

                        <Route /* fallback */ path="/" component={AboutPlum} />
                    </Switch>
                </DocsLayout>
            </BrowserRouter>
        );
    }
}
