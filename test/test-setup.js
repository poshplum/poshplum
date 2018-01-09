var enzyme = require('enzyme');
import 'raf/polyfill';

var Adapter = require('enzyme-adapter-react-16');
enzyme.configure({ adapter: new Adapter() });



