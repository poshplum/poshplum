import React from 'react';
import Layout from "./layout";

const Title = Layout.namedSlot("Title")
const Icon = Layout.namedSlot("Icon").withMarkup(
  ({className="", "aria-label": ariaLabel, children, ...moreProps }) => {
      let ariaAttrs = {"aria-label": ariaLabel}
      if (!ariaLabel) ariaAttrs = {"aria-hidden": "true"}

      return <span {...ariaAttrs}
          className={`小簡 ${className}`}
        {...moreProps}>{children}</span>;
  }
);
const HeaderRight = Layout.namedSlot("HeaderRight").withMarkup(
  ({className="", children, ...moreProps }) =>
    <div className={`float-right ${className}`} {...moreProps}>{children}</div>
);

    const Body = Layout.defaultSlot("Body")
const Footer = Layout.namedSlot("Footer")

export default class Panel extends Layout {
  static Title = Title;
  static Icon = Icon;
  static HeaderRight = HeaderRight;
  static Body = Body;
  static Footer = Footer;

  static slots = {Title, Icon, HeaderRight, Body, Footer};

  componentDidMount() {
    let input = this.node.current.querySelector('input[type="text"]:not([readonly])');
    if (input) input.focus();

    setTimeout(() => {
      this.setState({announceTitle: true})
    }, 1)

  }
  render() {
    let {className="", class:bareClass, ...otherProps} = this.props;
    let {Title, Icon, HeaderRight, Body, Footer} = this.slots;
    let {announceTitle} = this.state || {}
    if (!this.node) this.node = React.createRef();
    if (bareClass) throw new Error("use className=, not class=, for Panel class")

    return <div ref={this.node} role="main" className={`屋根裏 panel ${className}`} {...otherProps}>
      {(Icon || Title || HeaderRight) && <div className="頭 panel-header">
        <div className="敬語 panel-title">{Icon}
          {HeaderRight}
          <h2 aria-live="assertive" aria-atomic="true">
            <span className="screader">Overlay Panel: Escape to close</span>
            {announceTitle && <span>&nbsp;</span>}
            {Title || "No Panel.Title"}
          </h2>
        </div>
      </div>}
      <div className="panel-body">
        {Body}
      </div>

      {Footer && <div className="panel-footer">{Footer}</div>}
    </div>
  }
}