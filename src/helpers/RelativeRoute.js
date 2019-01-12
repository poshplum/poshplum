import {Route} from "react-router-dom";

export default class RelativeRoute extends Route {
  computeMatch(ref,router) {
    const result = super.computeMatch(ref,router);

    return result
  }
}