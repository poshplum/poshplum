import React, {Component} from 'react';
import groupBy from 'lodash/groupBy';
import mapValues from 'lodash/mapValues';
import map from 'lodash/map';
import find from 'lodash/find';

import flatten from "lodash/flatten";

export default class Layout extends Component {
  static defaultSlot(name) {
    let slot = this.namedSlot(name);
    slot.withTagName = (name) => {slot.tagName = name ; return slot};
    slot.multiple = () => { slot.isMultiple = true; return slot };

    slot.isDefault = true;
    return slot;
  }
  static withMarkup(basedOnSlot, RenderComponent) {
    let componentWithMarkup;
    let slot = componentWithMarkup = ({children, ...props}) => <RenderComponent {...props}>{children}</RenderComponent>
    slot.raw = RenderComponent;
    slot.displayName = basedOnSlot.displayName;

    // if (basedOnSlot.tagName) throw new Error(`slot: withTagName("${basedOnSlot.tagName}"): .withMarkup(...) conflicts with bare tag name.`)
    if (basedOnSlot.isMultiple) slot.isMultiple = basedOnSlot.isMultiple;
    if (basedOnSlot.isDefault) slot.isDefault = basedOnSlot.isDefault;
    if (!RenderComponent.displayName) RenderComponent.displayName = `slot‹${basedOnSlot.displayName}›`;
    if (slot.tagName) componentWithMarkup.tagName = slot.tagName;

    slot.withTagName = (tn) => { throw new Error(
      `slot: withMarkup(...): withTagName("${tn}") primitive conflicts with markup-based slot - try withTagName().withMarkup() instead?`
    ) };

    slot.multiple = () => { slot.isMultiple = true; return  slot };
    return slot;
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
    let slotToSlotNames;
    if (this.constructor.hasOwnProperty("_slotsVerified")) {
      slotToSlotNames = this.constructor._slotsVerified;
    } else {
      slotToSlotNames = new Map();
      map(slots, (slot,k) => {
        let slotName = slot.displayName || slot.constructor.displayName || slot.name || slot.constructor.name;
        // console.log("slot: ", k, slotName, slot );
        let foundSlot = this.constructor[slotName];
        if ((!foundSlot) || foundSlot !== slot) {
          console.warn(`Layout: ${this.constructor.name}: slot '${slotName}' is not declared as a static member.  Add it to the class definition to get better autocomplete.  \n  ^ This can also result in inscrutable "React.createElement: type is invalid" errors.`)
        }
        slotToSlotNames.set(slot, slotName);
      })
      this.constructor._slotsVerified = slotToSlotNames
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

      let foundName = slotToSlotNames.get(child.type) || find(Object.keys(slots),(key) => {
        // console.log(child, child.type, " <-> ", slotType.displayName, slotType.isDefault, slotType );

        const slotType = slots[key];
        const slotName = slotToSlotNames.get(slotType);
        if (!slotName) {
          debugger
          throw new Error(`‹impossible?› iterated slot doesn't have a name`)
        }
        if (slotType.debug) debugger
        if (module.hot) {
          let childName = child.type && child.type.displayName || child.type;

          //  ✓ works with react webpack hot loader
          if (slotName === childName) return true;
        }
        if (slotType.tagName && (slotType.tagName === child.type)) {
          return true;
        }
        if (slotType.isPrototypeOf(child.type)) return true;
        return (slotType === child.type)
      });
      let foundSlot = foundName && slots[foundName]
      let foundDisplayName = foundSlot && slotToSlotNames.get(foundSlot)
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


