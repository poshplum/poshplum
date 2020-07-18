import React, {Component} from 'react';
import groupBy from 'lodash-es/groupBy';
import mapValues from 'lodash-es/mapValues';
import map from 'lodash-es/map';
import find from 'lodash-es/find';

import flatten from "lodash-es/flatten";

export default class Layout extends Component {
  static defaultSlot(name) {
    let slot = this.namedSlot(name);
    slot.withTagName = (name) => {slot.tagName = name ; return slot};
    slot.multiple = () => { slot.isMultiple = true; return slot };

    slot.isDefault = true;
    return slot;
  }
  static withMarkup(slot, RenderComponent) {
    let componentWithMarkup = ({children, ...props}) => <RenderComponent {...props}>{children}</RenderComponent>
    componentWithMarkup.raw = RenderComponent;
    componentWithMarkup.displayName = slot.displayName;

    if (slot.isDefault) componentWithMarkup.isDefault = slot.isDefault;
    if (!RenderComponent.displayName) RenderComponent.displayName = `slot‹${slot.displayName}›`;

    if (slot.tagName) componentWithMarkup.tagName = slot.tagName;

    return componentWithMarkup;
  }
  static namedSlot(name) {
    let slot = ({children}) => [children];
    slot.withTagName = (name) => {slot.tagName = name ; return slot};
    slot.multiple = () => { slot.isMultiple = true; return slot };

    slot.displayName = name;
    slot.isPlain = true;

    slot.withMarkup = (RenderComponent) => this.withMarkup(slot, RenderComponent);
    slot.withMarkup.displayName = name;

    return slot;
  }

  // returns the list of slots configured for the layout.
  static getSlots() {
    if (!this.slots) throw new Error(`Layout ${this.constructor.name}: static slots not defined`);
    return this.slots
  }

  get debug() {
    return this.props.debug
  }

  // used for extracting children matching the slots defined in the layout.
  // returns a ready-to-use map of slot-names to rendered content.
  get slots() {
    let slots = this.constructor.getSlots();
    if (!this.constructor._slotsVerified) {
      map(slots, (slot,k) => {
        let slotName = slot.displayName || slot.constructor.displayName || slot.name || slot.constructor.name;
        // console.log("slot: ", k, slotName, slot );
        let foundSlot = this.constructor[slotName];
        if ((!foundSlot) || foundSlot !== slot) {
          console.warn(`Layout: ${this.constructor.name}: slot '${slotName}' is not declared as a static member.  Add it to the class definition to get better autocomplete.  \n  ^ This can also result in inscrutable "React.createElement: type is invalid" errors.`)
        }
      })
      this.constructor._slotsVerified = true;
    }
    let {children=[]} = this.props;
    if (!Array.isArray(children)) {
      children = [children];
    }
    children = flatten(children)

    let defaultSlot = find(slots,slotType => slotType.isDefault);
    let defaultSlotName = defaultSlot && (defaultSlot.displayName || defaultSlot.name);


    // locate the instances of children provided
    let content = groupBy(children, (child) => {
      if (!child) return undefined;

      if(this.debug)
          console.log("child:", child, child.type, child.type && child.type.displayName);
      if (child.props && child.props.debug) debugger

      let foundName = find(Object.keys(slots),(key) => {
        // console.log(child, child.type, " <-> ", slotType.displayName, slotType.isDefault, slotType );

        const slotType = slots[key];
        if (slotType.debug) debugger
        if (module.hot) {
          let childName = child.type && child.type.displayName || child.type;

          //  ✓ works with react webpack hot loader
          if (slotType.displayName === childName) return true;
        }
        if (slotType.tagName && (slotType.tagName === child.type)) {
          return true;
        }
        if (slotType.isPrototypeOf(child.type)) return true;
        return (slotType === child.type)
      });
      let foundSlot = foundName && slots[foundName]
      let foundDisplayName = foundSlot && (foundSlot.displayName || foundSlot.name);
      if (!foundSlot) {
        // console.log("slot: default", foundSlot, child)
        foundName = "default";
        if (this.debug > 1) debugger
      } else {
        if (foundDisplayName !== foundName) {
          console.warn(`slot '${foundName}' has component with displayName/name = ${foundDisplayName}`)
        }
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
    if (this.debug) console.log({children, content});
    content = mapValues(content, (foundContents,key) => {
      if ("undefined" === key) return null;

      let foundSlot = slots[key];
      if (foundSlot && foundSlot.isMultiple) {
        // console.log("returning multiple for slot", key, foundContents);
        // debugger
        return foundContents;
      }

      if (!foundSlot) {
        console.warn("no slot type found:", {key, foundSlot, foundContents});
        return null
      }

      // debugger
      if (foundContents.length > 1) {
        // coalesces slots having multiple instances to be a single instance with multiple children
        let matchingChildren = map(foundContents, (item) => {
          if (item.type === foundSlot ) return item.props.children;

          if (module.hot) {
            let childName = item.type && item.type.displayName || item.type;
            if (foundSlot.displayName === childName) {  //  ✓ works with react webpack hot loader
              return item.props.children
            }
          }
          return item;
        });
        if (foundSlot.tagName) return matchingChildren;
        return React.createElement(foundSlot, {children: matchingChildren});
      }
      if (foundContents.length == 1) return foundContents[0];
      return foundContents;
    });

    if (this.debug) console.log("after value-mapping:", content);
    return content;
  }
}
Layout.withMarkup = Layout.withMarkup.bind(Layout)


