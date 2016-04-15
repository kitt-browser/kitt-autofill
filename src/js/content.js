"use strict";

let $ = require('jquery');
let _ = require('lodash');
let autofiller = require('./autofiller');

console.log('Content, chrome autofill!');
//let elementsInFirstForm = $("form:nth(1)").find("input[type!='hidden'],textarea,select");

// Extractor
// extractedFORMS = [FORM]
// FORM = {ACTION, ELEMENTS}
// ELEMENTS = [JQUERY ELEMENT]
function extractForms() {
  return $("form").toArray().map((HTMLForm) => {
    let jqForm = $(HTMLForm);
    let elements = jqForm.find("input[type!='hidden'],textarea,select");
    bindOnfocusElements(elements);
    return {
      action: jqForm.attr("action"),
      elements: elements
    };
  });
}

function bindOnfocusElements(elements) {
  elements.each(function(index) {
    this.onfocus = () => {
      console.log('onfocus:', this, index);
      console.log('candidates:', $(this).data("autofillCandidates"));
    };
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
  let forms = extractForms();
  let autofilledForms = autofiller.autofillForms(forms);
});

window.autofiller = autofiller;
