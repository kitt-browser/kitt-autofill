"use strict";
let $ = require('jquery');
require('jquery-ui');


var autofiller = require('./autofiller');

var autofill_chrome = require('./lib/autofill_chrome');
console.log(autofill_chrome.autofill.extractForms(1));

// hack: Kitt doesn't support manifest.content_scripts[0].css
let stylesheetUrl = chrome.extension.getURL('./css/jquery-ui.css');
$('head').append('<link rel="stylesheet" type="text/css" href="' + stylesheetUrl + '">');

var objectTypes = {
  'boolean': false,
  'function': true,
  'object': true,
  'number': false,
  'string': false,
  'undefined': false
};
var root = (objectTypes[typeof window] && window) || this;
console.log('lodash TEST, is true?', root === window);

//let _ = require('lodash');
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

function extractAttributesFromElement(domElement) {
  let elementAttributes = {};
  let atts = domElement.attributes;
  for (let i = 0; i < atts.length; ++i) {
    let att = atts[i];
    elementAttributes[att.nodeName] = att.nodeValue
  }
  return elementAttributes;
}

function createElementsStructure(jqElements) {
  return jqElements.map((index, domElement) => {
    let elementAttributes = extractAttributesFromElement(domElement);
    elementAttributes.domElement = domElement;
    elementAttributes.id = Math.random().toString();

    return elementAttributes;
  }).get();
}

// Extractor
// extractedFORMS = [FORM]
// FORM = {ACTION, ELEMENTS}
// ELEMENTS = [ELEMENT]
// ELEMENT = {id:..., domElement:..., ....}
function extractFormsFromCurrentPage() {
  let forms = $("form");
  if (forms.length > 5) { // I'm on a page like facebook -> many forms
    window.observer.disconnect();
  }
  return forms.toArray().map((htmlForm) => {
    let jqForm = $(htmlForm);
    let jqElements = jqForm.find("input[type!='hidden'],textarea,select");
    let parsedForm = {
      action: jqForm.attr("action"),
      elements: createElementsStructure(jqElements)
    };
    console.log("parsing form: ", parsedForm);
    return parsedForm;
  });
}

function bindListenersToElementsOfForms(forms) {
  forms.forEach((form) => {
    form.elements.forEach((elementStruct) => {
      let domElement = elementStruct.domElement;
      let jqElement = $(domElement);
      jqElement.autocomplete({source: jqElement.data("autofillCandidates")});

      domElement.onfocus = () => {
        console.log("element was just focused, candidates:", jqElement.data("autofillCandidates"));
      };
    });
  });
}

function setUpObserver(processMutation) {
  processMutation(); // sometimes, the page loads and no further mutations happen
  let observer = new MutationObserver(throttle(processMutation, 1000));
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
