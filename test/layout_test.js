import {Layout} from '../src/components/layout';
let dit = it.only;
let xit = it.skip;
import React from 'react';
import renderer from 'react-test-renderer';
import {shallow,mount,render} from 'enzyme';
import toJson from 'enzyme-to-json';


describe('Layout', () => {
  describe('slots', () => {
    let name = "Mine";
    let Mine = Layout.namedSlot(name);
    let Body = Layout.defaultSlot("Body");
    class TestSlots extends Layout {
      static Mine = Mine;
      static Body = Body;
      static slots = {Mine, Body}
      render() {
        let {Mine, Body} = this.slots;
        return <div>
          <h1>template header</h1>
          <div className="mine">
            {Mine}
          </div>
          <div className="body">
            {Body}
          </div>
        </div>
      }
    }

    it('namedSlot - makes a minimal component with matching displayName', () => {
      expect(TestSlots.Mine.displayName).toBe(name);
    });
    it('static getSlots() - returns defined slots', () => {
      expect(TestSlots.getSlots().Mine).toBe(Mine);
    });

    it('static getSlots() - requires slots to be defined', () => {
      expect(() => {
        class TestSlots extends Layout {
          static Mine = Mine
        }
        TestSlots.getSlots();
      }).toThrow("slots not defined")
    });


    describe("rendering", () => {
      it("requires the layout to have a renderer", () => {
        class TestSlots extends Layout {
          static Mine = Mine
          static slots = {Mine}
        }
        expect(() => {
          const component = shallow(
            <TestSlots>
              <Mine>not my sister</Mine>
            </TestSlots>
          );

        }).toThrow("render is not a function");
      });

      it("renders the template content", () => {
        let expected = "not my slave"
        const component = shallow(
          <TestSlots>
            <Mine>{expected}</Mine>
          </TestSlots>
        );

        let foundMine = component.find(Mine)

        expect(component.find("h1").text()).toBe("template header")
        expect(foundMine.shallow().text()).toBe(expected)
      });

      it("renders random children in the body area", () => {
        let expected = "some body content"
        const component = shallow(
          <TestSlots>
            <div>{expected}</div>
            <Mine>you're mine</Mine>
          </TestSlots>
        );
        // console.log(component.debug());

        let foundBody = component.find(Body)
        // console.log(foundBody.debug());


        expect(foundBody.shallow().text()).toBe(expected)
      });

      xit("can be applied as a decorator to any page-level component", () => {
        let expected = "not my child";
        // let withTestSlots = (ComponentClass) => ({...props}) => <TestSlots delegate={<ComponentClass {...props}/>} />
        let withTestSlots = Layout.toDecorator(TestSlots);

        @withTestSlots
        class MyPage extends React.Component {
          render() {

            return <Mine>Badgers!</Mine>
          }
        }

        const component = shallow(<MyPage/>);
        // console.log(component.debug());
        let foundMine = component.find(Mine);

        expect(component.find("h1").text()).toBe("template header");
        expect(foundMine.shallow().text()).toBe(expected)

      })
    });
  });

});
