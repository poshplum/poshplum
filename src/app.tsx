import { useState } from "preact/hooks";
import preactLogo from "./assets/preact.svg";
import "./scss/app.scss";
import Panel from "./components/Panel";
import { DocsApp } from "./docs/DocsApp";

export function App() {
    const [count, setCount] = useState(0);

    return (
        <>
            <DocsApp/>
            {false && <Panel>
                <Panel.Icon>
                    {" "}
                    <img
                        src={preactLogo}
                        class="logo preact"
                        alt="Preact logo"
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
