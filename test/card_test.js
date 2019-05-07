import Layout from '../src/components/layout';
import Cards, {Card} from '../src/components/Cards';

import React from 'react';
import renderer from 'react-test-renderer';
import {shallow,mount,render} from 'enzyme';
import toJson from 'enzyme-to-json';
import MockRouter from 'react-mock-router';


describe('Card layouts', () => {
  describe('card primitive', () => {
    let {Icon, Title, Body, Footer, Label} = Card;
    it("has meaningful types for each slot component", () => {
      expect(<Icon />.type).toBe(Icon)
      expect(<Title />.type).toBe(Title)
      expect(<Body />.type).toBe(Body)
      expect(<Footer />.type).toBe(Footer)
    });
    it('Places markup into all the slots', () => {
      let iconText = "❤️";
      let titleText = "title text";
      let label = "Status: good";
      let bodyText = "card content";
      let footerText = "myFooter";

      const component = mount(
        <Card>
          <Icon>{iconText}</Icon>
          <Title>{titleText}</Title>
          <Label>{label}</Label>

          card content

          <Footer>{footerText}</Footer>
        </Card>
      );

      expect(component.find("div.card-body").text()).toBe(bodyText);
      expect(component.find("div.card-title").text()).toBe(titleText);
      expect(component.find("div.chip.pop-left").text()).toBe(iconText);
      expect(component.find("div.card-footer").text()).toBe(footerText);
      expect(component.find("div.chip.pop-right").text()).toBe(label);
    });
    it("keeps text together", async () => {
      const component = mount(
        <Card>
          text
        </Card>
      )
      const body = component.instance().slots.Body;

      expect(body.props.children.length).toBe(1);
    });
    it("doesn't have a .card-header without (title || icon || label) provided", () => {
      const component = mount(
        <Card>
          empty body
        </Card>
      );
      expect(component.find(".card-header")).toHaveLength(0)
    })
  });
  describe("link= prop", () => {
    const push = jest.fn();
    const bodyText = "bodyText";
    let component;
    let href = (h) => {
      // console.warn("href", h);
      return h.pathname;
    };
    beforeEach(async () => {

      component = mount(
        <MockRouter push={push} createHref={href}>
          <Card link="/hi">
            {bodyText}
          </Card>
        </MockRouter>
      );
    });
    it("adds a link to the card", function () {
      // console.warn(component.find("a").instance())
      // console.warn(component.find("a").at(0).props());
      expect(component.find("a").at(0).props().href).toBe("/hi");
    });
    it("navigates to the link on click of the card", async () => {
      component.simulate('click', { preventDefault() {}});
      expect(push).toHaveBeenCalledWith(`/hi`)
    });

  });
  test.todo("passes compact= prop to a className");
  test.todo("passes active= prop to a className");
  test.todo("passes other className='s through to the element")
  test.todo("passes other props to the element");

  describe("render= prop", () => {
    test.todo("is used for rendering if there's an item= prop also");
    test.todo("in dev environment, it suggests using a separate component to accept an item and return a <Card>");
  });
  describe('card subclass', () => {
    class CardClass extends Card {
      render() {
        let {Mine, Body} = this.slots;
        let {thing} = this.props.item;

        // console.log("render testSlots")
        return <div>
          <Card.Body>{thing}</Card.Body>
        </div>
      }
    }

    it("works when used in <Cards.List> as a slot", async () => {
      let cardsList = mount(<Cards.List items={[{id:1, thing:"thing1"}, {id:2,thing:"thing2"}]} >
        <CardClass />
      </Cards.List>)

      // await delay(1);
      let thing2 = cardsList.find(CardClass).at(1) //.instance();
      // console.error(thing2.debug())
      expect(thing2.text()).toBe("thing2")
    });
  });
  describe("<Cards.List>", () => {
    let things;
    beforeEach(async () => {
      things = []
    });
    class CardClass extends Card {
      render() {
        let thing = this.props.item;

        return <div>
          <Card.Body>{thing.name}</Card.Body>
        </div>
      }
    }
    class ShowThings extends React.Component {
      render() {
        return <Cards.List items={things}>
          <Cards.Empty>No things</Cards.Empty>

          <CardClass />
        </Cards.List>
      }
    }

    it("shows the contents of <Cards.Empty> if there are no items", async () => {
      let stuff = mount(<ShowThings />)
      expect(stuff.text()).toBe("No things")
    });

    it("shows things, and not the <Cards.Empty> if there are things", async () => {
      things = [{id:1, name:"something"},{id:2, name:"extra"}];
      let stuff = mount(<ShowThings />);
      expect(stuff.text()).not.toMatch(/No things/);
      expect(stuff.find(CardClass).at(0).text()).toBe("something");
      expect(stuff.find(CardClass).at(1).text()).toBe("extra");
    });
  });
});