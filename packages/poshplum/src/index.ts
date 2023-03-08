export { Reactor, reactorTag } from "./Reactor";
export { Card } from "./components/Card";
export { Chip } from "./components/Chip";


export { CodeExample } from "./components/CodeExample";
export { Notification } from "./components/Notification";
export { ErrorTrigger } from "./components/ErrorTrigger";
export { Grid } from "./components/Grid";
export { Keyboard } from "./components/Keyboard";
export { Panel } from "./components/Panel";
export { SectionTitle } from "./components/SectionTitle";
export { FormSection } from "./components/FormSection";
export {NotificationArea } from "./actors/NotificationArea";

export { Layout } from "./Layout";

export { withStateMachine, State } from "./actors/withStateMachine";

export { Actor } from "./reactor/Actor";
export { Action } from "./reactor/Action";
export { Publish } from "./reactor/Publish";
export { Subscribe } from "./reactor/Subscribe";

export { PortalRegistry } from "./actors/PortalRegistry";
export { KeyActor } from "./actors/KeyActor";

export { composeName, inheritName } from "./helpers/ClassNames";
export { isInsideDOM, isOutsideDOM } from "./helpers/isOutsideDOM";
export { Mousetrap } from "./helpers/mousetrap";
export { Portal } from "./helpers/Portal";
export { PortalProvider } from "./helpers/PortalProvider";

// type MethodDecorator = <T>(
//     target: Record<string, any>,
//     propertyKey: string,
//     descriptor: TypedPropertyDescriptor<T>
//   ) => void;
  
// const tdec: MethodDecorator = function (proto, f, desc) {
//     console.log({desc})
//     const prev = desc.value;
//     desc.value = (function(...args) {
//         console.log("decorated greeting");
//         return (prev as any )(...args)
//     }) as any;
//     return desc
// }
// class Foo {
//     @tdec
//     hi() {
//         console.log("hi");
//     }

// }