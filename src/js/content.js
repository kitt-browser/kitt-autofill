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
  console.log(autofillController.autofill.extractForms(3));
  if (window.location.href.indexOf("tohodo.com/autofill/form.html") !== -1) {
    autofillController.autofill.fillForm({formName: "myform", fields: {fullname: "SalsitackyTomy", email: "tomasnovella@salsita.com", red: null}}, "year")
  }

  // I'm in Kitt
  if (chrome.autofill) {

    // @typedef {Array<AutofillFormResponseData>}
    // AutofillFormResponseData := {
    //   formName: string
    //   fields: Array<Object<string, string>> // name: value
    // }
    let response = chrome.autofill.requestAutofillValues(extractedForms);
    response.forEach(function(formResponseData) {
      autofillController.autofill.fillForm(formResponseData)
    });
  }
});

window.autofillController = autofillController;
