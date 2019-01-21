# a-posh-plum

A lightweight application shell giving clean, consistent UI to React apps.

![Cartoon showing a plum with top-hat, bow tie and monocle](./src/aPoshPlum.svg)

Your app is destined for greatness.  A Posh Plum makes it all easier.

## Why?

React lets you control the fine details of a web page. 
You're in control, but you're left having to make all the choices 
(and components) yourself.

A Posh Plum makes it all easier.  Its components provide a responsive web app
that "just works" on mobile or desktop browsers, with menu and page-layout
components and stylesheets based on Spectre.css.  

Plum provides React components ready to use for presenting a material-like UI, 
with your application's objects presented as cards that open incrementally 
and are easy to augment with icons, status indicators and more.  You get to 
think at a higher level and concentrate on your results.

## Quick start:

WARNING - under construction - docs first.  This package is still pre-release.

Getting started is easy:

`> yarn add a-posh-plum`

```
// normal routing with React-router -
<Route exact path="/" component={Home} />
<Route path="/hello" component={Hello} />

// in component files:
import {Card} from 'plum/cards';
import {TopMenuLayout} from 'plum/layouts';

class Home extends Component {
  render() {
    let {MoreMenuItems,Title} = TopMenuLayout.slots;
    
    return <TopMenuLayout>
      <Title>My Posh app</Title>
      <Menu>
        <Link to="/pricing">Pricing</Link>
        <Link to="/terms">Terms of Service</Link>
      </Menu>
      
      <p>This app lets you manage all of your widgets 
        and share them with your friends, ...
      </p> 
    </TopMenuLayout>
  }
}
class Hello extends Component {
  render() { 
    let {partId} = ... // get from route
    let {Menu,Title} = TopMenuLayout;
    return <SideMenuLayout>
      <Title>Hello World</Title>
      <Menu>
        <Link to={`/service/part/{partId}`}>Finding Service</Link>
        <Link to="/terms">Terms of Service</Link>
      </Menu>
      
      <Card>
        <Card.Title>My first Card</Card.Title>
        
        <Card.Body>
          Check out these electronic parts...
        </Card.Body>
      </Card>
    </div>
  }
}
```

## Anatomy of a Plum-based app

Apps built with Plum are based on a mental model you already know: routes, 
pages, layouts and cards.  Plum's UI components give you a refined presentation 
that's easy to apply.

![diagram described above: routes, pages, panels, cards](./plumAnatomy.svg)

Routes map from URLs to pages.  Each page is presented with a layout, and layouts 
are shareable.  Layouts provide consistency and reusability across various pages 
of your app.  They contain named slots, and they package the "render props" 
pattern in a way that inverts control and simplifies syntax.
 
You can make your own layouts (see more below) or use Plum's built-in
layouts for responsive apps:    

 * `<TopMenuBar>`: A simple layout with a standard horizontal menu bar and 
   page-body area.  Use a single menu for your entire app, or choose dynamic 
   menu content that changes with the current page.
   
 * `<LeftMenuBar>`: Another simple layout with a standard vertical menu area 
   on the left (hidden by default on small screens).
   
 * `<Panel>`: A fancier-looking layout that shows extra content or other 
  UI in a floating panel, partially obstructing the background material while
  maintaining the background for the user's mental context.  

Plum's layout components are easy to mix together with your application's 
pages and customize for great reusability. 

To add a page to your app, you simply create a react component, decorated with
a chosen layout.  Its `render()` method declares the content to be inserted into 
the layout.

```
let {Title,Body} = TopMenuBar;
class MyPage {
  render() {
    return <TopMenuBar>
       <Title>My Fine Page</Title>
       <Body>
         <p>this is some body content on my page.  Any HTML I like goes here.</p>
       </Body>
    </TopMenuBar>
  }
}
```

Add the pages into your routing config, and *poof* your 
app's presentation comes together as an integrated unit, with consistency 
baked right in.

  > _He put in his thumb,_  
  > _And pulled out a plum,_  
  > _And said, "what a good boy am I!"_
