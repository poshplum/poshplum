
export function getClassName(parentClass) {
  return (parentClass.displayName || parentClass.name);
}
export function getShortName(parentClass) {
  return (parentClass.shortName || parentClass.displayName || parentClass.name );
}
export function inheritName(parentClass, myName) {
  return `${myName}+${getClassName(parentClass)}`;
}
export function composeName(parentClass, myName) {
  return `${myName}(${getClassName(parentClass)})`;
}

export function inheritShortName(parentClass, myName) {
  return `${myName}+${getShortName(parentClass)}`;
}
export function composeShortName(parentClass, myName) {
  return `${myName}(${getShortName(parentClass)})`;
}

export function myName(obj) {
  return (obj.constructor.displayName || obj.constructor.name)
}
export function myShortName(obj) {
  return (obj.constructor.shortName || obj.constructor.displayName || obj.constructor.name)
}