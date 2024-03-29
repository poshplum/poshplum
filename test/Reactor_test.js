import {mount} from "enzyme/build";
import Reactor, {Actor, Action, Publish, Subscribe} from "../src/components/Reactor";
import * as React from "react";
import delay from "./helpers/delay";

//      https://github.com/airbnb/enzyme/issues/426

const documented = () => {}

describe("Reactor", () => {
  describe("Reactor: behaves as an Actor", () => {
    it("gathers actions declared under its own tree", documented);
    it("listens for triggered events matching those actions", documented);
    it("defines its own RegisterAction event for registering actions", documented);
  });
  describe("Reactor: supervises other Actors", () => {
    it("gathers actors, which are required to have names", documented);
    it("registers actors as named delegates", documented);
    it("listens for actorName:eventName events, providing a tree-spanning event hub", documented);
  });
  describe("Actor", () => {
    it("has a name", documented);
    it("gathers actions", documented);
    it("listens for the matching events", documented);
    it("registers itself by advertising its existence", documented);
    it("can advertise events that it will publish; other actors can listen for these", documented)
    it("has a trigger() method that calls Reactor.trigger(own-dom-node)", documented);
  });

  @Reactor
  class MyReactor extends React.Component {
    isEventCatcher = true
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
    it("collects declared actions: event sinks with handlers responding to those events", async () => {
      const hiya = jest.fn();
      const component = mount(<MyReactor>
        <Action debug={0} informalGreeting={hiya} />
        <div className="event-source"></div>
      </MyReactor>);
      await delay(10);

      const actionCount = Object.keys(component.instance().actions).length;
      expect(actionCount).toBe(2); // sayHello, informalGreeting

      const eSrc = component.find(".event-source").instance();
      Reactor.dispatchTo(eSrc, new CustomEvent("sayHello", {bubbles:true}));
      expect(hiya).not.toHaveBeenCalled();
      expect(component.instance().sayHello.targetFunction).toHaveBeenCalledTimes(1);

      Reactor.dispatchTo(eSrc, new CustomEvent("informalGreeting", {bubbles:true}));
      Reactor.dispatchTo(eSrc, new CustomEvent("informalGreeting", {bubbles:true}));

      expect(hiya).toHaveBeenCalledTimes(2);
      expect(component.instance().sayHello.targetFunction).toHaveBeenCalledTimes(1);
    });

    it("removes its event listeners when unmounting", async() => {
      const hiya = jest.fn();

      const component = mount(<MyReactor>
        <Action debug={0} informalGreeting={hiya} />
        <div className="event-source"></div>
      </MyReactor>);

      const listeningNode = component.find(".myReactor").instance().parentNode;
      component.unmount(); // critical
      await delay(15); // wait for async unlisten

      mockConsole(['error'])

      Reactor.dispatchTo(listeningNode, new CustomEvent("informalGreeting", {bubbles:true}));
      expect(console.error).toBeCalledWith(expect.stringMatching(/unhandled event.*informalGreeting/),
        null, expect.anything(),
        expect.anything(), expect.anything(),
        expect.anything()
      );

      await delay(100); // wait for async unlisten
      expect(hiya).not.toHaveBeenCalled();
      // debugger
      // to confirm *all* listeners were really removed, use node inspector...
      //   ...browse into listeningNode[Symbol(impl)]._eventListeners (all entries in that object should be empty arrays)
      // it'd be nice to have an api for accessing that info for test purposes but alas... not in jsdom 9.12.0 at least
    });

    it("removes actions when their tags are unmounted", async () => {
      @Reactor
      class UnmountTest extends React.Component {
        thing1 = jest.fn();
        thing2 = jest.fn();
        mkRenderPromise() {
          return new Promise((res) => {this.resolveRender = res});
        }
        addActions() {
          let t = this.mkRenderPromise();
          this.setState({add:1});
          return t
        }
        removeExtraAction() {
          let t = this.mkRenderPromise();
          this.setState({remove:1});
          return t
        }
        componentDidUpdate() {
          if (this.resolveRender) {
            let resolve = this.resolveRender;
            this.resolveRender = null;
            resolve();
          }
        }
        render() {
          let {id} = this.props
          let {add, remove} = this.state || {};
          return <div>
            {add && <Action debug={0} id={`${id}-thing1`} thing1={this.thing1} />}
            {add && !remove && <Action debug={1} id={`${id}-thing2`} debug={0} thing2={this.thing2} />}
            {this.props.children}
          </div>
        }
      }

      let component = mount(<UnmountTest id="outer">
        <div className="nested"><UnmountTest id="inner"/></div>
      </UnmountTest>);
      await delay(120);

      let instance1 = component.instance();

      let baseLength = Object.keys(instance1.actions).length;
      await instance1.addActions();
      await delay(120);
      expect(Object.keys(instance1.actions).length).toBe(baseLength+2);


      // -- make sure it doesn't remove matching action names from nested reactors
      let instance2 = component.find(".nested").find(UnmountTest).instance();
      await instance2.addActions();
      await delay(120);
      // console.log(instance1.el.outerHTML);

      let listenerCount = instance2.listening.length;

      await instance2.removeExtraAction();
      await delay(120);
      // console.warn(instance2.actions);
      // console.log(instance1.el.outerHTML)
      expect(Object.keys(instance2.actions).length).toBe(baseLength+1);
      // --
      // console.warn(instance1.actions)

      expect(Object.keys(instance1.actions).length).toBe(baseLength+2);
      await instance1.removeExtraAction();
      await delay(120);
      // console.warn(instance2.actions);


      expect(Object.keys(instance1.actions).length).toBe(baseLength+1);

      // -- add actions back, and make sure the list of listeners doesn't grow
      await instance2.addActions();
      await delay(120);
      expect(instance2.listening.length).toBe(listenerCount);

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
      if (actionCount !== 2) {
        // console.log(component.instance().actions);
        expect(actionCount).toBe(2); // sayHello, informalGreeting
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

    describe("<Publish> events", () => {
      it("can declare events that it will emit", async () => {
        const component = mount(<MyReactor>
          <Publish debug={0} event="imOK" />
        </MyReactor>);

        const eventCount = Object.keys(component.instance().events).length;
        expect(eventCount).toBe(2);  // imOK plus error

        // const eSrc = component.find(".event-source").instance();
        // Reactor.dispatchTo(eSrc, new CustomEvent("imWayCool", {bubbles:true}));
      });

          class ListeningElement extends React.Component {
            verifyCool = jest.fn();
            alsoVerifyCool = jest.fn();
            another() {
              const promise = new Promise((res) => {this.resolveRender = res});
              this.setState({another: true})
              return promise;
            }
            none() {
              const promise = new Promise((res) => {this.resolveRender = res});
              this.setState({
                another: false,
                none: true
              });
              return promise
            }
            componentDidUpdate() {
              if (this.resolveRender) {
                let resolve = this.resolveRender;
                this.resolveRender = null;
                resolve();
              }
            }

            render() {
              let {another, none} = (this.state || {});

              return <div className="event-listener">
                {!none && <Subscribe debug={0} imWayCool={this.verifyCool} />}
                {!none && another && <Subscribe debug={0} imWayCool={this.alsoVerifyCool} />}
              </div>
            }
          }

      it("allows any components to <Subscribe> for declared events", async () => {
        const component = mount(<MyReactor>
          <div className="publisher">
            <Publish debug={0} event="imWayCool" />
          </div>
          <ListeningElement />
        </MyReactor>);

        const listeners = component.instance().events['imWayCool'].subscribers;
        const listenerInstance = component.find(ListeningElement).instance();

        const eSrc = component.find(".publisher").instance();
        await delay(1);

        Reactor.dispatchTo(eSrc, new CustomEvent("imWayCool", {bubbles:true}));
        expect(listenerInstance.verifyCool).toHaveBeenCalledTimes(1);
        component.instance().trigger("imWayCool")
        expect(listenerInstance.verifyCool).toHaveBeenCalledTimes(2);
      });


      it("triggers an 'error' if trigger(eventName) has an unknown event name", async () => {
        const unknown = jest.fn()
        const component = mount(<MyReactor>
          <Action debug={0} error={unknown} />
        </MyReactor>);

        await delay(1);
        component.instance().trigger("someWeirdEvent")

        // this._listenerRef.current.dispatchEvent(
        //   Reactor.UnknownEvent({eventName: this.eventName})
        // )
        expect(unknown).toHaveBeenCalled();
      });

      it("allows multiple <Subscribe>rs", async () => {
        const component = mount(<MyReactor>
          <div className="publisher">
            <Publish debug={0} event="imWayCool" />
          </div>
          <ListeningElement />
        </MyReactor>);

        const listeners = component.instance().events['imWayCool'].subscribers;

        const eSrc = component.find(".publisher").instance();
        const listener = component.find(ListeningElement).instance();
        await listener.another();

        await delay(1);
        Reactor.dispatchTo(eSrc, new CustomEvent("imWayCool", {bubbles:true}));
        expect(listener.verifyCool).toHaveBeenCalledTimes(1);
        expect(listener.alsoVerifyCool).toHaveBeenCalledTimes(1);
      });

      it("stops listening when <Subscribe> is unmounted", async () => {
        const component = mount(<MyReactor>
          <div className="publisher">
            <Publish debug={0} event="imWayCool" />
          </div>
          <ListeningElement />
        </MyReactor>);


        let instance = component.instance();
        await delay(1)
        expect(instance.events.imWayCool).toBeTruthy();
        expect(instance.events.imWayCool.subscribers).toBeTruthy();


        let listenerInstance = component.find(ListeningElement).instance();

        expect(listenerInstance.verifyCool).toHaveBeenCalledTimes(0);
        expect(listenerInstance.alsoVerifyCool).toHaveBeenCalledTimes(0);

        const eSrc = component.find(".publisher").instance();
        const listener = component.find(ListeningElement).instance();

        await listener.none();
        await delay(1)

        mockConsole(['error'])
        Reactor.dispatchTo(eSrc, new CustomEvent("imWayCool", {bubbles:true}));
        // expect(console.error).toBeCalledWith(expect.stringMatching(/unknown event.*imWayCool/),
        //   expect.anything(), expect.anything(), expect.anything());

        expect(listenerInstance.verifyCool).toHaveBeenCalledTimes(0);
        expect(listenerInstance.alsoVerifyCool).toHaveBeenCalledTimes(0);
      });

      it("a reactor with isEventCatcher=true triggers an 'error' event if an unknown event is Subscribe'd", async () => {
        const unknown = jest.fn();

        @Reactor
        class Catcher extends React.Component {
          isEventCatcher = true;
          render() {
            return <div>{this.props.children}</div>
          }
        }
        class Tester extends React.Component {
          update = () => {this.setState({updated:1})}
          render() {
            let {updated} = this.state || {}
            return <Catcher>
              <Subscribe error={unknown} />

              {updated && <Subscribe crazyEvent={() => {}} />}
            </Catcher>
          }
        }
        mockConsole(['warn']);

        const component = mount(<Tester />);
        await delay(100);
        component.instance().update();
        await delay(100);

        expect(unknown).toHaveBeenCalled();
        expect(console.warn).toBeCalledWith(expect.stringMatching(/Subscribe.*crazyEvent/));
      });

      describe("optional Subscribe", () => {
        let error = jest.fn()

        it("does not throw an error event", async () => {
          let thing = mount(<MyReactor>
            <Subscribe error={error} />
            <Subscribe optional someWildEvent={() => "whatever"} />
          </MyReactor>);
          expect(error).not.toHaveBeenCalled()
        });
      });
      describe("<Subscribe> to event <Publish>ed in an @Actor", () => {
        @Actor
        class PublishesEvent extends React.Component {
          name() { return "published" }
          greet() {
            this.notify("greeting", {hi:"hi"})
          }
          render() {
            return <Publish debug={1} event="greeting" />
          }
        }


        it("adds the Actor name to the event name during <Publish> and trigger()", async () => {
          const sayHi = jest.fn().mockImplementation( ({detail}) => {
            expect(detail).toEqual(expect.objectContaining({hi:"hi"}));
          } );
          const dataService = mount(<MyReactor>
            <PublishesEvent />
            <Subscribe published＿greeting={sayHi} />
          </MyReactor>);

          await delay(1);

          dataService.find(PublishesEvent).instance().greet();
          expect(sayHi).toHaveBeenCalled()

        });

         it("defers listening long enough for simultaneously-mounted Actors to <Publish> their events", async () => {
          const sayHi = jest.fn()
          const unknown = jest.fn();
          const dataService = mount(<MyReactor>
            <Action debug={0} error={unknown} />

              <PublishesEvent />
              <Subscribe published＿greeting={sayHi} />
          </MyReactor>);

          await delay(1);

          dataService.find(PublishesEvent).instance().greet();
          expect(unknown).not.toHaveBeenCalled()
          expect(sayHi).toHaveBeenCalled()
        });
      });
    });
  });
  describe("Reactor.dispatchTo() aka trigger()", async () => {
    it("requires a DOM node for triggering", async () => {
      mockConsole(['warn']);
      expect(Reactor.dispatchTo).toBe(Reactor.trigger);
      expect(Reactor.dispatchTo).toThrow(/required.*DOM node/)
      const warning = console.warn.mock.calls[0][0]
      expect(warning.message).toMatch(/required.*DOM node/)
    });

    @Reactor
    class DispatchTest extends React.Component {
      customEvent1 = jest.fn(() => { if(0) console.warn("custom event 1") });
      // customEvent2 = jest.fn(() => { console.warn("custom event 2") });
      render() {
        return <div>
          <Publish debug={0} event="myCustomEvent1" />

          {/*<Publish event="myCustomEvent2" />*/}
          <Subscribe debug={0} myCustomEvent1={this.customEvent1} />
          {/*<Subscribe debug={1} myCustomEvent2={this.customEvent2} />*/}

          <div className="eSrc"></div>
        </div>
      }
    }
    describe("with a named event in arg 2", () => {
      let component, instance, eSrc;
      beforeEach(async () => {
        component = mount(<DispatchTest debug={1} />);
        instance = component.instance();
        await delay(1)
        eSrc = component.find(".eSrc").instance();
        Reactor.trigger(eSrc, "myCustomEvent1", {good:"things"})
      });
      it("dispatches a custom event matching the name", async () => {
        expect(instance.customEvent1).toHaveBeenCalled()
      });
      it("includes the event details given in arg 3", async () => {
        const args = instance.customEvent1.mock.calls[0];
        // console.warn("args", args);
        expect(args[0].detail).toEqual(expect.objectContaining({
          good:"things"
        }));
      });
    });

    describe("with a CustomEvent in arg 2", async() => {
      it("directly dispatches the event", async () => {
        const component = mount(<DispatchTest debug={1} />);
        const instance = component.instance();
        const eSrc = component.find(".eSrc").instance();
        await delay(1);
        Reactor.trigger(eSrc, new CustomEvent("myCustomEvent1", {bubbles: true, detail:{debug:0}}));
        expect(instance.customEvent1).toHaveBeenCalled()
      });
    });


    it("issues 'error' event when an event is unhandled", async () => {
      const unknown = jest.fn();
      const component = mount(<MyReactor>
        <Subscribe debug={0} error={unknown} />

        <DispatchTest debug={1} />
      </MyReactor>);
      await delay(1);
      const instance = component.find(DispatchTest).instance();
      const eSrc = component.find(".eSrc").instance();

      Reactor.dispatchTo(eSrc, "nothingGood", {foo:"bar"});
      expect(unknown).toHaveBeenCalled();
      const args = unknown.mock.calls[0];
      // console.warn("args", args);
      expect(args[0].detail).toEqual(expect.objectContaining({
          foo:"bar", error: expect.stringMatching(/unhandled event.* nothingGood/)
      }));
    })

  });


  describe("is an actor hub", () => {
    it("actors must have a name()", () => {
      expect( () => {
        @Actor
        class BadBoy {}
      }).toThrow(/name\(\)/);
    });

    const stuff = "stuff";
    const mockData = [{some:stuff}];

    @Actor
    class ToyDataActor extends React.Component {
      create = Reactor.bindWithBreadcrumb(jest.fn(), this);
      bareAction = Reactor.bindWithBreadcrumb(jest.fn(), this);

      getData() { return mockData }
      name() { return "members" };
      render() {
        let {children} = this.props;

        return <div className="some-toyData-actor">
          <Action debug={0} create={this.create} />
          <Action bare debug={0} bareAction={this.bareAction} />
          <Action debug={0} getData={this.getData} />
          {children}
        </div>
      }
    }
    function mkComponent(children1, children2) {
      return mount(<MyReactor>
        <div className="event-sink"><ToyDataActor>{children2}</ToyDataActor></div>
        <div className="event-source"></div>

        {children1}
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

    it("helps cousins/uncles (and their children) trigger actions and get a 'result' passed back in event detail, using eventResult", async () => {
      const expectedHi = "it's me";
      const getSomething = jest.fn(({detail:{hi}}) => {
        expect(hi).toBe(expectedHi);

        return hi;
      });
      const component = mkComponent(null, <Action debug={1} returnsResult getSomething={getSomething}/>);
      await delay(1);

      let eSrc = component.find(".event-source").instance();
      let result = await Reactor.eventResult(eSrc, 'members:getSomething', {hi:expectedHi});
      expect(result).toBe(expectedHi);

      expect(getSomething).toHaveBeenCalledTimes(1);
    });


    it("exposes 'bare' actions without adding actor name", () => {
      const component = mkComponent();
      let eSrc = component.find(".event-source").instance();
      Reactor.dispatchTo(eSrc, new CustomEvent("bareAction", {bubbles:true, detail: {debug:0}}));

      expect(component.find(ToyDataActor).instance().bareAction.targetFunction).toHaveBeenCalledTimes(1);
    });

    it("removes actors and their actions, when the actors unmount", async () => {
      @Actor
      class UnmountActorTest extends React.Component {
        name() { return "me" }
        foo = jest.fn()
        render() {
          return <div>
            <Action foo={this.foo} />
          </div>
        }
      }
      class AnotherActor extends UnmountActorTest {
        name() { return "another" }
      }
      @Reactor
      class UnmountTest extends React.Component {
        thing1 = jest.fn();
        thing2 = jest.fn();
        mkRenderPromise() {
          return new Promise((res) => {this.resolveRender = res});
        }
        addActors() {
          let t = this.mkRenderPromise();
          this.setState({add:1});
          return t
        }
        removeExtraActor() {
          let t = this.mkRenderPromise();
          this.setState({remove:1});
          return t
        }
        componentDidUpdate() {
          if (this.resolveRender) {
            let resolve = this.resolveRender;
            this.resolveRender = null;
            resolve();
          }
        }
        render() {
          let {add, remove} = this.state || {};
          return <div>
            {add && <UnmountActorTest />}
            {add && !remove && <AnotherActor />}
          </div>
        }
      }

      let component = mount(<UnmountTest />);
      let instance = component.instance();
      let baseLength = Object.keys(instance.actions).length;
      await instance.addActors();

      expect(Object.keys(instance.actions).length).toBe(baseLength+2);
      expect(Object.keys(instance.actors).length).toBe(2);
      await instance.removeExtraActor();

      expect(Object.keys(instance.actors).length).toBe(1);
      // console.warn(instance.actions)
      expect(Object.keys(instance.actions).length).toBe(baseLength+1);
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

});