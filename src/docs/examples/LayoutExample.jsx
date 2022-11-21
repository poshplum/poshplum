import React, { Component } from "react";
import CodeExample from "src/components/CodeExample";
import { Portal } from "src/components/Portal";
import { Card } from "src/components/Cards";
import Grid from "src/components/Grid";
import { Link } from "react-router-dom";

export class LayoutExample extends Component {
    render() {
        const {
            PageTitle,
            components: {
                Menu: { Menu, SubMenu },
                Breadcrumbs: { Breadcrumb },
            },
        } = Portal;

        return (
            <div>
                <PageTitle>Layout Examples</PageTitle>
                <Breadcrumb>Layouts</Breadcrumb>

                <h5>Card Layout</h5>
                <p>A card is a great example of a layout in action. </p>
                <CodeExample>
                    {`<Card>One card</Card>
<Card>  Two card
    <Card.Footer>This one has a footer.</Card.Footer>
</Card>`}
                </CodeExample>
                <Grid>
                    <div>
                        <Card>One card</Card>
                    </div>
                    <div>
                        <Card>
                            Two card
                            <Card.Footer>This one has a footer.</Card.Footer>
                        </Card>
                    </div>
                </Grid>

                <p>
                    Layouts offer consistency, but they can also give good
                    flexibility.
                    <Card
                        compact
                        className="d-inline-block"
                        style={{ backgroundColor: "#f99" }}
                    >
                        Red card
                    </Card>{" "}
                    and
                    <Card
                        className="d-inline-block"
                        compact
                        style={{ backgroundColor: "#99f" }}
                    >
                        Blue card
                    </Card>{" "}
                    have an inline className, a <code>compact</code> prop that
                    translates to another className, and they use inline styles
                    for one-off treatment. The Card layout gives you flexibility
                    to do any of these.
                </p>

                <CodeExample>{`<Card compact className="d-inline-block" style={{backgroundColor: "#f99"}}>Red card</Card> and
          <Card className="d-inline-block" compact style={{backgroundColor: "#99f"}}>Blue card</Card>
`}</CodeExample>

                <h5>Panel Layout</h5>

                <p>
                    This panel (also used for the other examples) demonstrates
                    another layout, with title, a scrollable body (when the
                    content gets tall enough) and a footer area. If there's no
                    footer provided, then the body area gets more vertical
                    space.
                </p>

                <p>
                    When you make a layout, you can enforce utter consistency,
                    or you can present differently depending on usage
                    conditions. It's all up to you.
                </p>

                <h5>Page-level and Composite Layouts</h5>

                <p>
                    Each page on this site uses a TopMenuLayout, with layout
                    composition for consistent menu content across different
                    pages. Here's its source (see More about Layouts for a
                    detailed walkthrough).
                </p>
                <CodeExample>
                    {`export const Title = Layout.namedSlot("Title");
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
      <nav id="#app-header" className={\`panel-header navbar noPrint\`}>
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
`}
                </CodeExample>

                <Link tabIndex="0" className="btn btn-primary" to="/layouts">
                    More about Layouts
                </Link>
            </div>
        );
    }
}
