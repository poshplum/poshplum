import {mount} from "enzyme/build";
import Reactor , {Action} from "../src/components/Reactor";
import * as React from "react";


describe("Reactor", () => {

  @Reactor
  class MyReactor extends React.Component {
    sayHello = jest.fn();
    componentDidMount() {
      console.log("MyReactor didMount")
    }
    render() {
      let {children} = this.props;
      return <div className="myReactor">
        <Action debug={0} sayHello={this.sayHello}></Action>

        {children}
      </div>
    }

  }
  describe("is an actor", () => {
    it("collects declared actions: event sinks with handlers responding to those events", () => {
      const hiya = jest.fn();
      const component = mount(<MyReactor>
        <Action debug={0} informalGreeting={hiya} />
        <div className="event-source"></div>
      </MyReactor>);

      component.find(".event-source").instance().dispatchEvent(new CustomEvent("sayHello", {bubbles:true}));
      expect(hiya).not.toHaveBeenCalled();
      expect(component.instance().sayHello).toHaveBeenCalledTimes(1);

      component.find(".event-source").instance().dispatchEvent(new CustomEvent("informalGreeting", {bubbles:true}));
      component.find(".event-source").instance().dispatchEvent(new CustomEvent("informalGreeting", {bubbles:true}));
      expect(hiya).toHaveBeenCalledTimes(2);
      expect(component.instance().sayHello).toHaveBeenCalledTimes(1);
    });

    it("responds to actions triggered by or registered by deep children", () => {
      const hiya = jest.fn();
      const component = mount(<MyReactor>
        <Action debug={0} informalGreeting={hiya} />
        <div className="event-source"><SomeOtherChild/></div>
        <div className="event-sink"><AnotherChild/></div>
      </MyReactor>);

      component.find(".deeper").instance().dispatchEvent(new CustomEvent("deepAction", {bubbles:true}));
      expect(hiya).toHaveBeenCalledTimes(1);

      function AnotherChild({}) { return <div><div className="deeper"></div></div> }
      function SomeOtherChild({}) { return <div><Action deepAction={hiya} /></div> }
    });
  });
  describe("is an actor hub", () => {
    it("collects declared, collaborating actors: other Reactors that publish their capabilities");
    it("lets children trigger collaborators' actions: allows cousin/uncle nodes to collaborate");
    it("honors localized scope of nested non-collaborating reactors: doesn't delegate triggered events to them");
  });
  describe("is an event hub", () => {
    it("collects declared events - event sources that any child can subscribe to");
    it("collects listeners for events it is mediating");
    it("allows listener requests upstream, for events it doesn't mediate");
    it("broadcasts triggered events to each listener");
  });
  describe("- a localized actor hub", () => {
    it("responds to its own actions")
    it("collects local actors and responds to action events triggered under its scope")
    it("allows all unrecognized events to trigger actions in higher-level scopes")
    it("can react to any unrecognized events (e.g. notifying a developer that they happened and were uncaught) without interference")
    it("can recognize and react to events that were not handled by a higher-level scope")
  });
});