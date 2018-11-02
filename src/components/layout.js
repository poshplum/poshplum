import Component from 'react';


export class TopMenuLayout extends Component {
  render() {
    let {children} = this.props;
    return <div className="layout">
      <div className="menu">Menu Area</div>
      <div className="body">
        {children}
      </div>
    </div>
  }
}

export const withTopMenu = (WrappedComponent) => {
  let MenuedComponent = class extends Component {
    static displayName = `Page(${WrappedComponent.displayName})`;
    render() {
      return <TopMenuLayout>
        <WrappedComponent />
      </TopMenuLayout>
    }
  }
};

const Layout = {
  TopMenuLayout,
  withTopMenu,
  // withSideMenu,
  // withPanel,
}

// export default Layout;