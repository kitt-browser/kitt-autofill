/**
 * Created by tomasnovella on 14/04/16.
 */
"use strict";

let $ = require('jquery');

function hasEmailField() {
  return true;
}

function setNeedsAutofillFlag(forms) {
  forms.forEach((form) => {
    if (hasEmailField(form)) {
      form.needsAutofill = true;
    }
  });
}
function bindAutofilledValuesToForms(forms) {
  forms.forEach((form, key) => {
    form.needsAutofill = true; //key % 2 === 1;
    if (form.needsAutofill) {
      form.elements.forEach((elementStruct) => {
        $(elementStruct.domElement).data("autofillCandidates", ["candidate1", "candidate2"]);
      });
    }
  });
}


module.exports = {
  bindAutofilledValuesToForms
};
