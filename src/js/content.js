"use strict";
let autofillController = require('./lib/autofill_chrome');
let utils = require('./lib/utils');
//let bindKeyboardInputSuggestionsToForm =
require('./autofill_chrome+bindKeyBoardSuggestions');

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

function fillProfileValuesInFormResponseData(autofillFormResponseData, profile) {
  for(let formFieldName in autofillFormResponseData.fields) {
    if (autofillFormResponseData.fields.hasOwnProperty(formFieldName)) {
      autofillFormResponseData.fields[formFieldName] = profile[autofillFormResponseData.fields[formFieldName]];
    }
  }
}

function fillFormsWithAutofillProfile(extractedForms, profile) {
  // @typedef {Array<AutofillFormResponseData>}
  // AutofillFormResponseData := {
  //   formName: string
  //   fields: Object<{|fieldname|: |autofillFieldType|}>
  // }

  chrome.autofill.requestAutofillValues(extractedForms, function(autofillFormsResponseData) {
    autofillFormsResponseData.forEach(function(autofillFormResponseData) {
      fillProfileValuesInFormResponseData(autofillFormResponseData, profile);
      try {
        autofillController.autofill.bindKeyboardInputSuggestionsToForm(autofillFormResponseData);
        //autofillController.autofill.fillForm(autofillFormResponseData);
      } catch(e) {
        console.log('Autofilling failed for response', autofillFormResponseData, "error message", e);
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
