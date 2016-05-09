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

function fillFormsWithAutofillProfile(extractedForms, profile) {
  // @typedef {Array<AutofillFormResponseData>}
  // AutofillFormResponseData := {
  //   formName: string
  //   fields: Object<{|fieldname|: |autofillFieldType|}>
  // }
  chrome.autofill.requestAutofillValues(extractedForms, function(autofillFormsResponseData) {
    autofillFormsResponseData.forEach(function(formResponseData) {
      for(let formFieldName in formResponseData.fields) {
        if (formResponseData.fields.hasOwnProperty(formFieldName)) {
          formResponseData.fields[formFieldName] = profile[formResponseData.fields[formFieldName]];
        }
      }
      try {
        autofillController.autofill.fillForm(formResponseData);
      } catch(e) {
        console.log('Autofilling failed for response', formResponseData, "error message", e);
      }
    });
  });

}

setUpObserver(function() {
  let extractedForms = autofillController.autofill.extractForms(3);

  console.log(extractedForms);

  if (!chrome.autofill) {
    return;
  }
  chrome.runtime.sendMessage({command: 'getAutofillProfile'}, (profile) => {
    //alert(JSON.stringify(profile));
    fillFormsWithAutofillProfile(extractedForms, profile);
  });
});

window.autofillController = autofillController;
