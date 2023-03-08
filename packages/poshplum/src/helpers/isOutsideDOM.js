export function isInsideDOM(needle, haystack) {
    return isOutsideDOM(needle, haystack, "inverse");
}
export function isOutsideDOM(needle, haystack, inverse) {
    let lookingAt = needle;
    let depth = 0;
    while (lookingAt) {
        if (lookingAt === haystack) return inverse ? depth : false;
        lookingAt = lookingAt.parentNode;
        depth++;
    }
    if (inverse) return false;
    return true;
}
