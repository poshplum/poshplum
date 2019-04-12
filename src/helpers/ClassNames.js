// https://www.unicode.org/charts/PDF/U1AB0.pdf
// https://www.unicode.org/charts/PDF/U1DC0.pdf "combining diacritical marks supplement"
// https://www.unicode.org/charts/PDF/U20D0.pdf "combining diacritical marks for symbols"
// https://www.unicode.org/charts/PDF/UFE20.pdf "combining half-marks"
// https://www.unicode.org/charts/PDF/U2000.pdf punctuation
// https://www.unicode.org/charts/PDF/U2B00.pdf arrows



export function getClassName(parentClass) {
  return (parentClass.displayName || parentClass.name);
}
export function inheritName(parentClass, myName) {
  // return `${myName}$${getClassName(parentClass)}`;
  // 031A + 2009 -> a̚ b
  // 0332 + 2009 -> a̲ b
  // 0338 + 2009 -> a̸ b
  // 033A + 2009 -> a̺ b
  // 035C + 2009 -> a͜b
  // 035F + 2009 -> a͟b
  // 0360 + 2009 -> a͠ b
  // 0361 + 2009 -> a͡ b
  // 0362 + 2009 -> a͢ b

  return `${myName}$${getClassName(parentClass)}`;
}
export function composeName(parentClass, myName) {
  return `${myName}〱${getClassName(parentClass)}ゝ`;
}

export function myName(obj) {
  return (obj.constructor.displayName || obj.constructor.name)
}
