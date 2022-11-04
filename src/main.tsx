import { render } from 'preact'
import { App } from './app'
// import './scss/app.scss'

render(<App />, document.getElementById('app') as HTMLElement)
