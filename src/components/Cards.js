import React, {Component} from 'react';

import map from 'lodash/map';
import keys from 'lodash/keys';
import {Link} from 'react-router-dom';

// import {Route, withRouter, Link} from 'react-router-dom';
import PropTypes from 'prop-types';
import Layout from "./layout";
import matchChildType from "../helpers/matchChildType";

let Title = Layout.namedSlot("Title").withMarkup(({className="", children, ...props}) => {
  return <div key="title" className={`mr--4 card-title ${className}`} {...props}>
    <h6>
      {children}
    </h6>
  </div>
});
// console.log("Title is ", Title, Title.displayName);

let Icon = Layout.namedSlot("Icon").withMarkup(({className="", icon, children, ...props}) => {
  return <div key="icon" className={`chip icon pop-left zero-height ${className}`} {...props}>
    {icon || children}
  </div>
});

const HeaderRight = Layout.namedSlot("HeaderRight").withMarkup(({
    style={},
    className="",
    children,
    ...moreProps
  }) => {
    const defaultFloatClass = className.match(/\bfloat-/) ? "": "float-right ";
    return <div className={`header-right ${defaultFloatClass}${className}`} {...moreProps}>{children}</div>
  }
);

let Body = Layout.defaultSlot("Body").withMarkup(({className="", children, ...props}) => {
  // console.log("body children:", children)
    return <div className={`card-body ${className}`} {...props}>
      {children}
    </div>
});

let Footer = Layout.namedSlot("Footer").withMarkup(({className="", ...props}) => {
  return <div className={`card-footer footnote ${className}`} {...props}>
    {props.children}
  </div>
});

let Label = Layout.namedSlot("Label").withMarkup(({
    className="chip pop-right",
    as:As="div",
    style,
    children
}) => {
  return <As className={`zero-height card-label ${className}`}
    {...{style}}>
      {children}
  </As>;
});

// Cards.Route = ({className="",children}) => <div className={`chip pop-right ${className}`}>{children}</div>;
// Cards.Route.displayName="Cards.Route";

export class Card extends Layout {
  static Title = Title;
  static Icon = Icon;
  static HeaderRight = HeaderRight;
  static Body = Body;
  static Footer = Footer;
  static Label = Label;
  static slots = {Title, Icon, HeaderRight, Body, Footer, Label};

  constructor() {
    super()
    this._link = React.createRef()
  }
  render() {
    let {active, compact, tabIndex="0", onClick, item, debug, match, children, className="", link, render, ...otherProps} = this.props;
    if (render) {
      if(!item) {
        throw new Error("Cards.Card requires an 'item' prop when using the 'render' prop.")
      }
      children = render(item)
    }
    if (debug) debugger;
    let {Title, Icon, HeaderRight, Body, Footer, Label} = this.slots;

    if (compact) className += " compact";
    if (link && !onClick) {
      onClick = () => {
        this._link.current && this._link.current.context.router.history.push(link)
    } };

    // let clickFn = (e) => { if (cardItemClicked) cardItemClicked(item) };
    const showScreaderLink = link && <Link to={link} ref={this._link} className="screader">{Title || "open card"}</Link>;
    let card = <div {...otherProps} tabIndex={tabIndex} onClick={onClick} className={`card ${className} ${active ? "active" : ""}`}>
      { (Icon || Title || Label ) && <div key="header" className="card-header">
        {Icon}
        {Label}
        {Title}
        {HeaderRight}
        {link && Title && showScreaderLink}
      </div> || null}
      {Body}
      {link && !Title && showScreaderLink}
      {Footer}
    </div >;

    return card;
  }
};

