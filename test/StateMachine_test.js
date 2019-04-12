import withStateMachine from "../src/components/withStateMachine";
import * as React from "react";
import {mount} from "enzyme/build";

describe("component withStateMachine", () => {
  describe("purpose and behavior", () => {
    it("implements the State Machine pattern for any UI application");
    it("has a list of named states");
    it("each state has named transitions that lead to other named states");
    it("each transition can have a predicate - a function which can block the transition");
    it("has a hasState(stateName) method for checking the current state during render");
    it("is its own Reactor");
    it("exposes all transitions as named Actions, to allow control from outside the component");
    it("if needed, can be updated to emit StateChanged events, to allow observation from outside the component");
  });

  @withStateMachine
  class MyStateMachine extends React.Component {
    // debugState = 1
    allowClose() {
      this.allowed = true;
    }
    canClose = () => {
      // console.warn("allowing close? ", this.allowed)
      return !!this.allowed
    };
    update() {
      const promise = new Promise((res) => {this.resolveRender = res});
      this.setState({updated:1})
      return promise;
    }
    componentDidUpdate() {
      if (this.resolveRender) {
        let resolve = this.resolveRender;
        this.resolveRender = null;
        resolve();
      }
    }

    render() {
      let {State} = this.constructor;
      return <div>
        <State name="default" transitions={{"open": "opened"}} />
        <State name="opened" transitions={{"close": [this.canClose, "default"]}} />
      </div>
    }
  }

  describe("tests", () => {
    let component, instance;
    beforeEach(async () => {
      component = mount(<MyStateMachine/>);
      instance = component.instance();
    });
    it("extracts the State's found as children", async () => {
      expect(Object.keys(instance.states).length).toBe(2);
    });

    it("has state.currentState='default' after mounting", async () => {
      expect(instance.state.currentState).toBe("default");
    });

    it("hasState(default) by default", async () => {
      expect(instance.hasState('default')).toBeTruthy();
    });

    it("changes state when it transitions", async () => {
      instance.transition("open");
      expect(instance.state.currentState).toBe("opened");
    });

    it("does not change state when the transition predicate returns false", async () => {
      instance.transition("open");
      await instance.update();

      instance.transition("close");
      await instance.update();
      expect(instance.state.currentState).toBe("opened");
    });

    it("changes state when the predicate doesn't return false", async () => {
      instance.transition("open")
      expect(instance.state.currentState).toBe("opened");
      instance.allowClose();
      instance.transition("close");
      expect(instance.state.currentState).toBe("default");
    });

  });
  

});