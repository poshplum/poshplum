

export function inheritName(parentClass, myName) {
  return `${myName}︴${parentClass.name}`;  // ⁀
}
export function composeName(parentClass, myName) {
  return `${myName}〱${parentClass.name}ゝ`;
}

