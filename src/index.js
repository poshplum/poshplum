import React from 'react';
import { render } from 'react-dom';
import {withTopMenu} from './components/layout';


const root = document.getElementById('root');
@withTopMenu
class MyTestPage extends React.Component {
  render() {
    return <div>My content</div>
  }
}

render((
  <div><h1>Test with top menu</h1>
    <MyTestPage />
  </div>
), root);
