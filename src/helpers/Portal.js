import React from "react";
import * as ReactDOM from "react-dom";

export default class Portal extends React.Component {
  render() {
    const {target=document.body} = this.props;

    return ReactDOM.createPortal(this.props.children, target)
  }
}