"use strict";
let autofillController = require('./lib/autofill_chrome');
let utils = require('./lib/utils');

console.log(autofillController);

function setUpObserver(processMutation) {
  processMutation(); // sometimes, the page loads and no further mutations happen
  let observer = new MutationObserver(utils.throttle(processMutation, 3000));
  window.observer = observer;
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  return observer;
}

setUpObserver(function() {
  console.log(autofillController.autofill.extractForms(1));
});
