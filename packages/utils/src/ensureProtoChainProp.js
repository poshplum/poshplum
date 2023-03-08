const usage = `
usage: ensureProtoChainProp(class, propName, toRootClass, [ rootValue={} ]) 

ensureProtoChainProp ensures that the indicated class has a static member 
property having the given propName, recursively up to (and not including)
the indicated toRootClass.  It is safe to call any number of times, as it 
does nothing when the indicated property name is already present.

The resulting object in 'propName' will be a hierarchical object providing
a shared namespace across an inheritance tree.

To iterate the items in this hierarchical object:

    for (const key in this[propName]) {  //  or this.‹propName›
        // keys from each level of the inheritance chain will be iterated
        
        const value = this[propName][key]    // or this.‹propName›[key]
        // ... anything you'd like to do with (keys, values) 
    }

IMPORTANT: Object.entries() does not enumerate inherited properties, so you 
MUST use the pattern above in order to access these proto-chain props.
`;

export function ensureProtoChainProp(
    clazz,
    propName,
    toRootClass,
    rootValue = {}
) {
    if (!clazz)
        throw new Error("ensurePrototypeChain: missing arg1 (class)\n" + usage);
    if (!propName)
        throw new Error(
            "ensurePrototypeChain: missing arg2 (propName)\n" + usage
        );
    if (!toRootClass)
        throw new Error(
            "ensurePrototypeChain: missing arg3 (toRootClass)\n" + usage
        );

    const mySuper = Object.getPrototypeOf(clazz);
    if (toRootClass !== mySuper)
        ensureProtoChainProp(mySuper, propName, toRootClass, rootValue);
    if (clazz.hasOwnProperty(propName)) return;

    clazz[propName] = Object.create(mySuper[propName] || rootValue);
}