-- [Mother Goose](https://www.poetryfoundation.org/poems/46973/little-jack-horner-56d2271c5917a)

## Extra Posh

### Blended layout slots 

Need to group a dozen different pages, each sharing a section-level menu?
Plum's `<Layout>`s are easy to compose, thanks to React - this lets you blend
together layout slots for easy reusability.

```
  // -- in MyLayout.jsx:
  import {SideMenuLayout} from 'a-posh-plum/layouts';
  import {NavLink} from 'react-router-dom';

  // reusable section of an app
  class PartsSection extends Component {
    render() {
    let {children} = props;
    let {Menu,Title} = SideMenuLayout;
    return <SideMenuLayout>
      <Menu>
         ... 9 items in shared menu...
      </Menu>
      
      {children}          {/* seamlessly blending Titles from children */}
                          </*   ...or additional MoreMenuItems */}
    </SideMenuLayout>
  } 
}

// reusing the Parts section:
class PartsInstallation extends Component {
  render() { // renders menu items for the layout
    let {Title} = SideMenuLayout;
    return <PartsSection>
      <Title>Parts Installation</Title>
      
      <h2>At our offices</h2>
      ....
      <h2>At your site</h2>
      ...
    </PartsSection>
  }
}

class PartsFinding extends Component {
  render() { // renders menu items for the layout
    let {Title} = SideMenuLayout;
    return <PartsSection>
      <Title>Finding the right parts for your stuff</Title>
      <Menu>
         More menu items
      </Menu>
      
      <h2>By manufacturer</h2>
      ....
      <h2>By model number</h2>
      ...
    </PartsSection>
  }
}
```

In the `<PartsFinding>` component, "More menu items" will be included after 
the 9 menu items from the `<PartsSection>`. 

### Using Plum's material UI

Plum's UI components provide you with a declarative way to make a pixel-perfect
UI that appears to be made with material like paper or cardstock.  You can
place your application's conceptual objects into Plum's UI components, making them
tangible to your app's users.  This gives your app a simple touch-ready interface 
that people understand intuitively.

#### Card

```
import {Card} from 'a-posh-plum/cards'
MyCard = () => <Card>
    <Card.Icon icon="icon-check"/>
    <Card.Title>My thing in a posh Card   </Card.Title>
    <Card.Label>
      Ready
    </Card.Label>
    <Card.Body>
      Awesome Item
    </Card.Body>
    
    <Card.Route path="/items/:id">
      Expanding content when the card is tapped
    </Card.Route>
</Card>
```

The Card subcomponents like `<Card.Label>` are easily auto-completed from your
Javascript-aware editor (IDEA, VSCode), so you can fluently build out your app, one 
auto-completed element at a time.

There's also a `<CardList>` component that takes a collection of items to render
as cards - see its docs for usage.

#### Panel

The Panel component gives an overlay treatment for nested
screens/workflows, such as a master/detail pattern; it responds 
to small or large screens, and helps manage user-attention 
concerns. 

For example, let's say the user is 
viewing a Client summary screen, and they can click one of the 
customer's orders.  To minimize attention churn, we can keep 
the Client Summary screen being displayed as-is, and overlay a  
Panel to show the details of the order - only until the user closes 
it.

```
// in your routes setup (top-level app component):
<Route path="/things" component={ThingList} />
<Route path="/things/:id/edit" component={ThingEditor} />
```

Both routes can match, and both things can be rendered; this helps 
people maintain a conceptual anchor to their location (the Client 
summary screen); viewing an order doesn't change the person's 
notion of "where they are".   

On small screens, the nested workflow is shown in full-screen style; 
a Back button is expected in the upper-left.

```
import {Panel} from 'a-posh-plum/layouts'

class ThingEditor extends Component {
  render() { return <Panel>
    <Panel.Icon src="/bow-tie.png" />
    <Panel.Title>{this.state.title}</Panel>

    ... some form elements ...
  </Panel>
  }
}
```

#### Custom Layouts

Plum's cards and layouts are created with just a couple of simple utilities, which 
you can use to make layouts of your own creation.  Note the use of defaultSlot for 
the Body section.

```
import {namedSlot, Layout} from 'a-posh-plum/util`;

let Title = Layout.namedSlot("Title");
let Sidebar = Layout.namedSlot("Sidebar");
let Body = Layout.defaultSlot("Body");

class MyLayout extends Layout {
  static Title = Title;
  static Sidebar = Sidebar;
  static slots={Title,Sidebar,Body}
  render() {
    let slots = this.slots;
    
    // ... your html markup for this layout...
    return <div>
       <h1 className="title">{slots.Title}</h1> 
          
       <div className="sidebar">{slots.Sidebar}</div>
       <div className="body">
          {slots.Body}
       </div>
     </div>
  }
}
```

This example doesn't specify much styling, but when you make a 
layout, you can control exactly the HTML and styles you want.  

You might think of a layout as an 
envelope for page-level content; in the layout component above, you can configure
exactly the layout of the envelope, and when you insert pages into the 
envelope, the page content shows through the envelope sections ("slots"). 

You can make as many slots as needed for your layout.  Here's a layout that includes
a right-side `<ContextPanel>` area, which can be controlled by your page-level 
components. 

![visual of slots, each with their space in a layout](./plumLayouts.svg)

The layout component can re-order the slot content, and place them exactly where they 
need to achieve its presentation goals.   

```
class Page1 extends Component {
  render() { return <MyLayout>
    <MyLayout.Title>Page 1</MyLayout.Title>

    Check out my sweet page.
    
    <MyLayout.Sidebar>
      <img src="/dessert1.png" />
    </MyLayout.Sidebar>
  </MyLayout>
  }
}

class Page2 extends Component {
  render() { return <MyLayout>
    <MyLayout.Title>AWESOME PAGE!!!</MyLayout.Title>

    This page is chock full of awesome.
    Unmatched children go to the defaultSlot.
    
    <MyLayout.Sidebar>
      <img src="/awesome1.png" />
      <img src="/awesome2.png" />
      <img src="/awesome3.png" />
    </MyLayout.Sidebar>
  </MyLayout>
  }
}
```

## Developing

This repo uses neutrino.js for packaging and development-time operation.
The package.json includes scripts for triggering important actions.

```
> yarn run     // run a UI harness on port 5000 for a web-browser preview
> yarn test    // run tests
> yarn testing // run tests with --watch
> yarn testing-debug // with debugger/inspector for test debugging
> yarn build   // build the package
```

Use [chrome devtools](chrome://inspect) to attach to the Jest tests.

#### Note for Windows-based developers

On Windows + Cygwin, `yarn testing` needs `git` to be in the path, and Cygwin's 
`/usr/bin/git.exe` doesn't fill the need (`Error: spawn git ENOENT`). Making an 
alias or shell script with \` `PATH=/cygdrive/c/Program\ Files/Git/bin:$PATH yarn testing`\` 
(or similar) corrects the error.  See [this issue comment](https://github.com/facebook/jest/issues/3214#issuecomment-312186643) 
for more background.
