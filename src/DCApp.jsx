import React from "react";
import { BrowserRouter } from "react-router-dom";
import { render } from "react-dom";
import { Route, Switch } from "react-router-dom";
import Reactor from "./components/Reactor";
import { DCAppLayout } from "src/components/layouts/DCAppLayout";
import { Portal } from "./components/Portal";

@Reactor
export class DCApp extends React.Component {
    render() {
        return (
            <BrowserRouter>
                <Portal.Registry />

                <DCAppLayout>
                    <Switch>
                        <Route exact path="/myStuff"
                                // component={} />
                        >My Stuff - TODO</Route>
                        {/* <Route path="/layouts" component={AboutLayouts} />
                        <Route
                            path="/examples/layouts"
                            component={LayoutExample}
                        />
                        <Route
                            path="/examples/reactor"
                            component={ReactorExample}
                        /> */}

                        {/* <Route /* fallback * /   path="/" component={AboutPlum} /> */}
                    
                    </Switch>
                </DCAppLayout>
            </BrowserRouter>
        );
    }
}
