import { render } from "preact";
import { Docs } from "./docs";
import "./index.css";

render(<Docs />, document.getElementById("app") as HTMLElement);
