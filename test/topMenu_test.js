import Layout from '../src/components/layout';
import TopMenu from '../src/components/layouts/topmenu';

import React from 'react';
import renderer from 'react-test-renderer';
import {shallow,mount,render} from 'enzyme';
import {getClassName} from "../src/helpers/ClassNames";
import toJson from 'enzyme-to-json';

describe('Top Menu Layout', () => {
  const {Menu, Title, Body} = TopMenu;


  let titleText = "title text";
  let menuLink = "MenuItem"
  let bodyText = "Page content";

  describe('card primitive', () => {

    it("has meaningful types for each slot component", () => {
      expect(<Menu />.type).toBe(Menu)
      expect(<Title />.type).toBe(Title)
      expect(<Body />.type).toBe(Body)
    });
    it('Places markup into all the slots', () => {

      const component = mount(
        <TopMenu>
          <Menu><a href="#">{menuLink}</a></Menu>
          <Title>{titleText}</Title>

          {bodyText}
        </TopMenu>
      );
      // console.log(component.html());
      expect(component.find("div.page-body").text()).toBe(bodyText);
      expect(component.find("h1").text()).toBe(titleText);
      expect(component.find("nav section a").text()).toBe(menuLink);
    })
  })

});
