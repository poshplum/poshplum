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
  const HeaderMiddle = Layout.namedSlot("HeaderMiddle").withMarkup(
    ({className="", children, ...moreProps }) =>
      <div className={`float-right ${className}`} {...moreProps}>{children}</div>
  );
    
    const Body = Layout.defaultSlot("Body")
const Footer = Layout.namedSlot("Footer").withMarkup(({className="", children, ...props}) => {
  return <div className={`panel-footer ${className}`} {...props}>{children}</div>

})

const FixedHeader = Layout.namedSlot("FixedHeader").withMarkup(({children, ...props}) => {
  const err = Object.keys(props).length ? <div className="toast toast-error">FixedHeader doesn't accept extra props.</div> : "";
  return <>{err}{children}</>

})


export default class Panel extends Layout {
  static Title = Title;
  static Icon = Icon;
  static HeaderRight = HeaderRight;
  static HeaderMiddle = HeaderMiddle;
  static Body = Body;
  static FixedHeader = FixedHeader;
  static Footer = Footer;

  static slots = {Title, Icon, HeaderMiddle, HeaderRight, FixedHeader, Body, Footer};

  componentWillUnmount() {
    this._unmounting = true;
  }
  componentDidMount() {
    let input = this.node.current.querySelector('input[type="text"]:not([readonly])');
    if (input) input.focus();

    setTimeout(() => {
      if (!this._unmounting) this.setState({announceTitle: true})
    }, 1)

  }
  render() {
    let {className="", withRef, ...otherProps} = this.props;
      let { Title, Icon, HeaderMiddle, HeaderRight, Body, Footer, FixedHeader } = this.slots;
    let {announceTitle} = this.state || {}
    if (!this.node) this.node = withRef || React.createRef();
    if (withRef && this.node !== withRef) throw new Error(`Panel: assertion failure: withRef= isn't expected to be changing`);

    // if (bareClass) throw new Error("use className=, not class=, for Panel class")

    return (
        <div
            ref={this.node}
            role="main"
            className={`屋根裏 境界窓 panel is-page-overlay ${className}`}
            {...otherProps}
        >
            {(FixedHeader || Icon || Title || HeaderRight || HeaderMiddle) && (
                <div className="頭 panel-header">
                    <div className="敬語 panel-title">
                        {Icon}
                        {HeaderRight}
                        {HeaderMiddle}
                        <h2 aria-live="assertive" aria-atomic="true">
                            <span className="screader">
                                Overlay Panel: Escape to close
                            </span>
                            {announceTitle && <span>&nbsp;</span>}
                            {Title || "No Panel.Title"}
                        </h2>
                    </div>
                    {FixedHeader}
                </div>
            )}
            <div className="panel-body">{Body}</div>

            {Footer}
        </div>
    );
  }
}