import {Component} from "react";
import Layout from "../layout";

export const Title = Layout.namedSlot("Title");
export const Menu = Layout.namedSlot("Menu");
export const Body = Layout.defaultSlot("Body");

export default class TopMenuLayout extends Layout {
  static Menu = Menu;
  static Title = Title;
  static Body = Body;
  static slots={Menu,Title,Body};

  render() {
    let slots = this.slots;

    // uses Spectre.css classes + Plum's style enhancements.

    return <div className="page">
      <nav id="#app-header" className={`panel-header navbar noPrint`}>
        <section className="navbar-section">
          {slots.Menu}
        </section>
      </nav>

      <main>
        <h1>{slots.Title || "untitled page"}</h1>

        <div className="page-body">
          {slots.Body || "empty body area"}
        </div>
      </main>
    </div>
  }
};
