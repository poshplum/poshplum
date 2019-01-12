let usedHack = true;
// try {
//   document.querySelector(':focus-within')
// } catch(e) {
  usedHack = true;

  (function(window, document){
    'use strict';
    var slice = [].slice;
    var removeClass = function(elem){
      elem.classList.remove('focus-within');
    };
    var updateFocusWithin = (function(){
      var running, last;
      var action = function(){
        var element = document.activeElement;
        running = false;
        if(last !== element){
          last = element;
          slice.call(document.getElementsByClassName('focus-within')).forEach(removeClass);
          while(element && element.classList){
            element.classList.add('focus-within');
            element = element.parentNode;
          }
        }
      };
      return function(){
        if(!running){
          requestAnimationFrame(action);
          running = true;
        }
      };
    })();
    document.addEventListener('focus', updateFocusWithin, true);
    document.addEventListener('blur', updateFocusWithin, true);
    updateFocusWithin();
  })(window, document);
// }

export default usedHack;
