"use strict";

let $ = require('jquery');

function ucfirst (str) {
  return typeof str !== "undefined"  ? (str += '', str[0].toUpperCase() + str.substr(1)) : '' ;
}

// must be kept in sync with AutofillFieldType in Swift
const fieldTypes = [
  'name',
  'organization',
  'streetAddress',
  'postalCode',
  'city',
  'phone',
  'countryRegion',
  'email',
  'nameOnCard',
  'cardNumber'
];
const AUTOFILL_PROFILE_STORAGE_KEY = 'autofill_profile';

function appendFieldWithDefaultValue(form, fieldName, fieldDefaultValue) {
  if (!form || !fieldName) {
    return;
  }

  if (typeof fieldDefaultValue !== 'string') {
    fieldDefaultValue = '';
  }

  var input = document.createElement('input');
  input.type = 'text';
  input.name = fieldName;
  input.value = fieldDefaultValue;
  form.appendChild(document.createTextNode(ucfirst(fieldName) + ':'));
  form.appendChild(input);
  form.appendChild(document.createElement('br'));
}

function main() {
  chrome.storage.local.get(AUTOFILL_PROFILE_STORAGE_KEY, function(profile) {

    // profile must be a non-nullable object, I'm accessing it later
    profile = profile[AUTOFILL_PROFILE_STORAGE_KEY]? profile[AUTOFILL_PROFILE_STORAGE_KEY] : {};

    let form = document.getElementById("autofillProfileForm");
    fieldTypes.forEach(field => {
      appendFieldWithDefaultValue(form, field, profile[field]);
    });
    let submit = document.createElement('input');
    submit.type = 'submit';
    submit.value = 'Update!';
    form.appendChild(submit);

    form.onsubmit = function(e) {
      e.preventDefault();
      let autofillProfile = {};
      $('#autofillProfileForm').serializeArray().forEach(item => {
        autofillProfile[item.name] = item.value;
      });

      let newStorage = {};
      newStorage[AUTOFILL_PROFILE_STORAGE_KEY] = autofillProfile;
      chrome.storage.local.set(newStorage, function() {
        window.close();
      });
    };
  });
}

window.onload = main;
