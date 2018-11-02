import React from 'react';
import { render } from 'react-dom';
import {withTopMenu} from './components/layout';


const root = document.getElementById('root');

@withTopMenu
class MyTestPage extends React.Component {
  render() {
    <div>My content</div>
  }
}

render((
  <MenuBarLayout />

), root);
