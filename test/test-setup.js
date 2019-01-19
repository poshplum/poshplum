var enzyme = require('enzyme');
import 'raf/polyfill';
import 'jest-mock-console/dist/setupTestFramework.js'
import mockConsole from 'jest-mock-console';
import doMockConsoleSetup from 'jest-mock-console/dist/setupTestFramework';


var Adapter = require('enzyme-adapter-react-16');
enzyme.configure({ adapter: new Adapter() });

global.mockConsole = mockConsole;

global.dit = it.only;
global.xit = it.skip;

global.ddescribe = describe.only;
global.xdescribe = describe.skip;

// see https://github.com/facebook/react/issues/11098#issuecomment-370614347
global.noConsoleErrors = (callback) => {
  // before/after would be nicer maybe. except not before/after every test :(
  jest.spyOn(console, 'error')
  global.console.error.mockImplementation(() => {});
  try {
    callback();
  } catch(e) {  // ensure we restore mocks AND rethrow if there was an error
    global.console.error.mockRestore()
    throw e;
  }
  global.console.error.mockRestore();
}