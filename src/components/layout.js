import {Component} from 'react';
import Util from './util';

export class TopMenuLayout extends Component {
  static Menu = Util.namedSlot("Menu");
  render() {
    let {children} = this.props;
    return <div className="layout top-menu-layout">
      <div className="menu">Menu Area</div>
      <div className="body">
        {children}
      </div>
    </div>
  }
}

export const withTopMenu = (WrappedComponent) => {
  let wrappedName = WrappedComponent.displayName || WrappedComponent.name;
  if (!wrappedName) {
    console.error("missing name or displayName in wrapped component", WrappedComponent);
    throw new Error("wrapped component needs a name or displayName");
  }
  class ComponentWithMenu extends Component {
    static displayName = `withTopMenu(${wrappedName})`;
    render() {
      let {props} = this;
      return <TopMenuLayout>
        <WrappedComponent {...props} />
      </TopMenuLayout>
    }
  }

  return ComponentWithMenu;
};

const Layout = {
  TopMenuLayout,
  withTopMenu,
  // withSideMenu,
  // withPanel,
};
export default Layout;