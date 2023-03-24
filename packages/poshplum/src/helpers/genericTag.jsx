const invalidGenericTagUsage = Symbol("invalidGenericTagUsage");
export const propIsRequired = Symbol("as= prop is required!");


//! example usage:
//   ```
//   const AccordionButton = genericTag({
//     as: "button",
//     // produces ```<button
//     //      class="accordion-button <addl className= prop>"
//     //      type="button"
//     //      data-bs-toggle="collapse"
//     //      data-bs-target="#collapseOne"
//     //      aria-expanded="true"
//     //      aria-controls="collapseOne"
//     //  >
//     //      Example Accordion Item
//     //  </button>
//     overrideClassName: "accordion-button",
//     type: "button",
//     "data-bs-toggle": "collapse",
//     "data-bs-target": propIsRequired,
//     "aria-expanded": propIsRequired,
//     "aria-controls": propIsRequired,
// });

export function genericTag(
    tagTmpl = {
        [invalidGenericTagUsage]: true,
    }
) {
    const { ...tagTemplate } =
        propIsRequired === tagTmpl
            ? {
                  as: propIsRequired,
              }
            : tagTmpl;
    //! transforms the tag template into a tiny function component that uses the tag template
    //  as default props.

    if (tagTemplate[invalidGenericTagUsage])
        throw new Error(`asGenericTag() should be called with a tag template`);
    if (tagTemplate.className)
        throw new Error(
            `asGenericTag: invalid generic \`className=\` tag template.  Set overrideClassName \n` +
                `to provide a default className that can be overridden.  The generated component \n` +
                `will honor additional className= attributes when you use <YourTag className=... />,\n` +
                `and will override the className if you provide <YourTag overrideClassName=... />.  `
        );
    const requiredProps = [];
    
    //!!! todo: convert this to propTypes
    for (const [k, v] of Object.entries(tagTemplate)) {
        if (propIsRequired === v) requiredProps.push(k);
    }
    return ({
        as: As = tagTemplate.as,
        overrideClassName = tagTemplate.overrideClassName,
        className,
        children,
        ...props
    }) => {
        if (propIsRequired === As || !As) {
            const msg = `missing required as= prop for ${basedOnSlot.displayName}`;
            throw new Error(msg)
        }
        for (const p in requiredProps) {
            if (propIsRequired === props[p]) {
                const msg = `missing required ${p}= prop`;
                throw new Error(msg)    
            }
        }

        return (
            <As className={`${overrideClassName} ${className}`} {...props}>
                {children}
            </As>
        );
    };
}
