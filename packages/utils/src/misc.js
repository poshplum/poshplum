import {__decorate} from 'tslib';

export function text2list([text], ...badArgs) {
    if (badArgs.length) throw new Error("text2list can't take interpolations");
    return text
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => !!line);
}

export function text2map(text) {
    const array = text2list(text);
    const map = {};
    for (const item of array) {
        let [val, labelInfo = val] = item.split(/:/, 2);
        labelInfo = labelInfo.replace(/^\+/, val + " ");

        map[val] = labelInfo;
    }
    return map;
}


export function autobindMethods(clazz, methods = clazz.autobindMethods) {
    if (!methods?.length) throw new Error(`usage: autobindMethods(class, [...methods: string]).  class may define static autobindMethods instead of passing an array of method names`)

    for ( const m of methods) {
        if (!clazz.prototype[m]) {
            console.warn(`autobindMethods: skipping unknown method '${m}' in class '${clazz.displayName}'`);
            continue
        }

        __decorate([ autobind ], clazz.prototype, m, null);        
    }
    return clazz
}

export function autobind(proto, name, descriptor) {
    let func = descriptor.value;

    if ("function" !== typeof func) {
        throw new TypeError(`@autobind must only be used on instance methods`);
    }

    //! it configures the named property to use just-in-time binding
    return {
        configurable: true,
        get() {
            const bound = func.bind(this);
            bound.innerFunction = func;
            //! just-in-time, it reconfigures the property to statically return the bound function
            Object.defineProperty(this, name, {
                configurable: false,
                get() {
                    return bound;
                },
            });
            return bound;
        },
    };
}

export function withPrototype({ ...props }) {
    return (clazz) => {
        Object.assign(clazz.prototype, props);
        return clazz;
    };
}

export function fromEntries(iterable) {
    return [...iterable].reduce((obj, [key, val]) => {
        obj[key] = val;
        return obj;
    }, {});
}

export function enumeratedMap(proto, name, { methods = {}, ...descriptor }) {
    const enumName = `${proto.name}.${name}`; // works for static class variables; adjust if needed later.
    const obj = descriptor.initializer();
    if ("object" !== typeof obj)
        throw new Error(
            `no support (yet) for this kind of EnumeratedMap (for '${name}')`
        );

    const internalMap = new Map(Object.entries(obj));
    const invertedEntries = [...internalMap.entries()].map(([k, v]) => [v, k]);
    const alreadyInverted = fromEntries(invertedEntries);
    const inverted = () => alreadyInverted;

    descriptor.initializer = () => {
        return new Proxy(internalMap, {
            get(target, k, receiver) {
                if (k == "entries") return () => internalMap.entries();
                if (k == "invertedEntries") return invertedEntries;
                if (k == "inverted") return inverted;
                const v = internalMap.get(k);
                if (v) return v;

                if (methods[k]) return methods[k].bind(receiver);
                if (!v && !internalMap.has(k))
                    throw new Error(`invalid key '${k}' for ${enumName}`);

                return v;
            },
        });
    };
    return descriptor;
}

enumeratedMap.withMethods =
    ({ ...methods }) =>
    (proto, name, descriptor) => {
        return enumeratedMap(proto, name, {
            methods,
            ...descriptor,
        });
    };

export function sumObject(keys, values, rereduce) {
    if (rereduce) {
        throw new Error(
            `wow, pouchdb started calling with rereduce.  FIXME.  Also, check object _sum support`
        );
    }
    const reduced = {};
    for (const oneV of values) {
        for (let [k, v] of Object.entries(oneV)) {
            if ("object" === typeof v)
                throw new Error(
                    `sorry, nested objects not supported by this test-time shim. :(`
                );
            if ("undefined" === typeof v) v = 0;
            if ("number" !== typeof v)
                throw new Error(
                    `object values must be numbers :( got ${k}=${JSON.stringify(
                        v
                    )} ):`
                );
            reduced[k] = (reduced[k] || 0) + parseFloat(v);
        }
    }

    return reduced;
}
