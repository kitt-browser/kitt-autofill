"use strict";
let $ = require('jquery');
require('jquery-ui');

let _ = require('lodash');
var autofiller = require('./autofiller');

let stylesheetUrl = chrome.extension.getURL('./css/jquery-ui.css');
$('head').append('<link rel="stylesheet" type="text/css" href="' + stylesheetUrl + '">');

function throttle(func, timeout) {
  // small bug inside:
  var canFire = true;
  var shouldFireOnWakeUp = false;
  return function() {
    if (canFire) {
      func();
      canFire = false;
      setTimeout(function(){canFire = true; if(shouldFireOnWakeUp) {
        func(); /* now I haven't set it right, so it will fire two times in a row */ }
      }, timeout);
    } else {
      shouldFireOnWakeUp = true;
    }
  };
}

console.log('Content, chrome autofill!');

// Extractor
// extractedFORMS = [FORM]
// FORM = {ACTION, ELEMENTS}
// ELEMENTS = [JQUERY ELEMENT]
function extractFormsFromCurrentPage() {
  let forms = $("form");
  if (forms.length > 5) { // I'm on a page like facebook -> many forms
    window.observer.disconnect();
  }
  return forms.toArray().map((HTMLForm) => {
    let jqForm = $(HTMLForm);
    let elements = jqForm.find("input[type!='hidden'],textarea,select");
    let parsedForm = {
      action: jqForm.attr("action"),
      elements: elements
    };
    console.log("parsing form: ", parsedForm);
    return parsedForm;
  });
}

function bindListenersToElementsOfForms(forms) {
  forms.forEach((form) => {

    form.elements.each(function () {
      $(this).autocomplete({
        source: $(this).data("autofillCandidates")
      });
      this.onfocus = () => {
        console.log("element", this, "was just focused, candidates:", $(this).data("autofillCandidates")); // $(this));
      };
    });
  });
}

function setUpObserver(processMutation) {
  processMutation(); // sometimes, the page loads and no further mutations happen
  let observer = new MutationObserver(throttle(processMutation, 1000));
  //  let observer = new MutationObserver(_.throttle(processMutation, 1000));
  window.observer = observer;
  observer.observe($('body')[0], {
    childList: true,
    subtree: true
  });

}

setUpObserver(function () {
  let forms = extractFormsFromCurrentPage();
  bindListenersToElementsOfForms(forms);
  autofiller.bindAutofilledValuesToForms(forms);
});

// debug doesn't work in Kitt
window.autofiller = autofiller;
window.extractFormsFromCurrentPage = extractFormsFromCurrentPage;
window.bindListenersToElementsOfForms = bindListenersToElementsOfForms;
window.setUpObserver = setUpObserver;
