const util = {
  namedSlot(name,component) {
    let rv = component || function({children}) {
      return children
    };
    rv.displayName = name;
    return rv;
  },
  extractSlots() {
  }
};

export default util;