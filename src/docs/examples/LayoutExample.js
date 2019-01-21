import {Component} from "react";
import {render} from "react-dom";
import React from "react";
import CodeExample from "../../components/CodeExample";
import Portal from "../../helpers/Portal";
import Panel from "../../components/Panel";
import {Card} from "../../components/Cards";
import Grid from "../../components/Grid";
import {Link} from "react-router-dom";

export default class LayoutExample extends Component {
  render() {

    return <Portal>
      <Panel className="fixed-bottom-right">
        <Panel.Title>
          <img src="/aPoshPlum.svg" alt="" style={{height: "3em", float:"left", position:"relative", top:"-1em", left:"-0.6em", marginBottom:"-1em", marginRight:"-0.66em"}}/><h4>Layout Example</h4>
        </Panel.Title>

        <h5>Card Layout</h5>
        <p>A card gives a simple example of a layout in action. </p>
        <Grid>
          <div><Card>One card</Card></div>
          <div><Card>Two card
            <Card.Footer>This one has a footer.</Card.Footer>
          </Card></div>
        </Grid>

        <p>Layouts offer consistency, but they can also give good flexibility.
          <Card compact className="d-inline-block" style={{backgroundColor: "#f99"}}>Red card</Card> and
          <Card className="d-inline-block" compact style={{backgroundColor: "#99f"}}>Blue card</Card> have
          an inline className, a <code>compact</code> prop that translates to another className, and they use
          inline styles for one-off treatment.  The Card layout gives you flexibility to do any of these.
        </p>

        <h5>Panel Layout</h5>

        <p>This Layout Example panel - the same panel used for other examples, demonstrates another
          layout, with title, a scrollable body (when the content gets tall enough) and a footer area.
          This layout comes with functionality including a route, a keyboard shortcut (Esc to close)
          and open/close animations.  Layouts can do anything a React component can be made to do.
        </p>

        <p>When you make a layout, you can enforce utter consistency, or you can present differently
          depending on usage conditions.  It's all up to you.
        </p>

        <h5>Page-level and Composite Layouts</h5>

        <p>Each page on this site uses a TopMenuLayout, with layout composition for consistent
          menu content across different pages.
        </p>

        <Panel.Footer>
          <Link className="btn btn-primary" to="/layouts">More about Layouts</Link>
        </Panel.Footer>
      </Panel>
    </Portal>

  }
}