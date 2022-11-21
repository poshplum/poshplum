import React from "react";
import { BrowserRouter } from "react-router-dom";
import { render } from "react-dom";
import AboutLayouts from "./AboutLayouts";
import { Route, Switch } from "react-router-dom";
import ReactorExample from "src/docs/examples/ReactorExample";
import AboutPlum from "./AboutPlum";
import Reactor from "../components/Reactor";
import { DocsLayout } from "./DocsLayout";
import { Portal } from "../components/Portal";
import { LayoutExample } from "./examples/LayoutExample";

@Reactor
export class DocsApp extends React.Component {
    render() {
        return (
            <BrowserRouter>
                <Portal.Registry />

                <DocsLayout>
                    <Switch>
                        <Route exact path="/about" component={AboutPlum} />

                        <Route path="/layouts" component={AboutLayouts} />
                        <Route
                            path="/examples/layouts"
                            component={LayoutExample}
                        />
                        <Route
                            path="/examples/reactor"
                            component={ReactorExample}
                        />

                        <Route /* fallback */ path="/" component={AboutPlum} />
                    </Switch>
                </DocsLayout>
            </BrowserRouter>
        );
    }
}
