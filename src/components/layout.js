import React, {Component} from 'react';
import groupBy from 'lodash/groupBy';
import mapValues from 'lodash/mapValues';
import map from 'lodash/map';
import find from 'lodash/find';
import {getClassName, myName} from "../helpers/ClassNames";

function SlotContent({children}) {
  return children;
}

export default class Layout extends Component {
  static defaultSlot(name) {
    let slot = this.namedSlot(name);
    slot.isDefault = true;
    return slot;
  }
  static withMarkup(slot, RenderComponent) {
    let componentWithMarkup = ({children, ...props}) => <RenderComponent {...props}><SlotContent>{children}</SlotContent></RenderComponent>
    componentWithMarkup.displayName = slot.displayName;

    if (slot.isDefault) componentWithMarkup.isDefault = slot.isDefault;
    if (!RenderComponent.displayName) RenderComponent.displayName = `slotMarkup(${slot.displayName})`;

    return componentWithMarkup;
  }
  static namedSlot(name) {
    let slot = ({children}) => [children];
    slot.displayName = name;
    slot.isPlain = true;

    slot.withMarkup = (RenderComponent) => this.withMarkup(slot, RenderComponent);

    return slot;
  }

  // returns the list of slots configured for the layout.
  static getSlots() {
    if (!this.slots) throw new Error(`Layout ${getClassName(this)}: static slots not defined`);
    return this.slots
  }

  // used for extracting children matching the slots defined in the layout.
  // returns a ready-to-use map of slot-names to rendered content.
  get slots() {
    let slots = this.constructor.getSlots();
    if (!this.constructor._slotsVerified) {
      map(slots, (slot,k) => {
        let slotName = getClassName(slot);
        // console.log("slot: ", k, slotName, slot );
        let foundSlot = this.constructor[slotName];
        if ((!foundSlot) || foundSlot !== slot) {
          console.warn(`Slot '${slotName}' should be declared as a static member of ${myName(this)} to get good autocompletion`)
        }
      })
      this.constructor._slotsVerified = true;
    }
    let {children=[]} = this.props;
    if (undefined === children.length) {
      children = [children];
    }

    let defaultSlot = find(slots,slotType => slotType.isDefault);
    let defaultSlotName = defaultSlot && (defaultSlot.displayName || defaultSlot.name);


    // locate the instances of children provided
    let content = groupBy(children, (child) => {
      if (!child) return undefined;

      // console.log("child:", child, child.type, child.type && child.type.displayName);

      let foundSlot = find(slots,(slotType, key) => {
        // console.log(child, child.type, " <-> ", slotType.displayName, slotType.isDefault, slotType );

        if (module.hot) {
          let childName = child.type && child.type.displayName;
          return (slotType.displayName === childName) //  ✓ works with react webpack hot loader
        }
        return (slotType === child.type)
      });
      let foundName;
      if(!foundSlot) {
        // console.log("slot: default", foundSlot, child)
        foundName = "default";
      } else {
        foundName = (foundSlot.displayName || foundSlot.name);
        // console.log(`slot: ${foundName}`)
      }

      if (!foundName) throw new Error("every layout slot needs a 'displayName' or 'name'");
      return foundName;
    });
    if (content.default) {
      // console.warn(`Some children didn't match any slots... -> default`, content.default);
      if (!defaultSlot) {
        console.error("default content without default slot", content.default)
        throw new Error(`${this.constructor.displayName}: default content was found, with no defaultSlot to hold it.`)
      }

      content[defaultSlotName] = React.createElement(defaultSlot, {children: content.default});
      delete content.default;
    }
    // console.log({children, content});
    content = mapValues(content, (foundContents,key) => {
      let foundSlot = slots[key];
      // debugger
      if (foundContents.length > 1) {
        let matchingChildren = map(foundContents, (item) => {
          if (item.type === foundSlot ) return item.props.children;
          return item;
        });
        return React.createElement(foundSlot, {children: matchingChildren});
      }
      if (foundContents.length == 1) return foundContents[0];
      return foundContents;
    });

    // console.log(content);
    return content;
  }
}
Layout.withMarkup = Layout.withMarkup.bind(Layout)


