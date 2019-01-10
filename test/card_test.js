import Layout from '../src/components/layout';
import {Card} from '../src/components/Cards';

import React from 'react';
import renderer from 'react-test-renderer';
import {shallow,mount,render} from 'enzyme';
import toJson from 'enzyme-to-json';
import {getClassName} from "../src/helpers/ClassNames";

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

          {bodyText}

          <Footer>{footerText}</Footer>
        </Card>
      );


      expect(component.find("div.card-body").text()).toBe(bodyText);
      expect(component.find("div.card-title").text()).toBe(titleText);
      expect(component.find("div.chip.pop-left").text()).toBe(iconText);
      expect(component.find("div.card-footer").text()).toBe(footerText);
      expect(component.find("div.chip.pop-right").text()).toBe(label);
    });
    it("doesn't have a .card-header without (title || icon || label) provided", () => {

    })
  });
  describe('card subclass', () => {
    class CardClass extends Card {

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

  });
});