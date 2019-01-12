import Layout from '../src/components/layout';
import React, {Component} from 'react';
import renderer from 'react-test-renderer';
import {shallow,mount,render} from 'enzyme';
import toJson from 'enzyme-to-json';
import {getClassName} from "../src/helpers/ClassNames";


describe('Layout', () => {
  let name = "Mine";
  let Mine = Layout.namedSlot(name);
  let Body = Layout.defaultSlot("Body");

  class TestSlots extends Layout {
    static Mine = Mine;
    static Body = Body;
    static slots = {Mine, Body};

    render() {
      let {Mine, Body} = this.slots;

      // console.log("render testSlots")
      return <div>
        <h1>template header</h1>
        <div className="mine">
          <div className="nested">
            {Mine}
          </div>
        </div>
        <div className="body">
          {Body}
        </div>
      </div>
    }
  }

  describe('slots', () => {
    it('namedSlot - makes a minimal component with matching displayName', () => {
      let expectedName = "MyFunSlot";
      expect(Layout.namedSlot(expectedName).displayName).toBe(expectedName);
    });

    it('static getSlots() - returns defined slots', () => {
      expect(TestSlots.getSlots().Mine).toBe(TestSlots.Mine);
      expect(TestSlots.getSlots().Body).toBe(TestSlots.Body);
    });

    it('static getSlots() - requires slots to be defined', () => {
      expect(() => {
        class TestSlots extends Layout {
          static Mine = Mine
        }
        TestSlots.getSlots();z
      }).toThrow("slots not defined")
    });

    describe("rendering", () => {
      it('warns about slots not found as static class members', () => {
        class MyTestSlots extends Layout {
          // static Mine = Mine
          static slots = {Mine};
          render() {
            const {Mine} = this.slots ;
            return <div>{Mine}</div>
          }
        }
        mockConsole('warn');
        mount(<MyTestSlots />)
        expect(console.warn).toBeCalledWith(expect.stringMatching(/'Mine' is not declared as a static member/))
      });

      it("requires the layout to have a renderer", () => {
        class MyTestSlots extends Layout {
          static Mine = Mine
          static slots = {Mine}
        }
        expect(() => {
          const component = shallow(
            <MyTestSlots>
              <Mine>not my sister</Mine>
            </MyTestSlots>
          );

        }).toThrow("render is not a function"); // (* or some equally good error!)
      });

      it("renders the template content", () => {
        let expected = "not my slave!";
        let somethingMore = "moreContent";

        const component = mount(
          <TestSlots>
            <Mine>{expected}</Mine>
            {somethingMore}
          </TestSlots>
        );

        let foundMine = component.find(Mine)
        // console.log(component.html())
        expect(component.find("h1").text()).toBe("template header")
        expect(component.find("div.mine").text()).toBe(expected)
        expect(component.find("div.body").text()).toBe(somethingMore)
        // expect(foundMine.shallow().text()).toBe(expected)
      });

      it("renders non-matching children in the body area", () => {
        let expected = "some body content"
        let expected2 = "moar body content"
        const component = mount(
          <TestSlots>
            <div className="first">{expected}</div>
            <div className="second">{expected2}</div>
            <Mine>...</Mine>
          </TestSlots>
        );
        // console.log(component.debug());

        let foundBody = component.find(Body)
        // console.log(foundBody.debug());

        expect(foundBody.find(".first").text()).toMatch(expected);
        expect(foundBody.find(".second").text()).toMatch(expected2);
      });
    });

    describe('Fancy slots (w/ markup)', () => {
      class PrettySlot extends React.Component {
        render() {
          return <div className="pretty">{this.props.children}</div>
        }
      }
      class FancySlotLayout extends Layout {
        static PrettySlot = PrettySlot;
        static slots = {PrettySlot};
        render() {
          let slots = this.slots;
          return <div className="layout">
            {slots.PrettySlot}
          </div>
        }
      }

      it("renders into the slot", () => {
        let expected = "argh";
        const component = mount(
          <FancySlotLayout>
            <PrettySlot>{expected}</PrettySlot>
          </FancySlotLayout>
        );

        let foundPretty = component.find(PrettySlot);
        let foundDiv = component.find("div.pretty");

        expect(foundPretty.text()).toBe(expected)
        expect(foundDiv.text()).toBe(expected);
      });

      it("renders multiple into the slot", () => {
        let expected = "argh";
        let expected2 = "why?";
        const component = mount(
          <FancySlotLayout>
            <PrettySlot>{expected}</PrettySlot>
            <PrettySlot>{expected2}</PrettySlot>
          </FancySlotLayout>
        );
        let foundPretty = component.find(PrettySlot);
        let foundDiv = component.find("div.pretty");

        expect(foundPretty.text()).toMatch(expected);
        expect(foundPretty.text()).toMatch(expected2);

        expect(foundDiv.text()).toMatch(expected);
        expect(foundDiv.text()).toMatch(expected2);
      });

      it("also works with xxxSlot().withMarkup()", () => {
        let expected = "some content";
        let defaultContent = "good stuff";

        let Formatted = Layout.namedSlot("Formatted").withMarkup(({...props}) => <span className="pretty">{props.children}</span>);
        let DefaultSlot = Layout.defaultSlot("DefaultSlot").withMarkup(({children}) => <div className="default">{children}</div>);

        class AnotherMarkupSlot extends Layout {
          static Formatted = Formatted;
          static DefaultSlot = DefaultSlot;
          static slots = {Formatted, DefaultSlot};

          render() {
            let {Formatted, DefaultSlot} = this.slots
            return <div>
              <menu>{DefaultSlot}</menu>
              <div>In some layout-like location, pre-formatted content will be injected:

                <div>{Formatted}</div>
              </div>
            </div>
          }
        }


        const component = mount(
          <AnotherMarkupSlot>
            <Formatted>{expected}</Formatted>
            {defaultContent}
          </AnotherMarkupSlot>
        );
        let foundPretty = component.find("span.pretty");
        expect(foundPretty.text()).toBe(expected)
        expect(component.find("div.default").text()).toBe(defaultContent);

      });
    });

  });
  describe("composed layout", () => {
    let sharedMineContent = "MineSlot ";

    class PackagedPage extends Component {
      render() {
        let {children} = this.props
        return <TestSlots>
          <Mine>{sharedMineContent}</Mine>
          {children}
        </TestSlots>
      }
    }

    it("includes all instances of slot content from each composition layer", () => {
      const localMineContent = "localContent";
      const component = mount(
        <PackagedPage>
          <Mine>{localMineContent}</Mine>
          <p>Other stuff</p> {/* needed to exercise children-as-array */}
        </PackagedPage>
      );
      // console.log(component.html())
      let mine = component.find(".mine .nested");
      expect(mine.text()).toMatch(sharedMineContent)
      expect(mine.text()).toMatch(localMineContent)
    })
  })
});
