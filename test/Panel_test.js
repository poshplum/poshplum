import Panel from '../src/components/Panel';
import TopMenu from "../src/components/layouts/topmenu";
import {mount} from "enzyme/build";
import React from "react";

describe("<Panel>", () => {
  const {Title, Icon, Header, Body, Footer} = Panel;

  let titleText = "title text";
  let icon= "👴";
  let bodyText = "Page content";
  let headerText = "header stuff";
  let footerText = "things in footer";

  describe('layout', () => {

    it("has meaningful types for each slot component", () => {
      expect(<Title />.type).toBe(Title)
      expect(<Icon />.type).toBe(Icon)
      expect(<Header />.type).toBe(Header)
      expect(<Body />.type).toBe(Body)
      expect(<Footer />.type).toBe(Footer)
    });
    it('Places markup into all the slots', () => {
      const component = mount(
        <Panel>
          <Title>{titleText}</Title>
          <Icon>{icon}</Icon>
          <Header>{headerText}</Header>

          {bodyText}

          <Footer>{footerText}</Footer>
        </Panel>
      );
      // console.log(component.html());
      expect(component.find("div.panel-title").text()).toMatch(titleText);
      expect(component.find("div.panel-title").text()).toMatch(icon);
      expect(component.find("div.panel-header").text()).toMatch(headerText);

      expect(component.find("div.panel-body").text()).toBe(bodyText);
      expect(component.find("div.panel-footer").text()).toMatch(footerText);
    })
  });
  it("className= prop is passed through to element", () => {
    const component = mount(
      <Panel className="footy">
      </Panel>
    );
    expect(component.hasClass("footy")).toBe(true);
  })
  it("other props are passed through to element", () => {
    const component = mount(
      <div>
        <Panel foo="bar">
          body content
        </Panel>
      </div>
    );
    expect(component.find('div.panel[foo="bar"]')).toHaveLength(1)
  });

})