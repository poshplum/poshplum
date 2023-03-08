import React from "react";
import { useState } from "preact/hooks";
import preactLogo from "./assets/preact.svg";
import "./docs.css";
import "./scss/app.scss";
import { MD } from "./MD";

//!!! todo: make this into a good docs site
export class Docs extends React.Component {
    render() {
        return (
            <>
                <h1>Posh Plum Docs</h1>
                Documenting the components and functionality of this library
                <MD
                    className="card pb-3 mt-4 text-start border border-success rounded-2"
                    children={`
TODO: import existing docs material 

TODO: review and identify undocumented components & functionality.

TODO: generate & deploy to github pages

`}
                />
            </>
        );
    }
}
