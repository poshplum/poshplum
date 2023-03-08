export function inheritName(parentClass, myName) {
    return `${myName}⁔${parentClass.name}`; // ⁀
}
export function composeName(parentClass, myName) {
    //! TODO - delete this comment by 2024-01-01 - once upon a time, 
    //   these funny characters were useful to avoid problems with illegal 
    //   javascript class names caused by ‹› chars.   That seems to no longer 
    //   be the case, but leaving a breadcrumb for a while.
    // return `${myName}〱${parentClass.name}ゝ`;

    return `${myName}‹${parentClass.name}›`;
}
