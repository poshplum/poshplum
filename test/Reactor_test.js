import {mount} from "enzyme/build";
import Reactor , {Actor, Action} from "../src/components/Reactor";
import * as React from "react";

//      https://github.com/airbnb/enzyme/issues/426


describe("Reactor", () => {


  @Reactor
  class MyReactor extends React.Component {
    constructor() {
      super();
      this.sayHello = Reactor.bindWithBreadcrumb(jest.fn(), this);
      this.sayHello.displayName="sayHello"
    }
    // componentDidMount() {
    //   console.log("MyReactor didMount")
    // }

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

      const eSrc = component.find(".event-source").instance();
      Reactor.dispatchTo(eSrc, new CustomEvent("sayHello", {bubbles:true}));
      expect(hiya).not.toHaveBeenCalled();
      expect(component.instance().sayHello.targetFunction).toHaveBeenCalledTimes(1);

      Reactor.dispatchTo(eSrc, new CustomEvent("informalGreeting", {bubbles:true}));
      Reactor.dispatchTo(eSrc, new CustomEvent("informalGreeting", {bubbles:true}));

      expect(hiya).toHaveBeenCalledTimes(2);
      expect(component.instance().sayHello.targetFunction).toHaveBeenCalledTimes(1);
    });

    it("removes its event listeners when unmounting", () => {
      const hiya = jest.fn();


      const component = mount(<MyReactor>
        <Action debug={0} informalGreeting={hiya} />
        <div className="event-source"></div>
      </MyReactor>);

      const listeningNode = component.find(".myReactor").instance().parentNode;
      component.unmount(); // critical
      Reactor.dispatchTo(listeningNode, new CustomEvent("informalGreeting", {bubbles:true}));
      expect(hiya).not.toHaveBeenCalled();
      // debugger
      // to confirm *all* listeners were really removed, use node inspector...
      //   ...browse into listeningNode[Symbol(impl)]._eventListeners (all entries in that object should be empty arrays)
      // it'd be nice to have an api for accessing that info for test purposes but alas... not in jsdom 9.12.0 at least
    });

    it("rejects Actions with duplicate names", () => {
      mockConsole(['error', 'warn']);
      const hi = jest.fn();
      const component = mount(<MyReactor>
        <Action debug={0} informalGreeting={hi} />
        <Action debug={0} informalGreeting={hi} />
        <div className="event-source"></div>
      </MyReactor>);

      // console.log(component.debug());

      const actionCount = Object.keys(component.instance().actions).length;
      if (actionCount !== 4) {
        console.log(component.instance().actions);
        expect(actionCount).toBe(4); // 2x registerX + 1x sayHello + 1x informalGreeting
      }

      const eSrc = component.find(".event-source").instance();
      Reactor.dispatchTo(eSrc, new CustomEvent("informalGreeting", {bubbles:true}));

      expect(hi).toHaveBeenCalledTimes(1);

      expect(console.error).toBeCalledWith(expect.stringMatching(/'informalGreeting' is already registered/));
      expect(console.warn).toBeCalledWith(expect.stringMatching(/existing handler/), expect.anything());
    });

    it("responds to actions triggered by or registered by deep children", () => {
      const deepAction = jest.fn();
      const component = mount(<MyReactor>
        <Action debug={0} informalGreeting={deepAction} />
        <div className="event-source"><SomeOtherChild/></div>
        <div className="event-sink"><AnotherChild/></div>
      </MyReactor>);

      const eSrc = component.find(".deeper").instance();
      Reactor.dispatchTo(eSrc, new CustomEvent("deepAction", {bubbles:true}));
      expect(deepAction).toHaveBeenCalledTimes(1);

      function AnotherChild({}) { return <div><div className="deeper"></div></div> }
      function SomeOtherChild({}) { return <div><Action deepAction={deepAction} /></div> }
    });

    it("issues NoActorFound when an event is unhandled", () => {
      const gotNoActorFound = jest.fn();
      const component = mount(<MyReactor>
        <Action debug={0} NoActorFound={gotNoActorFound} />
        <div className="event-source"></div>
      </MyReactor>);

      const eSrc = component.find(".event-source").instance();
      Reactor.dispatchTo(eSrc, new CustomEvent("unknownAction", {bubbles:true}));

      expect(gotNoActorFound).toHaveBeenCalledTimes(1);
    })
  });


  describe("is an actor hub", () => {
    it("actors must have a name()", () => {
      expect( () => {
        @Actor
        class BadBoy {}
      }).toThrow(/name()/);
    });

    const stuff = "stuff";
    const mockData = [{some:stuff}];

    @Actor
    class ToyDataActor extends React.Component {
      create = Reactor.bindWithBreadcrumb(jest.fn(), this);
      getData() { return mockData }
      name() { return "members" };
      render() {
        let {children} = this.props;

        return <div className="some-toyData-actor">
          <Action debug={0} create={this.create} />
          <Action debug={0} getData={this.getData} />
          {children}
        </div>
      }
    }
    function mkComponent(...moreChildren) {
      return mount(<MyReactor>
        <div className="event-sink"><ToyDataActor /></div>
        <div className="event-source"></div>

        {moreChildren}
      </MyReactor>);
    }

    it("collects declared, collaborating actors: other (Re?)actors that publish their capabilities", () => {
      const component = mkComponent();

      const toyDataActor = component.find(ToyDataActor).instance();
      expect(component.instance().actors.members).toBe(toyDataActor);
      expect(Object.keys(component.instance().actors).length).toBe(1);
    });

    it("rejects actors with duplicate names", () => {
      mockConsole(['error', 'warn']);
      const component = mkComponent(<ToyDataActor key="duplicate" />);

      expect(Object.keys(component.instance().actors).length).toBe(1);
      expect(console.error).toBeCalledWith(expect.stringMatching(/'members' already registered/), expect.any(ToyDataActor));
      expect(console.warn).toBeCalledWith(expect.stringMatching(/existing handler/), expect.anything());

    });

    it("lets children trigger collaborators' actions: allows cousin/uncle nodes to collaborate", () => {
      const component = mkComponent();
      let eSrc = component.find(".event-source").instance();
      Reactor.dispatchTo(eSrc, new CustomEvent("members:create", {bubbles:true, detail: {debug:0}}));

      expect(component.find(ToyDataActor).instance().create.targetFunction).toHaveBeenCalledTimes(1);
    });

    it("honors localized scope of nested non-collaborating reactors:\n    ...doesn't delegate triggered events to them, even with matching event names", () => {
      @Reactor
      class IsolatedReactor extends React.Component {
        create = Reactor.bindWithBreadcrumb(jest.fn(), this);

        render() {
          return <div className="isolated">
            <Action name="members.create" action={this.create} debug={0}/>
          </div>
        }
      }

      const component = mkComponent(<IsolatedReactor key="isolated" />);
      let toyDataMock = component.find(ToyDataActor).instance().create.targetFunction.mock;
      let isolatedMock = component.find(IsolatedReactor).instance().create.targetFunction.mock;

      const actual = {};

      component.find(".isolated").instance().dispatchEvent(new CustomEvent("members.create", {bubbles:true}));
      actual.toyDataCreatedZero = toyDataMock.calls.length;
      actual.isolatedCreatedOne = isolatedMock.calls.length;

      component.find(".event-source").instance().dispatchEvent(new CustomEvent("members.create", {bubbles:true}));
      actual.isolatedCreatedStillOne = isolatedMock.calls.length;

      expect(actual).toEqual({
        toyDataCreatedZero: 0,
        isolatedCreatedOne: 1,
        isolatedCreatedStillOne: 1
      });
    });
  });
  describe("is an event hub", () => {
    it("collects declared events - event sources that any child can subscribe to");
    it("collects listeners for events it is mediating");
    it("broadcasts triggered events to each listener");
    it("allows listener requests to pass upstream, for events it doesn't mediate");
    it("Each level emits a NoEventSourceFound event when a listener request doesn't match any event-source");
  });
  describe("- a localized actor hub", () => {
    it("responds to its own actions")
    it("collects local actors and responds to action events triggered under its scope")
    it("allows all unrecognized events to trigger actions in higher-level scopes")
    it("can react to any unrecognized events (e.g. notifying a developer that they happened and were uncaught) without interference")
    it("can recognize and react to events that were not handled by a higher-level scope")
  });
});