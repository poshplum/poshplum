import React from "react";
import Layout from "src/components/layout";

import CodeExample from "../components/CodeExample";
import { Card } from "../components/Cards";
import { Link } from "react-router-dom";
import { Portal } from "../components/Portal";

export default class AboutLayouts extends React.Component {
    render() {
        const {
            PageTitle,
            components: {
                Sidebar: { SidebarSection },
            },
            [`SidebarSection:about-layout`]: SectionNavItem,
        } = Portal;

        return (
            <div>
                <PageTitle>Layouts</PageTitle>

                <SidebarSection id="about-layout" title="Layout Sidebar">
                    <SectionNavItem>NavItem 1</SectionNavItem>
                    <SectionNavItem>NavItem 2</SectionNavItem>
                </SidebarSection>

                <div className="container row">
                    <div className="col-4 col-xl-6 col-md-12 p-3">
                        <p>
                            Posh Plum provides a <code>Layout</code> primitive
                            that packages the "render props" or "named slots"
                            pattern in a <strike>different</strike> nicer style,
                            making UI code easier to read, write and maintain.
                            It works with React and React-Native.
                        </p>

                        <ul>
                            <li>Less need for props tunneling</li>
                            <li>
                                Reduce inter-component chatter and call stacks
                                as compared to "render props" pattern
                            </li>
                            <li>
                                Help keep component props tiny and minimize
                                syntactical nesting
                            </li>
                        </ul>

                        <p>
                            Plum includes some page-level semantic layouts and
                            UI-widgets such as Cards that also use layouts. Plum
                            also makes it easy for you to create your own layout
                            components and improve your application's
                            maintainability.
                        </p>

                        <h3>Using Plum Layouts</h3>

                        <p>
                            To use any Plum layout, use the layout's JSX tag and
                            the JSX tags of the layout's named slots. Place any
                            markup within these boundaries, and the layout is
                            rendered just as you'd expect.
                        </p>
                        <CodeExample>
                            {`// import Card from 'plum/cards';

<Card>
  <Card.Icon>🔥</Card.Icon>
  <Card.Title>Urgent item</Card.Title>
  <Card.Label className="chip pop-right bg-error">Problems</Card.Label>

  <p className="text-error text-bold">
    An item needing prompt attention</p>
</Card>`}
                        </CodeExample>

                        <Link class="button btn btn-primary" to="/about">
                            About Posh Plum
                        </Link>
                    </div>

                    <div className="col-4 col-xl-6 col-md-12 p-3">
                        <h4>Example Cards</h4>

                        <p>
                            Each card here is rendered with a Card layout. See
                            the JSX example{" "}
                            <span className="hide-md">on the left</span>
                            <span className="show-md">above</span> for sample
                            input.
                        </p>
                        
                        <div  className="d-grid gap-3">

                        <Card>
                            <Card.Icon>❤️</Card.Icon>
                            <Card.Title>An active card</Card.Title>
                            <Card.Label>Super</Card.Label>

                            <p className="card-text">
                                Card body paragraph and a{" "}
                            </p>

                            <Card.Footer>    
                                <a href="#" class="btn btn-sm btn-transparent stretched-link">Go somewhere</a>
                            </Card.Footer>
                        </Card>
                        <Card className="active">
                            <Card.Icon>🍭</Card.Icon>
                            <Card.Title>Simple cards</Card.Title>
                            <Card.Label className="chip pop-right bg-success">
                                Sweet
                            </Card.Label>
                        </Card>
                        <Card>
                            <Card.Icon>⏱️</Card.Icon>
                            <Card.Title>Waiting for response</Card.Title>
                            <Card.Label>Pending</Card.Label>
                            <Card.Footer>
                                3 approvals pending from management team
                                <div class="progress h-2 mt-2">
                                    <div class="progress-bar h-32" role="progressbar" style="width: 25%;" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100">25%</div>
                                </div>
                            </Card.Footer>
                        </Card>
                        <Card>
                            <Card.Icon>🔥</Card.Icon>
                            <Card.Title>Urgent item</Card.Title>
                            <Card.Label className="chip pop-right bg-error">
                                Problems
                            </Card.Label>
                            <p className="text-error text-bold">
                                An item needing prompt attention
                            </p>
                        </Card>

                        </div>
                        <br />

                        <h4>How is a layout rendered?</h4>

                        <p>
                            A Layout is simply a component that places
                            already-rendered semantic content into a JSX
                            "envelope", merging your non-Layout content with
                            layout markup. The layout's internal code simply
                            categorizes the semantic contents so they're all
                            available for insertion to your markup envelope. 💌️
                        </p>

                        <p>
                            Plum's layouts reduce visual complexity of your
                            code, making it easier to work on. You'll spend less
                            time counting{" "}
                            <code>
                                {"<"}brackets and {"{"}braces{"}"} and {"{"}more
                                braces{"}"} and brackets {"/>"}
                            </code>
                            .
                        </p>

                        <p>
                            Check out React Devtools' view of the cards above,
                            where you'll easily see the boundaries between
                            layouts and slot content.
                        </p>

                        <p>
                            Here's a sample Article's layout markup (see
                            "Creating Plum Layouts"
                            <span className="hide-xl">
                                , on the right side,{" "}
                            </span>
                            <span className="show-xl">&nbsp;below </span> for
                            the rest of the setup):
                        </p>

                        <CodeExample language="jsx">
                            {`<div>
  <h1>{slots.Heading}</h1>
  <div className="float-right text-italic">
    {slots.Author}
  </div>
  {slots.Subhead && <h2>
    {slots.Subhead}
  </h2>}

  {slots.Body}
     {/* ^^^^ default slot content goes here */}
</div>`}
                        </CodeExample>

                        <h4>When to keep using render props</h4>

                        <p>
                            <b>TLDR: when it makes sense in your situation. </b>
                            With Layouts, you can get a dynamic item into your
                            component, and use it to render content within a{" "}
                            <code>{`<Layout><Slot/>...<Slot/></Layout>`}</code>{" "}
                            block - in these cases, it's simpler to skip the use
                            of render props.
                        </p>

                        <p>
                            Still, you may find render props can be useful at
                            times and can be applied to any layout or non-layout
                            component. Deferring React rendering until it's
                            contextually relevant (perhaps based on layout usage
                            conditions or during interactions that are
                            controlled by a layout's code) can be a case that
                            fits this mould well. Your callback would then build
                            presentation elements just in time for when it's
                            needed.
                        </p>

                        <p>
                            On the other hand, early-rendering of hidden content
                            can be combined with JS and/or CSS-triggered reveal,
                            pushing down certain behaviors to be handled
                            directly by the browser, perhaps with a lightweight
                            "add-class" script.
                        </p>

                        <p>
                            <b>
                                Running javascript for generating React elements
                                and reconciling DOM aren't free operations.
                            </b>{" "}
                            Styling contents to be shown/hidden (:focus-within,
                            anyone?) using non-React techniques can eliminate
                            some React render loops and reduce battery
                            consumption. Use- cases can rule the day.{" "}
                            <i>
                                When in doubt, run your profiling tool on your
                                use-cases.
                            </i>
                        </p>
                    </div>

                    <div className="col-4 col-xl-12 col-md-12 p-3">
                        <h4>Creating Plum Layouts</h4>

                        <p>
                            Creating a layout is as easy as pie. 🥧 First,
                            define your slots.
                        </p>
                        <CodeExample>{`const Heading = Layout.namedSlot("Heading");
const Subhead = Layout.namedSlot("Subhead");
const Author = Layout.namedSlot("Author");
const Body = Layout.defaultSlot("Body");
`}</CodeExample>
                        <p>
                            Include a <code>defaultSlot</code> (here, thats the{" "}
                            <code>Body</code> slot). Second, register the slots
                            in a Layout, rendered the way you wish.
                        </p>

                        <CodeExample>
                            {`class Article extends Layout {
  static slots = {Heading, Subhead, Author, Body};

  render() {
    // get instance-level slot content
    let slots = this.slots;  // these were already rendered

    // your markup that lays out the slot content
    return <div>
      <div class="float-right"><h4>Author: {slots.Author}</h4></div>
      <h2>{slots.Heading}</h2>
      <h3>{slots.Subhead}</h3>
      {slots.Body}
    </div>
  }
}
`}
                        </CodeExample>

                        <p>
                            The layout is just a React component. In the
                            render() method, <code>this.slots</code> contains
                            the slotted content. Make sure you render all the
                            slot content in any way making sense for your
                            layout.{" "}
                        </p>

                        <p>
                            See "How is a layout rendered?"{" "}
                            <span className="hide-xl">, center column, </span>
                            <span className="show-xl">above&nbsp;</span>
                            for JSX that might fit the 🦆 bill here.
                        </p>

                        <p>
                            You control the semantics of your layout, and you
                            can extend it in any way that's helpful for you.
                            Plum's <code>Layout</code> component simply 🗃️
                            organizes the slot content for you to place within
                            the layout markup. You can add props, new slots or
                            conditional rendering as needed. See below for more
                            advanced slot-rendering.
                        </p>

                        <h4>Reuse the Layout</h4>

                        <CodeExample>
                            {`<Article>
  <Article.Title>React Tips</Article.Title>
  <Article.Author>Jimmy James</Article.Author>

  <p>Great article text</p>
  <p>More great article text</p>
</Article>
{/* 🛀 lather, rinse and repeat 🔁 */}

const {Title, Author} = Article;
<Article>
  <Title>Skinning a cat 🐈</Title>
  <Author>Sansato</Author>

  <p>There's more than one way to do it.</p>
</Article>
`}
                        </CodeExample>
                        <p>
                            The paragraphs here are collected into the{" "}
                            <code>defaultSlot</code> because they don't match
                            any of the other slot types. Here, they'll render
                            with the layout's <code>{`{slots.Body}`}</code>
                            <span className="hide-xl">
                                &nbsp;(see center column).
                            </span>
                            <span className="show-xl">
                                &nbsp;(see "How is a layout rendered?", above).
                            </span>
                        </p>

                        <h4>Custom Slot Rendering</h4>

                        <p>
                            Advanced layouts can become complicated. To manage
                            this problem, you can feel free to use any
                            techniques you already know from React - including
                            use of a functional or class component for rendering
                            any slot.
                        </p>

                        <p>
                            Separating the markup for individual layout slots
                            can help keep things easy to manage as your markup
                            size and/or team size increases. Layout's{" "}
                            <code>withMarkup()</code> helper conspires 🕵️🕵️ to
                            make this case easy. Our Card component uses this
                            technique - check 'em out with React Devtools!
                        </p>

                        <CodeExample language="jsx">
                            {`const Byline = namedSlot("Byline").withMarkup(
  (props) => <div>
    {/* all the markup needed for this slot, so it doesn't have to
      contribute to bloat within Article's render() method
    */}
    <div className="fancy" data-fu={props.bar}>{children}</div>
  </div>
)`}
                        </CodeExample>

                        <p>
                            Remember to render the{" "}
                            <code>
                                {"{"}children{"}"}
                            </code>
                            . The layout will need <code>Byline</code> in its{" "}
                            <code>static slots</code> declaration and{" "}
                            <code>{`{Byline}`}</code> somewhere in its{" "}
                            <code>render()</code> function.
                        </p>

                        <p>
                            In this example, the{" "}
                            <code>
                                {`<`}Byline /{`>`}
                            </code>{" "}
                            functional component applies the "fancy" markup at
                            each point of usage, then the result is inserted
                            efficiently into the Layout's envelope at just the
                            right spot.
                        </p>
                        <CodeExample>
                            {`<Article>
  <Author>Abraham Lincoln</Author>
  <Byline>Our favorite president</Byline>
</Article>`}
                        </CodeExample>
                    </div>
                </div>
            </div>
        );
    }
}