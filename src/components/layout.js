import React, {Component} from 'react';
import groupBy from 'lodash/groupBy';
import mapValues from 'lodash/mapValues';
import find from 'lodash/find';

export class Layout extends Component {
  // static Slot = class Slot extends Component {
  //   render() {
  //     let {children} = props
  //     return children;
  //   }
  // };
  static defaultSlot(name) {
    let slot = this.namedSlot(name);
    slot.isDefault = true;
    return slot;
  }
  static namedSlot(name) {
    // console.log("2")
    let slot = ({children}) => [children];
    slot.displayName = name;

    // this.slots = this.slots || {};
    // this.slots[name] = component;
    // this[name] = component;

    return slot;
  }

  // returns the list of slots configured for the layout.
  static getSlots() {
    if (!this.slots) throw new Error(`Layout ${this.name}: slots not defined`);
    return this.slots
  }

  getChildren() {
    let {children} = this.props;
    if (!children) {
      debugger;
      throw new Error(`${this.constructor.displayName}: no children received`);
    }
    return children;
  }
  // used for extracting children matching the slots defined in the layout.
  // returns a ready-to-use map of slot-names to rendered content.
  get slots() {
    let slots = this.constructor.getSlots();
    let children = this.getChildren();

    let defaultSlot = find(slots,slotType => slotType.isDefault)
    let defaultSlotName = defaultSlot && (defaultSlot.displayName || defaultSlot.name);

    if (!children.length) children = [children];

    // locate the instances of children provided
    let content = groupBy(children, (child) => {
      if (!child) return undefined;

      let found = find(slots,(slotType, key) => {return (slotType === child.type)});
      let foundName;
      if(!found) {
        foundName = "default";
      } else {
        foundName = (found.displayName || found.name);
      }

      if (!foundName) throw new Error("every layout slot needs a 'displayName' or 'name'");
      return foundName;
    });
    if (content.default) {
      // console.log(`Some children didn't match any slots... -> default`);
      if (!defaultSlot) {
        throw new Error(`${this.constructor.displayName}: no defaultSlot`)
      }

      content[defaultSlotName] = React.createElement(defaultSlot, {}, content.default);
      delete content.default;
    }
    content = mapValues(content, (item,key) => {
      if (item.length == 1) return item[0];
      return item;
    });

    // console.log(content);
    return content;
  }
}


// argh
Layout.Decorator = class LayoutDecorator extends Layout {
  getChildren() {
    let delegateType = this.constructor.delegate;
    if (!delegateType) throw new Error("Delegate required; use Layout.toDecorator to get this generated for you");

    let matchedSlot = find(this.props.children, (child) => (child.type === delegateType));
    if (!matchedSlot) throw new Error(`no match for children of type ${this.constructor.displayName}... with toDecorator, this shouldn't happen`);
    return matchedSlot.children;
  }
}

Layout.toDecorator = (LayoutClass) => (DecoratedComponent) => {
  let dName = LayoutClass.displayName || LayoutClass.name;
  let dcName = ( DecoratedComponent.displayName || DecoratedComponent.name );
  dName = `${dName}DelegatedTo${dcName}`;

  class LayoutDelegator extends Layout.Decorator {
    // static name = dName;
    static delegate = DecoratedComponent
    static displayName = dName;
  }

  return LayoutDelegator
};
  Layout.toDecoratorf = (LayoutClass) => (DecoratedComponent) => class extends React.Component {
  render() {
    return <layoutClass delegate={DecoratedComponent}>
      <DecoratedComponent {...this.props} />
    </layoutClass>
  }
};
