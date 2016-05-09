"use strict";
let autofillController = require('./lib/autofill_chrome');
let utils = require('./lib/utils');

console.log(autofillController);

function setUpObserver(processMutation) {
  processMutation(); // sometimes, the page loads at once and no mutations happen
  let observer = new MutationObserver(utils.throttle(processMutation, 3000));
  window.observer = observer;
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  return observer;
}

setUpObserver(function() {
  let extractedForms = autofillController.autofill.extractForms(3);

  console.log(extractedForms);

  if (!chrome.autofill) {
    return;
  }

  // @typedef {Array<AutofillFormResponseData>}
  // AutofillFormResponseData := {
  //   formName: string
  //   fields: Array<{name: |value|}>
  // }
  chrome.autofill.requestAutofillValues(extractedForms, function(autofillFormsResponseData) {
    autofillFormsResponseData.forEach(function(formResponseData) {
      try {
        autofillController.autofill.fillForm(formResponseData);
      } catch(e) {
        console.log('Autofilling failed for response', formResponseData, "error message", e);
      }
    });
  });
});

window.autofillController = autofillController;