const Cards = {};
Cards.List = class CardsList extends Component {
  card(singleItem, i) {
    let {Card} = this.constructor;
    if (!Card)
      throw new Error("Cards.List: no card found; needs a rendered <Card> (or subclass) element, \n"+
        "or a card(item) method to render a Card (or a subclass of Card), given an item...\n" +
        "or a static Card property pointing to a component that renders a Card/card subclass.");

    const {totalSize="-1"} = this.props;

    return <Card aria-setsize={totalSize} aria-posinset={i} role="listitem" key={singleItem.id} item={singleItem} />
  }
  empty() {
    return null;
  }
  render(props = this.props) {
    let {
      items,
      data={},
      staticContext,
      // itemRoute,
      children=[],
      debug,
      totalSize="-1",
      card:CardComponent,
      footer,
      pages,
      pagesize,
      ...moreProps
    } = props;

    if (!items && data.items) items = data.items;
    // if (!items) throw new Error("no items");

    let cardChild = matchChildType("Card", children, Card)[0];

    let pageLayoutChild = matchChildType("Cards.Page", children)[0];
    if (pageLayoutChild && !pageLayoutChild.props.render)
      throw new Error("Cards.Page needs a render prop - a function taking an array of components and returning a rendered page");


    let count = keys(items).length;
    if(debug) debugger;

    let emptyDisplay = matchChildType("Cards.Empty", children)
    if (! emptyDisplay.length)
      emptyDisplay = [ this.empty() ];

    let hasEmptyTreatment = true ;// !! emptyDisplay.length

    let addItem = matchChildType("Cards.Add", children);

    function paginator(pageCallback) {
      let i = 0;
      let thisPage = [];
      let results = [];
      let pageNumber;
      map(items,(singleItem) => {
        // collect this card onto the page
        pageNumber = Math.floor(i/pagesize)+1;
        // console.log("page", pageNumber);
        let isOnSelectedPage = ( pages=="all" ? true :

            (Math.floor(pages)) == pageNumber  // page match?
        )
        if (isOnSelectedPage) thisPage.push(singleItem);

        i = i + 1;
        if( i % pagesize == 0 && thisPage.length) {
          // flush the prior page
          // alert("flushing")
          let pageComponents = pageCallback(thisPage, pageNumber);

          results.push( pageLayoutChild.props.render({cards: pageComponents, pageNumber}) );
          thisPage = [];
        }
      });

      if (thisPage.length) {
        // alert("flushing at end")
        let pageComponents = pageCallback(thisPage);
        results.push( pageLayoutChild.props.render({cards: pageComponents, pageNumber}) );
      }
      return results;
    }

    let cloner = (item, i) => {
      let {props, type:ChildCard} = cardChild;
      return <ChildCard aria-setsize={totalSize} aria-posinset={i} role="listitem" key={item.id} {...{item, ...props}} />
    }
    let listItems = (items, p) => { return map(items,
      (singleItem, pi) => {
        const i = (p * (pagesize||0)) + pi;
        return CardComponent ? <CardComponent aria-setsize={totalSize} aria-posinset={i} role="listitem" key={singleItem.id} item={singleItem} />
          : cardChild ? cloner(singleItem, i)
          : this.card(singleItem, i)
      }
    )};

    let outputPages;
    if (pageLayoutChild) outputPages = paginator(listItems)
    else outputPages = listItems(items, 0);

    // cardChild = cardChild.type;
    return [<div role="list" {...moreProps}>
      {addItem}
      {outputPages}
    </div>, emptyDisplay]
  }
}
Cards.List.propTypes = {
  items: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  card: PropTypes.oneOfType([PropTypes.func])

  // itemRoute: PropTypes.func.isRequired
}

Cards.Card = Card;

// Cards.Route = ({className="",children}) => <div className={`chip pop-right ${className}`}>{children}</div>;
// Cards.Route.displayName="Cards.Route";


Cards.Title = function({className="", ...props}) {
  return <div key="title" className={`mt--2 ml-2 mr--4 card-title $className`}>
    <small><h4>
      {props.children}
    </h4></small>
  </div>
};
Cards.Title.displayName="Cards.Title";

Cards.Empty = function({children,className="", ...props}) {
  return <div className={`${className} 空空兄珍`} {...props}>{children}</div>
};
Cards.Empty.displayName="Cards.Empty";

// Cards.Add = function({label, ...props}) {
//   return <div className="text-right mt--6 "><PlusThingy small {...{label, ...props}} /></div>
// };
// Cards.Add.displayName="Cards.Add";

export default Cards;