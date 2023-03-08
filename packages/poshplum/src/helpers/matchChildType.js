import React from "react";

export function matchChildType(typeName, children, klass) {
    return React.Children.map(children, (child) => {
        return matchesType(typeName, child, klass)
    });
}

export function matchesType(typeName, child, klass) {
    const cType = child && child.type;

    if (klass && cType && cType === klass) return child;

    if (
        klass &&
        cType &&
        cType.prototype &&
        klass.prototype &&
        cType.prototype instanceof klass
    )
        return child;

    if (cType && cType.name == typeName) return child;
    // displayName ok
    if (cType && cType.displayName == typeName) return child;

}
