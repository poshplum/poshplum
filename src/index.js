import React, {Component} from 'react';
import { render } from 'react-dom';
import { AppContainer } from 'react-hot-loader';

import {Card} from "./components/Cards";

// makes CSS available.
// users can import "poshplum/plum.css"
import './scss/app.scss';

import { BrowserRouter } from 'react-router-dom'
import entries from './helpers/Object.entries.polyfill';
import hack from './helpers/focus-within-hack';
import DocsApp from "./docs/App";

const root = document.getElementById('root');

// https://github.com/nozzle/react-static
// https://github.com/gitname/react-gh-pages
// https://github.com/rafrex/spa-github-pages
// https://facebook.github.io/create-react-app/docs/deployment#step-4-ensure-your-project-s-settings-use-gh-pages
// https://developers.google.com/web/tools/puppeteer/articles/ssr


const load = () => render(
  (
    <AppContainer>
      <BrowserRouter>
        <DocsApp />
      </BrowserRouter>
    </AppContainer>

  ), root
);

// This is needed for Hot Module Replacement
//@TODO legacy code from neurino setup relying HMR not present in rollup.
// Need to try rollup HMR workaround or switch to webpack for dev view.
if (module.hot) {
  module.hot.accept('./docs/index', load);
}

load();
