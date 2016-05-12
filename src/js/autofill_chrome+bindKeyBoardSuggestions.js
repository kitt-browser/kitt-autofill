"use strict";
/**
 * Created by tomasnovella on 12/05/16.
 */

let __gCrWeb = require('./lib/autofill_chrome');

function fillValueListener(value) {
  if (!chrome || !chrome.autofill || !chrome.autofill.setKeyboardInputSuggestions) {
    return;
  }

  return function() {
    alert(value);
    if (!chrome.autofill.setKeyboardInputSuggestions) { // TODO
      return;
    }
    chrome.autofill.setKeyboardSuggections([value]);
  }
}

function removeValueListener() {
  if (!chrome || !chrome.autofill ) {
    return;
  }

  return function() {
    alert('gonna be removed');
    if (!chrome.autofill.clearKeyboardInputSuggestions) { // TODO
      return;
    }
    chrome.autofill.clearKeyboardInputSuggestions();
  }
}

__gCrWeb.autofill.bindKeyboardInputSuggestionsToForm = function(autofillFilledFormResponseData) {
  var form = __gCrWeb.common.getFormElementFromIdentifier(autofillFilledFormResponseData.formName);
  var controlElements = __gCrWeb.common.getFormControlElements(form);
  for (var i = 0; i < controlElements.length; i += 1) {
    var element = controlElements[i];
    if (!__gCrWeb.autofill.isAutofillableElement(element)) {
      continue;
    }
    var fieldName = __gCrWeb.common.nameForAutofill(element);

    // Don't fill field if source value is empty or missing.
    var value = autofillFilledFormResponseData.fields[fieldName];
    if (!value) {
      continue;
    }
    if (__gCrWeb.autofill.isTextInput(element) ||
      __gCrWeb.autofill.isTextAreaElement(element)) {

      //__gCrWeb.common.setInputElementValue(value, element, true);
      element.onfocus = fillValueListener(value);
      element.onblur = removeValueListener();
    }

  }
};
