import React from 'react';
import Layout from "./layout";

const Title = Layout.namedSlot("Title")
const Icon = Layout.namedSlot("Icon")
const Header = Layout.namedSlot("Header")
const Body = Layout.defaultSlot("Body")
const Footer = Layout.namedSlot("Footer")

export default class Panel extends Layout {
  static Title = Title;
  static Icon = Icon;
  static Header = Header;
  static Body = Body;
  static Footer = Footer;

  static slots = {Title, Icon, Header, Body, Footer};



  // static Title = Title;
  // static Icon = Icon;
  // static Header = Header;
  // static Body = Body;
  // static Footer = Footer;

  render() {
    let {className="", ...otherProps} = this.props;
    let {Title, Icon, Header, Body, Footer} = this.slots;

    return <div role="main" className={`panel ${className}`} {...otherProps}>
      {Title && <div className="panel-title">{Icon}<h2>{Title}</h2></div>}
      {Header && <div className="panel-header">{Header}</div>}
      <div className="panel-body">
        {Body}
      </div>

      {Footer && <div className="panel-footer">{Footer}</div>}
    </div>
  }
}