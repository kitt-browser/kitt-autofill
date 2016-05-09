let a = 42;

console.log(a);

window.autofiller = require('./autofiller');

const AUTOFILL_PROFILE_STORAGE_KEY = 'autofill_profile';

// Workaround: Kitt uses caching for chrome.storage so that we can get the fresh version of data only
// from the context they were set, so all storage manipulation must be done through the same context
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.command === 'getAutofillProfile') {
    chrome.storage.local.get(AUTOFILL_PROFILE_STORAGE_KEY, function(profile) {
      // profile must be a non-nullable object, I'm accessing it later
      profile = profile[AUTOFILL_PROFILE_STORAGE_KEY]? profile[AUTOFILL_PROFILE_STORAGE_KEY] : {};
      sendResponse(profile);
    });
  }
  if (request.command === 'setAutofillProfile') {
    let profile = {};
    profile[AUTOFILL_PROFILE_STORAGE_KEY] = request.profile;
    chrome.storage.local.set(profile);
    sendResponse({});
  }
  return true;
});
