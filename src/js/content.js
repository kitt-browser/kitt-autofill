"use strict";

let $ = require('jquery');
require('jquery-ui');

let _ = require('lodash');
let autofiller = require('./autofiller');

console.log('Content, chrome autofill!');
//let elementsInFirstForm = $("form:nth(1)").find("input[type!='hidden'],textarea,select");

// Extractor
// extractedFORMS = [FORM]
// FORM = {ACTION, ELEMENTS}
// ELEMENTS = [JQUERY ELEMENT]
function extractFormsFromCurrentPage() {
  return $("form").toArray().map((HTMLForm) => {
    let jqForm = $(HTMLForm);
    let elements = jqForm.find("input[type!='hidden'],textarea,select");
    return {
      action: jqForm.attr("action"),
      elements: elements
    };
  });
}

function bindListenersToElementsOfForms(forms) {
  forms.forEach((form) => {
    form.elements.each(function() {
      $(this).autocomplete({
        source: $(this).data("autofillCandidates")
      });
    });
  });
}

function main(processMutation) {
  let observer = new MutationObserver(_.throttle(processMutation, 1000));

  observer.observe($('body')[0], {
    childList: true,
    subtree: true
  });
}

main(function(){
  let forms = extractFormsFromCurrentPage();
  bindListenersToElementsOfForms(forms);
  autofiller.bindAutofilledValuesToForms(forms);
});

window.autofiller = autofiller;
