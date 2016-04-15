/**
 * Created by tomasnovella on 14/04/16.
 */
"use strict";

let $ = require('jquery');

function autofillForms(forms) {
  forms.forEach((form, key) => {
    form.needsAutofill = key % 2 == 0;
    if (form.needsAutofill) {
      form.elements.each(function() {
        $(this).data("autofillCandidates", ["candidate1", "candidate2"]);
      });
    }
  });
}


module.exports = {
  autofillForms
};
