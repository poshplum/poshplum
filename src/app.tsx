import { useState } from "preact/hooks";
import preactLogo from "./assets/preact.svg";
import "./scss/app.scss";
import Panel from "./components/Panel";
import { DocsApp } from "./docs/DocsApp";
import { DCApp } from "./DCApp";


export function App() {
    const [count, setCount] = useState(0);

    return (
        <>
            {/* <DocsApp/> */}
            <DCApp />
            {false && <Panel>
                <Panel.Icon>
                    {" "}
                    <img
                        // src={plumLogo}
                        src={preactLogo}
                        class="plum logo"
                        alt="Posh Plum logo"
                    />
                </Panel.Icon>
                <Panel.Title>Vite + Preact</Panel.Title>
                <button onClick={() => setCount((count) => count + 1)}>
                    count is {count}
                </button>
                <p>
                    Edit <code>src/app.tsx</code> and save to test HMR
                </p>
                <Panel.HeaderRight>
                    Click on the Vite and Preact logos to learn more
                </Panel.HeaderRight>
            </Panel>}
        </>
    );
}
