import React from 'react';
import Layout from "./layout";

const Title = Layout.namedSlot("Title")
const Icon = Layout.namedSlot("Icon").withMarkup(({className="", children, ...moreProps }) => <span className={`小 ${className}`} {...moreProps}>{children}</span>)
const Body = Layout.defaultSlot("Body")
const Footer = Layout.namedSlot("Footer")

export default class Panel extends Layout {
  static Title = Title;
  static Icon = Icon;
  static Body = Body;
  static Footer = Footer;

  static slots = {Title, Icon, Body, Footer};



  // static Title = Title;
  // static Icon = Icon;
  // static Header = Header;
  // static Body = Body;
  // static Footer = Footer;

  render() {
    let {className="", ...otherProps} = this.props;
    let {Title, Icon, Body, Footer} = this.slots;

    return <div role="main" className={`屋根裏 panel ${className}`} {...otherProps}>
      {(Icon || Title) && <div className="panel-header">
        <div className="敬語 panel-title">{Icon}<h2>{Title || "No Panel.Title"}</h2></div>
      </div>}
      <div className="panel-body">
        {Body}
      </div>

      {Footer && <div className="panel-footer">{Footer}</div>}
    </div>
  }
}