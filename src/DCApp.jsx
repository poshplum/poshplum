import React from "react";
import { BrowserRouter } from "react-router-dom";
import { render } from "react-dom";
import { Route, Switch } from "react-router-dom";
import Reactor from "./components/Reactor";
import { DCAppLayout } from "src/components/layouts/DCAppLayout";
import AboutPlum from "./docs/AboutPlum";
import AboutLayouts from "./docs/AboutLayouts";
import ReactorExample from "./docs/examples/ReactorExample";
import { LayoutExample } from "./docs/examples/LayoutExample";
import { DocsLayout } from "./docs/DocsLayout";
import { Portal } from "./components/Portal";
import { ProjectMock } from "src/components/layouts/ProjectMock";
import { WorkingGroupMock } from "./components/layouts/WorkingGroupMock";

const prototypeLayout = import.meta.env.MODE == "prototype"; 
@Reactor
export class DCApp extends React.Component {
    render() {
        return (
            <BrowserRouter>
                <Portal.Registry />
                {prototypeLayout ? (
                    <DCAppLayout>
                        <Switch>
                            <Route exact path="/myStuff"
                                    // component={} />
                            >My Stuff - TODO</Route>
                            <Route path="/projectPage" component={ProjectMock} />
                            <Route path="/wgPage" component={WorkingGroupMock} />
                            {/* <Route
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
                ) : (
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
                )}

            </BrowserRouter>
        );
    }
}
