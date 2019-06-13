import withStateMachine from "../src/components/withStateMachine";
import * as React from "react";
import {mount} from "enzyme";
import delay from "./helpers/delay";

const documented = () => {};
describe("component withStateMachine", () => {
  describe("purpose and behavior", () => {
    it("implements the State Machine pattern for any UI application", documented);
    it("has a list of named states", documented);
    it("each state has named transitions that lead to other named states", documented);
    it("each transition can have a predicate - a function which can block the transition", documented);
    it("each transition can have a effect function that reacts after the state change is performed", documented);
    it("has a hasState(stateName) method for checking the current state during render", documented);
    it("is its own Reactor", documented);
    it("exposes all transitions as named Actions, to allow control from outside the component", documented);
    it("if needed, can be updated to emit StateChanged events, to allow observation from outside the component", documented);
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
    enteredDefaultState = jest.fn();
    isOpening = jest.fn();
    didExpand = jest.fn();
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
        <State onEntry={this.enteredDefaultState} name="default" transitions={{
          "open": "opened",
          "expand": [null, "detail", this.didExpand]
        }} />
        <State name="detail" transitions={{"close": [this.canClose, "default"]}} />
        <State name="opened" onEntry={this.isOpening} transitions={{"close": [this.canClose, "default"]}} />
      </div>
    }
  }

  describe("tests", () => {
    let component, instance;
    beforeEach(async () => {
      component = mount(<MyStateMachine/>);
      await delay(2);
      instance = component.instance();
    });
    it("triggers default onEntry callback", async () => {
      expect(instance.enteredDefaultState).toHaveBeenCalled()
    });
    it("extracts the State's found as children", async () => {
      expect(Object.keys(instance.states).length).toBe(3);
    });

    it("has state.currentState='default' after mounting", async () => {
      expect(instance.state.currentState).toBe("default");
    });

    it("hasState(default) by default", async () => {
      expect(instance.hasState('default')).toBeTruthy();
    });

    it("triggers onEntry during transition to a non-default state", async () => {
      expect(instance.isOpening).not.toHaveBeenCalled()
      instance.transition("open");
      await delay(2);
      expect(instance.isOpening).toHaveBeenCalled()
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

    it("triggers the effect function when specified", async () => {
      await instance.update();
      instance.transition("expand");
      await delay(2);
      expect(instance.didExpand).toHaveBeenCalled();
    });
  });
  

});