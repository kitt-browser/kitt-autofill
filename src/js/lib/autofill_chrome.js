var __gCrWeb = {};
module.exports = __gCrWeb;

// core.js
// Returns a string that is formatted according to the JSON syntax rules.
// This is equivalent to the built-in JSON.stringify() function, but is
// less likely to be overridden by the website itself.  This public function
// should not be used if spoofing it would create a security vulnerability.
// The |__gCrWeb| object itself does not use it; it uses its private
// counterpart instead.
// Prevents websites from changing stringify's behavior by adding the
// method toJSON() by temporarily removing it.
__gCrWeb['stringify'] = function(value) {
  if (value === null)
    return 'null';
  if (value === undefined)
    return undefined;
  if (typeof(value.toJSON) == 'function') {
    var originalToJSON = value.toJSON;
    value.toJSON = undefined;
    var stringifiedValue = __gCrWeb.common.JSONStringify(value);
    value.toJSON = originalToJSON;
    return stringifiedValue;
  }
  return __gCrWeb.common.JSONStringify(value);
};





// COMMON.js

// Copyright 2013 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// This file provides common methods that can be shared by other JavaScripts.


// MY COMMENTING
//goog.provide('__crWeb.common');

//goog.require('__crWeb.base');


/**
 * Namespace for this file. It depends on |__gCrWeb| having already been
 * injected. String 'common' is used in |__gCrWeb['common']| as it needs to be
 * accessed in Objective-C code.
 */
__gCrWeb['common'] = {};

/* Beginning of anonymous object. */
(function() {
  /**
   * JSON safe object to protect against custom implementation of Object.toJSON
   * in host pages.
   * @constructor
   */
  __gCrWeb['common'].JSONSafeObject = function JSONSafeObject() {
  };

  /**
   * Protect against custom implementation of Object.toJSON in host pages.
   */
  __gCrWeb['common'].JSONSafeObject.prototype.toJSON = null;

  /**
   * Retain the original JSON.stringify method where possible to reduce the
   * impact of sites overriding it
   */
  __gCrWeb.common.JSONStringify = JSON.stringify;

  /**
   * Prefix used in references to form elements that have no 'id' or 'name'
   */
  __gCrWeb.common.kNamelessFormIDPrefix = 'gChrome~';

  /**
   * Tests an element's visiblity. This test is expensive so should be used
   * sparingly.
   * @param {Element} element A DOM element.
   * @return {boolean} true if the |element| is currently part of the visible
   * DOM.
   */
  __gCrWeb.common.isElementVisible = function(element) {
    /** @type {Node} */
    var node = element;
    while (node && node !== document) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        var style = window.getComputedStyle(/** @type {Element} */(node));
        if (style.display === 'none' || style.visibility === 'hidden') {
          return false;
        }
      }
      // Move up the tree and test again.
      node = node.parentNode;
    }
    // Test reached the top of the DOM without finding a concealed ancestor.
    return true;
  };

  /**
   * Based on Element::isFormControlElement() (WebKit)
   * @param {Element} element A DOM element.
   * @return {boolean} true if the |element| is a form control element.
   */
  __gCrWeb.common.isFormControlElement = function(element) {
    var tagName = element.tagName;
    return (tagName === 'INPUT' ||
      tagName === 'SELECT' ||
      tagName === 'TEXTAREA');
  };

  /**
   * Returns an array of control elements in a form.
   *
   * This method is based on the logic in method
   *     void WebFormElement::getFormControlElements(
   *         WebVector<WebFormControlElement>&) const
   * in chromium/src/third_party/WebKit/Source/WebKit/chromium/src/
   * WebFormElement.cpp.
   *
   * @param {Element} form A form element for which the control elements are
   *   returned.
   * @return {Array<Element>}
   */
  __gCrWeb.common.getFormControlElements = function(form) {
    if (!form) {
      return [];
    }
    var results = [];
    // Get input and select elements from form.elements.
    // TODO(chenyu): according to
    // http://www.w3.org/TR/2011/WD-html5-20110525/forms.html, form.elements are
    // the "listed elements whose form owner is the form element, with the
    // exception of input elements whose type attribute is in the Image Button
    // state, which must, for historical reasons, be excluded from this
    // particular collection." In WebFormElement.cpp, this method is implemented
    // by returning elements in form's associated elements that have tag 'INPUT'
    // or 'SELECT'. Check if input Image Buttons are excluded in that
    // implementation. Note for Autofill, as input Image Button is not
    // considered as autofillable elements, there is no impact on Autofill
    // feature.
    var elements = form.elements;
    for (var i = 0; i < elements.length; i++) {
      if (__gCrWeb.common.isFormControlElement(elements[i])) {
        results.push(elements[i]);
      }
    }
    return results;
  };

  /**
   * Returns true if an element can be autocompleted.
   *
   * This method aims to provide the same logic as method
   *     bool autoComplete() const
   * in chromium/src/third_party/WebKit/Source/WebKit/chromium/src/
   * WebFormElement.cpp.
   *
   * @param {Element} element An element to check if it can be autocompleted.
   * @return {boolean} true if element can be autocompleted.
   */
  __gCrWeb.common.autoComplete = function(element) {
    if (!element) {
      return false;
    }
    if (__gCrWeb.common.getLowerCaseAttribute(
      element, 'autocomplete') == 'off') {
      return false;
    }
    if (__gCrWeb.common.getLowerCaseAttribute(
      element.form, 'autocomplete') == 'off') {
      return false;
    }
    return true;
  };

  /**
   * Returns if an element is a text field.
   * This returns true for all of textfield-looking types such as text,
   * password, search, email, url, and number.
   *
   * This method aims to provide the same logic as method
   *     bool WebInputElement::isTextField() const
   * in chromium/src/third_party/WebKit/Source/WebKit/chromium/src/
   * WebInputElement.cpp, where this information is from
   *     bool HTMLInputElement::isTextField() const
   *     {
   *       return m_inputType->isTextField();
   *     }
   * (chromium/src/third_party/WebKit/Source/WebCore/html/HTMLInputElement.cpp)
   *
   * The implementation here is based on the following:
   *
   * - Method bool InputType::isTextField() defaults to be false and it is
   *   override to return true only in HTMLInputElement's subclass
   *   TextFieldInputType (chromium/src/third_party/WebKit/Source/WebCore/html/
   *   TextFieldInputType.h).
   *
   * - The implementation here considers all the subclasses of
   *   TextFieldInputType: NumberInputType and BaseTextInputType, which has
   *   subclasses EmailInputType, PasswordInputType, SearchInputType,
   *   TelephoneInputType, TextInputType, URLInputType. (All these classes are
   *   defined in chromium/src/third_party/WebKit/Source/WebCore/html/)
   *
   * @param {Element} element An element to examine if it is a text field.
   * @return {boolean} true if element has type=text.
   */
  __gCrWeb.common.isTextField = function(element) {
    if (!element) {
      return false;
    }
    if (element.type === 'hidden') {
      return false;
    }
    return element.type === 'text' ||
      element.type === 'email' ||
      element.type === 'password' ||
      element.type === 'search' ||
      element.type === 'tel' ||
      element.type === 'url' ||
      element.type === 'number';
  };

  /**
   * Sets the checked value of an input and dispatches an change event if
   * |shouldSendChangeEvent|.
   *
   * This is a simplified version of the implementation of
   *
   *     void setChecked(bool nowChecked, TextFieldEventBehavior eventBehavior)
   *
   * in chromium/src/third_party/WebKit/Source/WebKit/chromium/src/
   * WebInputElement.cpp, which calls
   *     void HTMLInputElement::setChecked(
   *         bool nowChecked, TextFieldEventBehavior eventBehavior)
   * in chromium/src/third_party/WebKit/Source/core/html/HTMLInputElement.cpp.
   *
   * @param {boolean} nowChecked The new checked value of the input element.
   * @param {Element} input The input element of which the value is set.
   * @param {boolean} shouldSendChangeEvent Whether a change event should be
   *     dispatched.
   */
  __gCrWeb.common.setInputElementChecked = function(
    nowChecked, input, shouldSendChangeEvent) {
    var checkedChanged = input.checked !== nowChecked;
    input.checked = nowChecked;
    if (checkedChanged) {
      __gCrWeb.common.createAndDispatchHTMLEvent(input, 'change', true, false);
    }
  };

  /**
   * Sets the value of an input and dispatches an change event if
   * |shouldSendChangeEvent|.
   *
   * It is based on the logic in
   *
   *     void setValue(const WebString&, bool sendChangeEvent = false)
   *
   * in chromium/src/third_party/WebKit/Source/WebKit/chromium/src/
   * WebInputElement.cpp, which calls
   *    void setValue(const String& value, TextFieldEventBehavior eventBehavior)
   * in chromium/src/third_party/WebKit/Source/core/html/HTMLInputElement.cpp.
   *
   * @param {string} value The value the input element will be set.
   * @param {Element} input The input element of which the value is set.
   * @param {boolean} shouldSendChangeEvent Whether a change event should be
   *     dispatched.
   */
  __gCrWeb.common.setInputElementValue = function(
    value, input, shouldSendChangeEvent) {
    // In HTMLInputElement.cpp there is a check on canSetValue(value), which
    // returns false only for file input. As file input is not relevant for
    // autofill and this method is only used for autofill for now, there is no
    // such check in this implementation.
    var sanitizedValue = __gCrWeb.common.sanitizeValueForInputElement(
      value, input);
    var valueChanged = sanitizedValue !== input.value;
    input.value = sanitizedValue;
    if (valueChanged) {
      __gCrWeb.common.createAndDispatchHTMLEvent(input, 'change', true, false);
    }
  };

  /**
   * Returns a sanitized value of proposedValue for a given input element type.
   * The logic is based on
   *
   *      String sanitizeValue(const String&) const
   *
   * in chromium/src/third_party/WebKit/Source/core/html/InputType.h
   *
   * @param {string} proposedValue The proposed value.
   * @param {Element} element The element for which the proposedValue is to be
   *     sanitized.
   * @return {string} The sanitized value.
   */
  __gCrWeb.common.sanitizeValueForInputElement = function(
    proposedValue, element) {
    if (!proposedValue) {
      return '';
    }

    // Method HTMLInputElement::sanitizeValue() calls InputType::sanitizeValue()
    // (chromium/src/third_party/WebKit/Source/core/html/InputType.cpp) for
    // non-null proposedValue. InputType::sanitizeValue() returns the original
    // proposedValue by default and it is overridden in classes
    // BaseDateAndTimeInputType, ColorInputType, RangeInputType and
    // TextFieldInputType (all are in
    // chromium/src/third_party/WebKit/Source/core/html/). Currently only
    // TextFieldInputType is relevant and sanitizeValue() for other types of
    // input elements has not been implemented.
    if (__gCrWeb.common.isTextField(element)) {
      return __gCrWeb.common.sanitizeValueForTextFieldInputType(
        proposedValue, element);
    }
    return proposedValue;
  };

  /**
   * Returns a sanitized value for a text field.
   *
   * The logic is based on |String sanitizeValue(const String&)|
   * in chromium/src/third_party/WebKit/Source/core/html/TextFieldInputType.h
   * Note this method is overridden in EmailInputType and NumberInputType.
   *
   * @param {string} proposedValue The proposed value.
   * @param {Element} element The element for which the proposedValue is to be
   *     sanitized.
   * @return {string} The sanitized value.
   */
  __gCrWeb.common.sanitizeValueForTextFieldInputType = function(
    proposedValue, element) {
    var textFieldElementType = element.type;
    if (textFieldElementType === 'email') {
      return __gCrWeb.common.sanitizeValueForEmailInputType(
        proposedValue, element);
    } else if (textFieldElementType === 'number') {
      return __gCrWeb.common.sanitizeValueForNumberInputType(proposedValue);
    }
    var valueWithLineBreakRemoved = proposedValue.replace(/(\r\n|\n|\r)/gm, '');
    // TODO(chenyu): Should we also implement numCharactersInGraphemeClusters()
    // in chromium/src/third_party/WebKit/Source/core/platform/text/
    // TextBreakIterator.cpp and call it here when computing newLength?
    // Different from the implementation in TextFieldInputType.h, where a limit
    // on the text length is considered due to
    // https://bugs.webkit.org/show_bug.cgi?id=14536, no such limit is
    // considered here for now.
    var newLength = valueWithLineBreakRemoved.length;
    // This logic is from method String limitLength() in TextFieldInputType.h
    for (var i = 0; i < newLength; ++i) {
      var current = valueWithLineBreakRemoved[i];
      if (current < ' ' && current != '\t') {
        newLength = i;
        break;
      }
    }
    return valueWithLineBreakRemoved.substring(0, newLength);
  };

  /**
   * Returns the sanitized value for an email input.
   *
   * The logic is based on
   *
   *     String EmailInputType::sanitizeValue(const String& proposedValue) const
   *
   * in chromium/src/third_party/WebKit/Source/core/html/EmailInputType.cpp
   *
   * @param {string} proposedValue The proposed value.
   * @param {Element} element The element for which the proposedValue is to be
   *     sanitized.
   * @return {string} The sanitized value.
   */
  __gCrWeb.common.sanitizeValueForEmailInputType = function(
    proposedValue, element) {
    var valueWithLineBreakRemoved = proposedValue.replace(/(\r\n|\n\r)/gm, '');

    if (!element.multiple) {
      return __gCrWeb.common.trim(proposedValue);
    }
    var addresses = valueWithLineBreakRemoved.split(',');
    for (var i = 0; i < addresses.length; ++i) {
      addresses[i] = __gCrWeb.common.trim(addresses[i]);
    }
    return addresses.join(',');
  };

  /**
   * Returns the sanitized value of a proposed value for a number input.
   *
   * The logic is based on
   *
   *     String NumberInputType::sanitizeValue(const String& proposedValue)
   *         const
   *
   * in chromium/src/third_party/WebKit/Source/core/html/NumberInputType.cpp
   *
   * Note in this implementation method Number() is used in the place of method
   * parseToDoubleForNumberType() called in NumberInputType.cpp.
   *
   * @param {string} proposedValue The proposed value.
   * @return {string} The sanitized value.
   */
  __gCrWeb.common.sanitizeValueForNumberInputType = function(proposedValue) {
    var sanitizedValue = Number(proposedValue);
    if (isNaN(sanitizedValue)) {
      return '';
    }
    return sanitizedValue.toString();
  };

  /**
   * Trims any whitespace from the start and end of a string.
   * Used in preference to String.prototype.trim as this can be overridden by
   * sites.
   *
   * @param {string} str The string to be trimmed.
   * @return {string} The string after trimming.
   */
  __gCrWeb.common.trim = function(str) {
    return str.replace(/^\s+|\s+$/g, '');
  };

  /**
   * Returns the name that should be used for the specified |element| when
   * storing Autofill data. Various attributes are used to attempt to identify
   * the element, beginning with 'name' and 'id' attributes. Providing a
   * uniquely reversible identifier for any element is a non-trivial problem;
   * this solution attempts to satisfy the majority of cases.
   *
   * It aims to provide the logic in
   *     WebString nameForAutofill() const;
   * in chromium/src/third_party/WebKit/Source/WebKit/chromium/public/
   *  WebFormControlElement.h
   *
   * @param {Element} element An element of which the name for Autofill will be
   *     returned.
   * @return {string} the name for Autofill.
   */
  __gCrWeb.common.nameForAutofill = function(element) {
    if (!element) {
      return '';
    }
    var trimmedName = element.name;
    if (trimmedName) {
      trimmedName = __gCrWeb.common.trim(trimmedName);
      if (trimmedName.length > 0) {
        return trimmedName;
      }
    }
    trimmedName = element.getAttribute('id');
    if (trimmedName) {
      return __gCrWeb.common.trim(trimmedName);
    }
    return '';
  };

  /**
   * Acquires the specified DOM |attribute| from the DOM |element| and returns
   * its lower-case value, or null if not present.
   * @param {Element} element A DOM element.
   * @param {string} attribute An attribute name.
   * @return {?string} Lowercase value of DOM element or null if not present.
   */
  __gCrWeb.common.getLowerCaseAttribute = function(element, attribute) {
    if (!element) {
      return null;
    }
    var value = element.getAttribute(attribute);
    if (value) {
      return value.toLowerCase();
    }
    return null;
  };

  /**
   * Converts a relative URL into an absolute URL.
   * @param {Object} doc Document.
   * @param {string} relativeURL Relative URL.
   * @return {string} Absolute URL.
   */
  __gCrWeb.common.absoluteURL = function(doc, relativeURL) {
    // In the case of data: URL-based pages, relativeURL === absoluteURL.
    if (doc.location.protocol === 'data:') {
      return doc.location.href;
    }
    var urlNormalizer = doc['__gCrWebURLNormalizer'];
    if (!urlNormalizer) {
      urlNormalizer = doc.createElement('a');
      doc['__gCrWebURLNormalizer'] = urlNormalizer;
    }

    // Use the magical quality of the <a> element. It automatically converts
    // relative URLs into absolute ones.
    urlNormalizer.href = relativeURL;
    return urlNormalizer.href;
  };

  /**
   * Extracts the webpage URL from the given URL by removing the query
   * and the reference (aka fragment) from the URL.
   * @param {string} url Web page URL.
   * @return {string} Web page URL with query and reference removed.
   */
  __gCrWeb.common.removeQueryAndReferenceFromURL = function(url) {
    var queryIndex = url.indexOf('?');
    if (queryIndex != -1) {
      return url.substring(0, queryIndex);
    }

    var hashIndex = url.indexOf('#');
    if (hashIndex != -1) {
      return url.substring(0, hashIndex);
    }
    return url;
  };

  /**
   * Returns the form's |name| attribute if non-empty; otherwise the form's |id|
   * attribute, or the index of the form (with prefix) in document.forms.
   *
   * It is partially based on the logic in
   *     const string16 GetFormIdentifier(const blink::WebFormElement& form)
   * in chromium/src/components/autofill/renderer/form_autofill_util.h.
   *
   * @param {Element} form An element for which the identifier is returned.
   * @return {string} a string that represents the element's identifier.
   */
  __gCrWeb.common.getFormIdentifier = function(form) {
    if (!form)
      return '';
    var name = form.getAttribute('name');
    if (name && name.length != 0) {
      return name;
    }
    name = form.getAttribute('id');
    if (name) {
      return name;
    }
    // A form name must be supplied, because the element will later need to be
    // identified from the name. A last resort is to take the index number of
    // the form in document.forms. ids are not supposed to begin with digits (by
    // HTML 4 spec) so this is unlikely to match a true id.
    for (var idx = 0; idx != document.forms.length; idx++) {
      if (document.forms[idx] == form) {
        return __gCrWeb.common.kNamelessFormIDPrefix + idx;
      }
    }
    return '';
  };

  /**
   * Returns the form element from an ID obtained from getFormIdentifier.
   *
   * This works on a 'best effort' basis since DOM changes can always change the
   * actual element that the ID refers to.
   *
   * @param {string} name An ID string obtained via getFormIdentifier.
   * @return {Element} The original form element, if it can be determined.
   */
  __gCrWeb.common.getFormElementFromIdentifier = function(name) {
    // First attempt is from the name / id supplied.
    var form = document.forms.namedItem(name);
    if (form) {
      if (form.nodeType !== Node.ELEMENT_NODE)
        return null;
      return /** @type {Element} */(form);
    }
    // Second attempt is from the prefixed index position of the form in
    // document.forms.
    if (name.indexOf(__gCrWeb.common.kNamelessFormIDPrefix) == 0) {
      var nameAsInteger = 0 |
        name.substring(__gCrWeb.common.kNamelessFormIDPrefix.length);
      if (__gCrWeb.common.kNamelessFormIDPrefix + nameAsInteger == name &&
        nameAsInteger < document.forms.length) {
        return document.forms[nameAsInteger];
      }
    }
    return null;
  };

  /**
   * Creates and dispatches an HTML event.
   *
   * @param {Element} element The element for which an event is created.
   * @param {string} type The type of the event.
   * @param {boolean} bubbles A boolean indicating whether the event should
   *     bubble up through the event chain or not.
   * @param {boolean} cancelable A boolean indicating whether the event can be
   *     canceled.
   */
  __gCrWeb.common.createAndDispatchHTMLEvent = function(
    element, type, bubbles, cancelable) {
    var changeEvent = element.ownerDocument.createEvent('HTMLEvents');
    changeEvent.initEvent(type, bubbles, cancelable);

    // A timer is used to avoid reentering JavaScript evaluation.
    window.setTimeout(function() {
      element.dispatchEvent(changeEvent);
    }, 0);
  };

  /**
   * Retrieves favicon information.
   *
   * @return {Object} Object containing favicon data.
   */
  __gCrWeb.common.getFavicons = function() {
    var favicons = [];
    var hasFavicon = false;
    favicons.toJSON = null;  // Never inherit Array.prototype.toJSON.
    var links = document.getElementsByTagName('link');
    var linkCount = links.length;
    for (var i = 0; i < linkCount; ++i) {
      if (links[i].rel) {
        var rel = links[i].rel.toLowerCase();
        if (rel == 'shortcut icon' ||
          rel == 'icon' ||
          rel == 'apple-touch-icon' ||
          rel == 'apple-touch-icon-precomposed') {
          var favicon = {
            rel: links[i].rel.toLowerCase(),
            href: links[i].href
          };
          favicons.push(favicon);
          if (rel == 'icon' || rel == 'shortcut icon') {
            hasFavicon = true;
          }
        }
      }
    }
    if (!hasFavicon) {
      // If an HTTP(S)? webpage does not reference a "favicon" then search
      // for a file named "favicon.ico" at the root of the website (legacy).
      // http://en.wikipedia.org/wiki/Favicon
      var location = document.location;
      if (location.protocol == 'http:' || location.protocol == 'https:') {
        var favicon = {
          rel: 'icon',
          href: location.origin + '/favicon.ico'
        };
        favicons.push(favicon);
      }
    }
    return favicons;
  };

  /**
   * Checks whether an <object> node is plugin content (as <object> can also be
   * used to embed images).
   * @param {HTMLElement} node The <object> node to check.
   * @return {boolean} Whether the node appears to be a plugin.
   * @private
   */
  var objectNodeIsPlugin_ = function(node) {
    return node.hasAttribute('classid') ||
      (node.hasAttribute('type') && node.type.indexOf('image/') != 0);
  };

  /**
   * Checks whether plugin a node has fallback content.
   * @param {HTMLElement} node The node to check.
   * @return {boolean} Whether the node has fallback.
   * @private
   */
  var pluginHasFallbackContent_ = function(node) {
    return node.textContent.trim().length > 0 ||
      node.getElementsByTagName('img').length > 0;
  };

  /**
   * Returns a list of plugin elements in the document that have no fallback
   * content. For nested plugins, only the innermost plugin element is returned.
   * @return {Array} A list of plugin elements.
   * @private
   */
  var findPluginNodesWithoutFallback_ = function() {
    var pluginNodes = [];
    var objects = document.getElementsByTagName('object');
    var objectCount = objects.length;
    for (var i = 0; i < objectCount; i++) {
      var object = objects[i];
      if (objectNodeIsPlugin_(object) &&
        !pluginHasFallbackContent_(object)) {
        pluginNodes.push(object);
      }
    }
    var applets = document.getElementsByTagName('applet');
    var appletsCount = applets.length;
    for (var i = 0; i < appletsCount; i++) {
      var applet = applets[i];
      if (!pluginHasFallbackContent_(applet)) {
        pluginNodes.push(applet);
      }
    }
    return pluginNodes;
  };

  /**
   * Finds and stores any plugins that don't have placeholders.
   * Returns true if any plugins without placeholders are found.
   */
  __gCrWeb.common.updatePluginPlaceholders = function() {
    var plugins = findPluginNodesWithoutFallback_();
    if (plugins.length > 0) {
      // Store the list of plugins in a known place for the replacement script
      // to use, then trigger it.
      __gCrWeb['placeholderTargetPlugins'] = plugins;
      return true;
    }
    return false;
  };
}());  // End of anonymous object



// autofill_controller.js





// Copyright 2013 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Installs Autofill management functions on the |__gCrWeb| object.
//
// It scans the DOM, extracting and storing forms and returns a JSON string
// representing an array of objects, each of which represents an Autofill form
// with information about a form to be filled and/or submitted and it can be
// translated to struct FormData
// (chromium/src/components/autofill/core/common/form_data.h) for further
// processing.

/** @typedef {HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement} */
var FormControlElement;

/**
  * @typedef {{
  *   name: string,
  *   value: string,
  *   form_control_type: string,
  *   autocomplete_attributes: string,
  *   max_length: number,
  *   is_autofilled: boolean,
  *   is_checkable: boolean,
  *   is_focusable: boolean,
  *   should_autocomplete: boolean,
  *   role: number,
  *   option_contents: Array<string>,
  *   option_values: Array<string>
  * }}
  */
var AutofillFormFieldData;

/**
  * @typedef {{
  *   name: string,
  *   method: string,
  *   origin: string,
  *   action: string,
  *   fields: Array<AutofillFormFieldData>
  * }}
  */
var AutofillFormData;

/**
 * Namespace for this file. It depends on |__gCrWeb| having already been
 * injected.
 */
__gCrWeb['autofill'] = {};

/**
 * The maximum length allowed for form data.
 *
 * This variable is from AutofillTable::kMaxDataLength in
 * chromium/src/components/autofill/core/browser/webdata/autofill_table.h
 *
 * @const {number}
 */
__gCrWeb.autofill.MAX_DATA_LENGTH = 1024;

/**
 * The maximum number of form fields we are willing to parse, due to
 * computational costs. Several examples of forms with lots of fields that are
 * not relevant to Autofill: (1) the Netflix queue; (2) the Amazon wishlist;
 * (3) router configuration pages; and (4) other configuration pages, e.g. for
 * Google code project settings.
 *
 * This variable is |kMaxParseableFields| from
 * chromium/src/components/autofill/content/renderer/form_autofill_util.h
 *
 * @const {number}
 */
__gCrWeb.autofill.MAX_PARSEABLE_FIELDS = 100;

/**
 * A bit field mask to extract data from WebFormControlElement for
 * extracting none value.
 *
 * This variable is from enum ExtractMask in
 * chromium/src/components/autofill/content/renderer/form_autofill_util.h
 *
 * @const {number}
 */
__gCrWeb.autofill.EXTRACT_MASK_NONE = 0;

/**
 * A bit field mask to extract data from WebFormControlElement for
 * extracting value from WebFormControlElement.
 *
 * This variable is from enum ExtractMask in
 * chromium/src/components/autofill/content/renderer/form_autofill_util.h
 *
 * @const {number}
 */
__gCrWeb.autofill.EXTRACT_MASK_VALUE = 1 << 0;

/**
 * A bit field mask to extract data from WebFormControlElement for
 * extracting option text from WebFormSelectElement. Only valid when
 * EXTRACT_MASK_VALUE is set. This is used for form submission where human
 * readable value is captured.
 *
 * This variable is from enum ExtractMask in
 * chromium/src/components/autofill/content/renderer/form_autofill_util.h
 *
 * @const {number}
 */
__gCrWeb.autofill.EXTRACT_MASK_OPTION_TEXT = 1 << 1;

/**
 * A bit field mask to extract data from WebFormControlElement for
 * extracting options from WebFormControlElement.
 *
 * This variable is from enum ExtractMask in
 * chromium/src/components/autofill/content/renderer/form_autofill_util.h
 *
 * @const {number}
 */
__gCrWeb.autofill.EXTRACT_MASK_OPTIONS = 1 << 2;

/**
 * A value for the "presentation" role.
 *
 * This variable is from enum RoleAttribute in
 * chromium/src/components/autofill/core/common/form_field_data.h
 *
 * @const {number}
 */
__gCrWeb.autofill.ROLE_ATTRIBUTE_PRESENTATION = 0;

/**
 * The last element that was autofilled.
 *
 * @type {Element}
 */
__gCrWeb.autofill.lastAutoFilledElement = null;

/**
 * The last element that was active (used to restore focus if necessary).
 *
 * @type {Element}
 */
__gCrWeb.autofill.lastActiveElement = null;

/**
 * Whether CSS for autofilled elements has been injected into the page.
 *
 * @type {boolean}
 */
__gCrWeb.autofill.styleInjected = false;

/**
 * Searches an element's ancestors to see if the element is inside a <form> or
 * <fieldset>.
 *
 * It is based on the logic in
 *     bool IsElementInsideFormOrFieldSet(const WebElement& element)
 * in chromium/src/components/autofill/content/renderer/form_cache.cc
 *
 * @param {!FormControlElement} element An element to examine.
 * @return {boolean} Whether the element is inside a <form> or <fieldset>.
 */
function isElementInsideFormOrFieldSet(element) {
  var parentNode = element.parentNode;
  while (parentNode) {
    if ((parentNode.nodeType === Node.ELEMENT_NODE) &&
        (__gCrWeb.autofill.hasTagName(parentNode, 'form') ||
         __gCrWeb.autofill.hasTagName(parentNode, 'fieldset'))) {
      return true;
    }
    parentNode = parentNode.parentNode;
  }
  return false;
}

/**
 * Determines whether the form is interesting enough to send to the browser for
 * further operations.
 *
 * Unlike the C++ version, this version takes a required field count param,
 * instead of using a hard coded value.
 *
 * It is based on the logic in
 *     bool IsFormInteresting(const FormData& form,
 *                            size_t num_editable_elements);
 * in chromium/src/components/autofill/content/renderer/form_cache.cc
 *
 * @param {AutofillFormData} form Form to examine.
 * @param {number} numEditableElements number of editable elements.
 * @param {number} numFieldsRequired number of fields required.
 * @return {boolean} Whether the form is sufficiently interesting.
 */
function isFormInteresting_(form, numEditableElements, numFieldsRequired) {
  if (form.fields.length === 0) {
    return false;
  }

  // If the form has at least one field with an autocomplete attribute, it is a
  // candidate for autofill.
  for (var i = 0; i < form.fields.length; ++i) {
    if (form.fields[i]['autocomplete_attribute'] != null &&
        form.fields[i]['autocomplete_attribute'].length > 0) {
      return true;
    }
  }

  // If there are no autocomplete attributes, the form needs to have at least
  // the required number of editable fields for the prediction routines to be a
  // candidate for autofill.
  return numEditableElements >= numFieldsRequired;
}

/**
 * Scans |control_elements| and returns the number of editable elements.
 *
 * Unlike the C++ version, this version does not take the
 * log_deprecation_messages parameter, and it does not save any state since
 * there is no caching.
 *
 * It is based on the logic in:
 *     size_t FormCache::ScanFormControlElements(
 *         const std::vector<WebFormControlElement>& control_elements,
 *         bool log_deprecation_messages);
 * in chromium/src/components/autofill/content/renderer/form_cache.cc.
 *
 * @param {Array<FormControlElement>} controlElements The elements to scan.
 * @return {number} The number of editable elements.
 */
function scanFormControlElements_(controlElements) {
  var numEditableElements = 0;
  for (var elementIndex = 0; elementIndex < controlElements.length;
       ++elementIndex) {
    var element = controlElements[elementIndex];
    if (!__gCrWeb.autofill.isCheckableElement(element)) {
      ++numEditableElements;
    }
  }
  return numEditableElements;
}

/**
 * Get all form control elements from |elements| that are not part of a form.
 * Also append the fieldsets encountered that are not part of a form to
 * |fieldsets|.
 *
 * It is based on the logic in:
 *     std::vector<WebFormControlElement>
 *     GetUnownedAutofillableFormFieldElements(
 *         const WebElementCollection& elements,
 *         std::vector<WebElement>* fieldsets);
 * in chromium/src/components/autofill/content/renderer/form_autofill_util.cc.
 *
 * In the C++ version, |fieldsets| can be NULL, in which case we do not try to
 * append to it.
 *
 * @param {Array<FormControlElement>} elements elements to look through.
 * @param {Array<Element>} fieldsets out param for unowned fieldsets.
 * @return {Array<FormControlElement>} The elements that are not part of a form.
 */
function getUnownedAutofillableFormFieldElements_(elements, fieldsets) {
  var unownedFieldsetChildren = [];
  for (var i = 0; i < elements.length; ++i) {
    if (__gCrWeb.common.isFormControlElement(elements[i])) {
      if (!elements[i].form) {
        unownedFieldsetChildren.push(elements[i]);
      }
    }

    if (__gCrWeb.autofill.hasTagName(elements[i], 'fieldset') &&
        !isElementInsideFormOrFieldSet(elements[i])) {
      fieldset.push(elements[i]);
    }
  }
  return __gCrWeb.autofill.extractAutofillableElementsFromSet(
      unownedFieldsetChildren);
}

/**
 * Extracts fields from |controlElements| with |extractMask| to |formFields|.
 * The extracted fields are also placed in |elementArray|.
 *
 * It is based on the logic in
 *     bool ExtractFieldsFromControlElements(
 *         const WebVector<WebFormControlElement>& control_elements,
 *         ExtractMask extract_mask,
 *         ScopedVector<FormFieldData>* form_fields,
 *         std::vector<bool>* fields_extracted,
 *         std::map<WebFormControlElement, FormFieldData*>* element_map)
 * in chromium/src/components/autofill/content/renderer/form_autofill_util.cc
 *
 * TODO(thestig): Make |element_map| a Map when Chrome makes iOS 8 and Safari 8
 *                part of the minimal requirements.
 *
 * @param {Array<FormControlElement>} controlElements The control elements that
 *     will be processed.
 * @param {number} extractMask Mask controls what data is extracted from
 *     controlElements.
 * @param {Array<AutofillFormFieldData>} formFields The extracted form fields.
 * @param {Array<boolean>} fieldsExtracted Indicates whether the fields were
 *     extracted.
 * @param {Array<?AutofillFormFieldData>} elementArray The extracted form
 *     fields or null if a particular control has no corresponding field.
 * @return {boolean} Whether there are fields and not too many fields in the
 *     form.
 */
function extractFieldsFromControlElements_(controlElements, extractMask,
    formFields, fieldsExtracted, elementArray) {
  for (var i = 0; i < controlElements.length; ++i) {
    fieldsExtracted[i] = false;
    elementArray[i] = null;

    /** @type {FormControlElement} */
    var controlElement = controlElements[i];
    if (!__gCrWeb.autofill.isAutofillableElement(controlElement)) {
      continue;
    }

    // Create a new AutofillFormFieldData, fill it out and map it to the
    // field's name.
    var formField = new __gCrWeb['common'].JSONSafeObject;
    __gCrWeb.autofill.webFormControlElementToFormField(
        controlElement, extractMask, formField);
    formFields.push(formField);
    elementArray[i] = formField;
    fieldsExtracted[i] = true;

    // To avoid overly expensive computation, we impose a maximum number of
    // allowable fields.
    if (formFields.length > __gCrWeb.autofill.MAX_PARSEABLE_FIELDS) {
      return false;
    }
  }

  return formFields.length > 0;
}

/**
 * Check if the node is visible.
 *
 * @param {Node} node The node to be processed.
 * @return {boolean} Whether the node is visible or not.
 */
function isVisibleNode_(node) {
  if (!node)
    return false;

  if (node.nodeType === Node.ELEMENT_NODE) {
    var style = window.getComputedStyle(/** @type {Element} */(node));
    if (style.visibility == 'hidden' || style.display == 'none')
      return false;
  }

  // Verify all ancestors are focusable.
  return !node.parentNode || isVisibleNode_(node.parentNode);
}

/**
 * For each label element, get the corresponding form control element, use the
 * form control element along with |controlElements| and |elementArray| to find
 * the previously created AutofillFormFieldData and set the
 * AutofillFormFieldData's label to the label.firstChild().nodeValue() of the
 * label element.
 *
 * It is based on the logic in
 *     void MatchLabelsAndFields(
 *         const WebElementCollection& labels,
 *         std::map<WebFormControlElement, FormFieldData*>* element_map);
 * in chromium/src/components/autofill/content/renderer/form_autofill_util.cc
 *
 * This differs in that it takes a formElement field, instead of calling
 * field_element.isFormControlElement().
 *
 * This also uses (|controlElements|, |elementArray|) because there is no
 * guaranteeded Map support on iOS yet.
 *
 * @param {NodeList} labels The labels to match.
 * @param {HTMLFormElement} formElement The form element being processed.
 * @param {Array<FormControlElement>} controlElements The control elements that
 *     were processed.
 * @param {Array<?AutofillFormFieldData>} elementArray The extracted fields.
 */
function matchLabelsAndFields_(labels, formElement, controlElements,
    elementArray) {
  for (var index = 0; index < labels.length; ++index) {
    var label = labels[index];
    var fieldElement = label.control;
    var fieldData = null;
    if (!fieldElement) {
      // Sometimes site authors will incorrectly specify the corresponding
      // field element's name rather than its id, so we compensate here.
      var elementName = label.htmlFor;
      if (!elementName)
        continue;
      // Look through the list for elements with this name. There can actually
      // be more than one. In this case, the label may not be particularly
      // useful, so just discard it.
      for (var elementIndex = 0; elementIndex < elementArray.length;
           ++elementIndex) {
        var currentFieldData = elementArray[elementIndex];
        if (currentFieldData && currentFieldData['name'] === elementName) {
          if (fieldData !== null) {
            fieldData = null;
            break;
          } else {
            fieldData = currentFieldData;
          }
        }
      }
    } else if (fieldElement.form != formElement ||
                   fieldElement.type === 'hidden') {
      continue;
    } else {
      // Typical case: look up |fieldData| in |elementArray|.
      for (var elementIndex = 0; elementIndex < elementArray.length;
           ++elementIndex) {
        if (controlElements[elementIndex] === fieldElement) {
          fieldData = elementArray[elementIndex];
          break;
        }
      }
    }

    if (!fieldData)
      continue;

    if (!('label' in fieldData)) {
      fieldData['label'] = '';
    }
    var labelText = __gCrWeb.autofill.findChildText(label);
    // Concatenate labels because some sites might have multiple label
    // candidates.
    if (fieldData['label'].length > 0 && labelText.length > 0) {
      fieldData['label'] += ' ';
    }
    fieldData['label'] += labelText;
  }
}

/**
 * Common function shared by webFormElementToFormData() and
 * unownedFormElementsAndFieldSetsToFormData(). Either pass in:
 * 1) |formElement|, |formControlElement| and an empty |fieldsets|.
 * or
 * 2) a non-empty |fieldsets|.
 *
 * It is based on the logic in
 *     bool FormOrFieldsetsToFormData(
 *         const blink::WebFormElement* form_element,
 *         const blink::WebFormControlElement* form_control_element,
 *         const std::vector<blink::WebElement>& fieldsets,
 *         const WebVector<WebFormControlElement>& control_elements,
 *         ExtractMask extract_mask,
 *         FormData* form,
 *         FormFieldData* field)
 * in chromium/src/components/autofill/content/renderer/form_autofill_util.cc
 *
 * @param {HTMLFormElement} formElement The form element that will be processed.
 * @param {FormControlElement} formControlElement A control element in
 *     formElment, the FormField of which will be returned in field.
 * @param {Array<Element>} fieldsets The fieldsets to look through if
 *     formElement and formControlElement are not specified.
 * @param {Array<FormControlElement>} controlElements The control elements that
 *     will be processed.
 * @param {number} extractMask Mask controls what data is extracted from
 *     formElement.
 * @param {AutofillFormData} form Form to fill in the AutofillFormData
 *     information of formElement.
 * @param {AutofillFormFieldData|null} field Field to fill in the form field
 *     information of formControlElement.
 * @return {boolean} Whether there are fields and not too many fields in the
 *     form.
 */
function formOrFieldsetsToFormData_(formElement, formControlElement,
    fieldsets, controlElements, extractMask, form, field) {
  // This should be a map from a control element to the AutofillFormFieldData.
  // However, without Map support, it's just an Array of AutofillFormFieldData.
  var elementArray = [];

  // The extracted FormFields.
  var formFields = [];

  // A vector of bools that indicate whether each element in |controlElements|
  // meets the requirements and thus will be in the resulting |form|.
  var fieldsExtracted = [];

  if (!extractFieldsFromControlElements_(controlElements, extractMask,
                                         formFields, fieldsExtracted,
                                         elementArray)) {
    return false;
  }

  if (formElement) {
    // Loop through the label elements inside the form element. For each label
    // element, get the corresponding form control element, use the form control
    // element along with |controlElements| and |elementArray| to find the
    // previously created AutofillFormFieldData and set the
    // AutofillFormFieldData's label.
    var labels = formElement.getElementsByTagName('label');
    matchLabelsAndFields_(labels, formElement, controlElements, elementArray);
  } else {
    // Same as the if block, but for all the labels in fieldset
    for (var i = 0; i < fieldsets.length; ++i) {
      var labels = fieldsets[i].getElementsByTagName('label');
      matchLabelsAndFields_(labels, formElement, controlElements, elementArray);
    }
  }

  // Loop through the form control elements, extracting the label text from
  // the DOM.  We use the |fieldsExtracted| vector to make sure we assign the
  // extracted label to the correct field, as it's possible |form_fields| will
  // not contain all of the elements in |control_elements|.
  for (var i = 0, fieldIdx = 0;
       i < controlElements.length && fieldIdx < formFields.length; ++i) {
    // This field didn't meet the requirements, so don't try to find a label
    // for it.
    if (!fieldsExtracted[i])
      continue;

    var controlElement = controlElements[i];
    var currentField = formFields[fieldIdx];
    if (!currentField['label']) {
      currentField['label'] =
          __gCrWeb.autofill.inferLabelForElement(controlElement);
    }
    if (currentField['label'].length > __gCrWeb.autofill.MAX_DATA_LENGTH) {
      currentField['label'] =
          currentField['label'].substr(0, __gCrWeb.autofill.MAX_DATA_LENGTH);
    }

    if (controlElement === formControlElement)
      field = formFields[fieldIdx];
    ++fieldIdx;
  }

  form['fields'] = formFields;
  // Protect against custom implementation of Array.toJSON in host pages.
  form['fields'].toJSON = null;
  return true;
}

/**
 * Scans DOM and returns a JSON string representation of forms and form
 * extraction results. This is just a wrapper around extractNewForms() to JSON
 * encode the forms, for convenience.
 *
 * @param {number} requiredFields The minimum number of fields forms must have
 *     to be extracted.
 * @return {string} A JSON encoded object with object['forms'] containing the
 *     forms data.
 */
__gCrWeb.autofill['extractForms'] = function(requiredFields) {
  var results = new __gCrWeb.common.JSONSafeObject;
  results['forms'] = __gCrWeb.autofill.extractNewForms(requiredFields);
  return __gCrWeb.stringify(results);
};

/**
 * Stores the current active element. This is used to make the element active
 * again in case the web view loses focus when a dialog is presented over it.
 */
__gCrWeb.autofill['storeActiveElement'] = function() {
  __gCrWeb.autofill.lastActiveElement = document.activeElement;
}

/**
 * Clears the current active element by setting it to null.
 */
__gCrWeb.autofill['clearActiveElement'] = function() {
  __gCrWeb.autofill.lastActiveElement = null;
}

/**
 * Fills data into the active form field. The active form field is either
 * document.activeElement or the value of lastActiveElement if that value is
 * non-null.
 *
 * @param {AutofillFormFieldData} data The data to fill in.
 */
__gCrWeb.autofill['fillActiveFormField'] = function(data) {
  var activeElement = document.activeElement;
  if (__gCrWeb.autofill.lastActiveElement) {
    activeElement = __gCrWeb.autofill.lastActiveElement;
    activeElement.focus();
    __gCrWeb.autofill.lastActiveElement = null;
  }
  if (data['name'] !== __gCrWeb['common'].nameForAutofill(activeElement)) {
    return;
  }
  __gCrWeb.autofill.lastAutoFilledElement = activeElement;
  __gCrWeb.autofill.fillFormField(data, activeElement);
};

/**
 * Fills a number of fields in the same named form for full-form Autofill.
 * Applies Autofill CSS (i.e. yellow background) to filled elements.
 * Only empty fields will be filled, except that field named
 * |forceFillFieldName| will always be filled even if non-empty.
 *
 * @param {Object} data Dictionary of data to fill in.
 * @param {string} forceFillFieldName Named field will always be filled even if
 *     non-empty. May be null.
 */
__gCrWeb.autofill['fillForm'] = function(data, forceFillFieldName) {
  // Inject CSS to style the autofilled elements with a yellow background.
  if (!__gCrWeb.autofill.styleInjected) {
    var style = document.createElement('style');
    style.textContent = '[chrome-autofilled] {' +
      'background-color:#FAFFBD !important;' +
      'background-image:none !important;' +
      'color:#000000 !important;' +
      '}';
    document.head.appendChild(style);
    __gCrWeb.autofill.styleInjected = true;
  }

  // Remove Autofill styling when control element is edited.
  var controlElementInputListener = function(evt) {
    evt.target.removeAttribute('chrome-autofilled');
    evt.target.isAutofilled = false;
    evt.target.removeEventListener('input', controlElementInputListener);
  };

  var form = __gCrWeb.common.getFormElementFromIdentifier(data.formName);
  var controlElements = __gCrWeb.common.getFormControlElements(form);
  for (var i = 0; i < controlElements.length; ++i) {
    var element = controlElements[i];
    if (!__gCrWeb.autofill.isAutofillableElement(element)) {
      continue;
    }
    var fieldName = __gCrWeb['common'].nameForAutofill(element);

    // Skip non-empty fields unless this is the forceFillFieldName or it's a
    // 'select-one' element. 'select-one' elements are always autofilled even
    // if non-empty; see AutofillManager::FillOrPreviewDataModelForm().
    if (element.value && element.value.length > 0 &&
        !__gCrWeb.autofill.isSelectElement(element) &&
        fieldName !== forceFillFieldName) {
      continue;
    }

    // Don't fill field if source value is empty or missing.
    var value = data.fields[fieldName];
    if (!value)
      continue;

    if (__gCrWeb.autofill.isTextInput(element) ||
        __gCrWeb.autofill.isTextAreaElement(element)) {
      __gCrWeb.common.setInputElementValue(value, element, true);
    } else if (__gCrWeb.autofill.isSelectElement(element)) {
      if (element.value !== value) {
        element.value = value;
        __gCrWeb.common.createAndDispatchHTMLEvent(element, 'change', true,
            false);
      }
    }
    // TODO(bondd): Handle __gCrWeb.autofill.isCheckableElement(element) ==
    // true. |is_checked| is not currently passed in by the caller.

    element.setAttribute('chrome-autofilled', "autofilledPlaceholderValue");
    element.isAutofilled = true;
    element.addEventListener('input', controlElementInputListener);
  }

  // Remove Autofill styling when form receives 'reset' event.
  // Individual control elements may be left with 'input' event listeners but
  // they are harmless.
  var formResetListener = function(evt) {
    var controlElements = __gCrWeb.common.getFormControlElements(evt.target);
    for (var i = 0; i < controlElements.length; ++i) {
      controlElements[i].removeAttribute('chrome-autofilled');
      controlElements[i].isAutofilled = false;
    }
    evt.target.removeEventListener('reset', formResetListener);
  };
  form.addEventListener('reset', formResetListener);
};

/**
 * Clear autofilled fields of the specified form. Fields that are not currently
 * autofilled are not modified.
 * Field contents are cleared, and Autofill flag and styling are removed.
 * 'change' events are sent for fields whose contents changed.
 * Based on FormCache::ClearFormWithElement().
 *
 * @param {string} formName Identifier for form element (from
 *     getFormIdentifier).
 */
__gCrWeb.autofill['clearAutofilledFields'] = function(formName) {
  var form = __gCrWeb.common.getFormElementFromIdentifier(formName);
  var controlElements = __gCrWeb.common.getFormControlElements(form);
  for (var i = 0; i < controlElements.length; ++i) {
    var element = controlElements[i];
    if (!element.isAutofilled || element.disabled)
      continue;

    if (__gCrWeb.autofill.isTextInput(element) ||
        __gCrWeb.autofill.isTextAreaElement(element)) {
      __gCrWeb.common.setInputElementValue('', element, true);
    } else if (__gCrWeb.autofill.isSelectElement(element)) {
      // Reset to the first index.
      // TODO(bondd): Store initial values and reset to the correct one here.
      if (element.selectedIndex != 0) {
        element.selectedIndex = 0;
        __gCrWeb.common.createAndDispatchHTMLEvent(element, 'change', true,
            false);
      }
    } else if (__gCrWeb.autofill.isCheckableElement(element)) {
      // TODO(bondd): Handle checkable elements. They aren't properly supported
      // by iOS Autofill yet.
    }

    element.removeAttribute('chrome-autofilled');
    element.isAutofilled = false;
  }
};

/**
 * Scans the DOM in |frame| extracting and storing forms. Fills |forms| with
 * extracted forms.
 *
 * This method is based on the logic in method:
 *
 *     std::vector<FormData> ExtractNewForms();
 *
 * in chromium/src/components/autofill/content/renderer/form_cache.cc.
 *
 * The difference is in this implementation, the cache is not considered.
 * Initial values of select and checkable elements are not recorded at the
 * moment.
 *
 * This version still takes the minimumRequiredFields parameters. Whereas the
 * C++ version does not.
 *
 * This version recursively scans its child frames. The C++ version does not
 * because it has been converted to do only a single frame for Out Of Process
 * Iframes.
 *
 * @param {number} minimumRequiredFields The minimum number of fields a form
 *     should contain for autofill.
 * @return {Array<AutofillFormData>} The extracted forms.
 */
__gCrWeb.autofill.extractNewForms = function(minimumRequiredFields) {
  var forms = [];
  // Protect against custom implementation of Array.toJSON in host pages.
  /** @suppress {checkTypes} */(function() { forms.toJSON = null; })();

  extractFormsAndFormElements_(window, minimumRequiredFields, forms);
  return forms;
}

/**
 * A helper function to implement extractNewForms().
 *
 * @param {HTMLFrameElement|Window} frame A window or a frame containing forms
 *     from which the data will be extracted.
 * @param {number} minimumRequiredFields The minimum number of fields a form
 *     should contain for autofill.
 * @param {Array<AutofillFormData>} forms Array to store the data for the forms
 *     found in the frame.
 */
function extractFormsAndFormElements_(frame, minimumRequiredFields, forms) {
  if (!frame) {
    return;
  }
  var doc = frame.document;
  if (!doc) {
    return;
  }

  /** @type {HTMLCollection} */
  var webForms = doc.forms;

  var extractMask = __gCrWeb.autofill.EXTRACT_MASK_VALUE |
      __gCrWeb.autofill.EXTRACT_MASK_OPTIONS;
  var numFieldsSeen = 0;
  for (var formIndex = 0; formIndex < webForms.length; ++formIndex) {
    /** @type {HTMLFormElement} */
    var formElement = webForms[formIndex];
    var controlElements =
        __gCrWeb.autofill.extractAutofillableElementsInForm(formElement);
    var numEditableElements = scanFormControlElements_(controlElements);

    if (numEditableElements === 0) {
      continue;
    }

    var form = new __gCrWeb['common'].JSONSafeObject;
    if (!__gCrWeb.autofill.webFormElementToFormData(
        frame, formElement, null, extractMask, form, null /* field */)) {
      continue;
    }

    numFieldsSeen += form['fields'].length;
    if (numFieldsSeen > __gCrWeb.autofill.MAX_PARSEABLE_FIELDS) {
      break;
    }

    if (isFormInteresting_(form, numEditableElements, minimumRequiredFields)) {
      forms.push(form);
    }
  }

  // Look for more parseable fields outside of forms.
  var fieldsets = [];
  var unownedControlElements =
      getUnownedAutofillableFormFieldElements_(doc.all, fieldsets);
  var numEditableUnownedElements =
      scanFormControlElements_(unownedControlElements);
  if (numEditableUnownedElements > 0) {
    var unownedForm = new __gCrWeb['common'].JSONSafeObject;
    var hasUnownedForm = unownedFormElementsAndFieldSetsToFormData_(
        frame, fieldsets, unownedControlElements, extractMask, unownedForm);
    if (hasUnownedForm) {
      numFieldsSeen += unownedForm['fields'].length;
      if (numFieldsSeen <= __gCrWeb.autofill.MAX_PARSEABLE_FIELDS) {
        var interesting = isFormInteresting_(unownedForm,
            numEditableUnownedElements, minimumRequiredFields);
        if (interesting) {
          forms.push(unownedForm);
        }
      }
    }
  }

  // Recursively invoke for all frames/iframes.
  var frames = frame.frames;
  for (var i = 0; i < frames.length; i++) {
    extractFormsAndFormElements_(frames[i], minimumRequiredFields, forms);
  }
};

/**
 * Fills |form| with the form data object corresponding to the |formElement|.
 * If |field| is non-NULL, also fills |field| with the FormField object
 * corresponding to the |formControlElement|.
 * |extract_mask| controls what data is extracted.
 * Returns true if |form| is filled out. Returns false if there are no fields or
 * too many fields in the |form|.
 *
 * It is based on the logic in
 *     bool WebFormElementToFormData(
 *         const blink::WebFormElement& form_element,
 *         const blink::WebFormControlElement& form_control_element,
 *         ExtractMask extract_mask,
 *         FormData* form,
 *         FormFieldData* field)
 * in chromium/src/components/autofill/content/renderer/form_autofill_util.cc
 *
 * @param {HTMLFrameElement|Window} frame The window or frame where the
 *     formElement is in.
 * @param {HTMLFormElement} formElement The form element that will be processed.
 * @param {FormControlElement} formControlElement A control element in
 *     formElment, the FormField of which will be returned in field.
 * @param {number} extractMask Mask controls what data is extracted from
 *     formElement.
 * @param {AutofillFormData} form Form to fill in the AutofillFormData
 *     information of formElement.
 * @param {AutofillFormFieldData|null} field Field to fill in the form field
 *     information of formControlElement.
 * @return {boolean} Whether there are fields and not too many fields in the
 *     form.
 */
__gCrWeb.autofill.webFormElementToFormData = function(
    frame, formElement, formControlElement, extractMask, form, field) {
  if (!frame) {
    return false;
  }

  form['name'] = __gCrWeb.common.getFormIdentifier(formElement);
  // TODO(thestig): Check if method is unused and remove.
  var method = formElement.getAttribute('method');
  if (method) {
    form['method'] = method;
  }
  form['origin'] = __gCrWeb.common.removeQueryAndReferenceFromURL(
      frame.location.href);
  form['action'] = __gCrWeb.common.absoluteURL(
      frame.document,
      formElement.getAttribute('action'));

  // Note different from form_autofill_util.cc version of this method, which
  // computes |form.action| using document.completeURL(form_element.action())
  // and falls back to formElement.action() if the computed action is invalid,
  // here the action returned by |__gCrWeb.common.absoluteURL| is always
  // valid, which is computed by creating a <a> element, and we don't check if
  // the action is valid.

  var controlElements = __gCrWeb['common'].getFormControlElements(formElement);

  return formOrFieldsetsToFormData_(formElement, formControlElement,
      [] /* fieldsets */, controlElements, extractMask, form, field);
};

/**
 * Fills |form| with the form data object corresponding to the unowned elements
 * and fieldsets in the document.
 * |extract_mask| controls what data is extracted.
 * Returns true if |form| is filled out. Returns false if there are no fields or
 * too many fields in the |form|.
 *
 * It is based on the logic in
 *     bool UnownedFormElementsAndFieldSetsToFormData(
 *         const std::vector<blink::WebElement>& fieldsets,
 *         const std::vector<blink::WebFormControlElement>& control_elements,
 *         const GURL& origin,
 *         ExtractMask extract_mask,
 *         FormData* form)
 * in chromium/src/components/autofill/content/renderer/form_autofill_util.cc
 *
 * @param {HTMLFrameElement|Window} frame The window or frame where the
 *     formElement is in.
 * @param {Array<Element>} fieldsets The fieldsets to look through.
 * @param {Array<FormControlElement>} controlElements The control elements that
 *     will be processed.
 * @param {number} extractMask Mask controls what data is extracted from
 *     formElement.
 * @param {AutofillFormData} form Form to fill in the AutofillFormData
 *     information of formElement.
 * @return {boolean} Whether there are fields and not too many fields in the
 *     form.
 */
function unownedFormElementsAndFieldSetsToFormData_(
    frame, fieldsets, controlElements, extractMask, form) {
  if (!frame) {
    return false;
  }

  form['name'] = '';
  form['origin'] = __gCrWeb.common.removeQueryAndReferenceFromURL(
      frame.location.href);
  form['action'] = ''
  form['is_form_tag'] = false;

  return formOrFieldsetsToFormData_(
      null /* formElement*/, null /* formControlElement */, fieldsets,
      controlElements, extractMask, form, null /* field */);
}

/**
 * Returns is the tag of an |element| is tag.
 *
 * It is based on the logic in
 *     bool HasTagName(const WebNode& node, const blink::WebString& tag)
 * in chromium/src/components/autofill/content/renderer/form_autofill_util.cc.
 *
 * @param {Node} node Node to examine.
 * @param {string} tag Tag name.
 * @return {boolean} Whether the tag of node is tag.
 */
__gCrWeb.autofill.hasTagName = function(node, tag) {
  return node.nodeType === Node.ELEMENT_NODE &&
         /** @type {Element} */(node).tagName === tag.toUpperCase();
};

/**
 * Checks if an element is autofillable.
 *
 * It is based on the logic in
 *     bool IsAutofillableElement(const WebFormControlElement& element)
 * in chromium/src/components/autofill/content/renderer/form_autofill_util.cc.
 *
 * @param {FormControlElement} element An element to examine.
 * @return {boolean} Whether element is one of the element types that can be
 *     autofilled.
 */
__gCrWeb.autofill.isAutofillableElement = function(element) {
  return __gCrWeb.autofill.isAutofillableInputElement(element) ||
         __gCrWeb.autofill.isSelectElement(element) ||
         __gCrWeb.autofill.isTextAreaElement(element);
};

/**
 * Trims whitespace from the start of the input string.
 * Simplified version of string_util::TrimWhitespace.
 * @param {string} input String to trim.
 * @return {string} The |input| string without leading whitespace.
 */
__gCrWeb.autofill.trimWhitespaceLeading = function(input) {
  return input.replace(/^\s+/gm, '');
};

/**
 * Trims whitespace from the end of the input string.
 * Simplified version of string_util::TrimWhitespace.
 * @param {string} input String to trim.
 * @return {string} The |input| string without trailing whitespace.
 */
__gCrWeb.autofill.trimWhitespaceTrailing = function(input) {
  return input.replace(/\s+$/gm, '');
};

/**
 * Appends |suffix| to |prefix| so that any intermediary whitespace is collapsed
 * to a single space.  If |force_whitespace| is true, then the resulting string
 * is guaranteed to have a space between |prefix| and |suffix|.  Otherwise, the
 * result includes a space only if |prefix| has trailing whitespace or |suffix|
 * has leading whitespace.
 *
 * A few examples:
 *     CombineAndCollapseWhitespace('foo', 'bar', false)       -> 'foobar'
 *     CombineAndCollapseWhitespace('foo', 'bar', true)        -> 'foo bar'
 *     CombineAndCollapseWhitespace('foo ', 'bar', false)      -> 'foo bar'
 *     CombineAndCollapseWhitespace('foo', ' bar', false)      -> 'foo bar'
 *     CombineAndCollapseWhitespace('foo', ' bar', true)       -> 'foo bar'
 *     CombineAndCollapseWhitespace('foo   ', '   bar', false) -> 'foo bar'
 *     CombineAndCollapseWhitespace(' foo', 'bar ', false)     -> ' foobar '
 *     CombineAndCollapseWhitespace(' foo', 'bar ', true)      -> ' foo bar '
 *
 * It is based on the logic in
 * const string16 CombineAndCollapseWhitespace(const string16& prefix,
 *                                             const string16& suffix,
 *                                             bool force_whitespace)
 * @param {string} prefix The prefix string in the string combination.
 * @param {string} suffix The suffix string in the string combination.
 * @param {boolean} forceWhitespace A boolean indicating if whitespace should
 *     be added as separator in the combination.
 * @return {string} The combined string.
 */
__gCrWeb.autofill.combineAndCollapseWhitespace = function(
    prefix, suffix, forceWhitespace) {
  var prefixTrimmed = __gCrWeb.autofill.trimWhitespaceTrailing(prefix);
  var prefixTrailingWhitespace = prefixTrimmed != prefix;
  var suffixTrimmed = __gCrWeb.autofill.trimWhitespaceLeading(suffix);
  var suffixLeadingWhitespace = suffixTrimmed != suffix;
  if (prefixTrailingWhitespace || suffixLeadingWhitespace || forceWhitespace) {
    return prefixTrimmed + ' ' + suffixTrimmed;
  } else {
    return prefixTrimmed + suffixTrimmed;
  }
};

/**
 * This is a helper function for the findChildText() function (see below).
 * Search depth is limited with the |depth| parameter.
 *
 * Based on form_autofill_util::FindChildTextInner().
 *
 * @param {Node} node The node to fetch the text content from.
 * @param {number} depth The maximum depth to descend on the DOM.
 * @param {Array<Node>} divsToSkip List of <div> tags to ignore if encountered.
 * @return {string} The discovered and adapted string.
 */
__gCrWeb.autofill.findChildTextInner = function(node, depth, divsToSkip) {
  if (depth <= 0 || !node) {
    return '';
  }

  // Skip over comments.
  if (node.nodeType === Node.COMMENT_NODE) {
    return __gCrWeb.autofill.findChildTextInner(node.nextSibling, depth - 1,
                                                divsToSkip);
  }

  if (node.nodeType !== Node.ELEMENT_NODE && node.nodeType !== Node.TEXT_NODE) {
    return '';
  }

  // Ignore elements known not to contain inferable labels.
  if (node.nodeType === Node.ELEMENT_NODE) {
    if (node.tagName === 'OPTION' ||
        node.tagName === 'SCRIPT' ||
        node.tagName === 'NOSCRIPT') {
      return '';
    }
    if (__gCrWeb.common.isFormControlElement(node)) {
      var input = /** @type {FormControlElement} */ (node);
      if (__gCrWeb.autofill.isAutofillableElement(input)) {
        return '';
      }
    }
  }

  if (node.tagName === 'DIV') {
    for (var i = 0; i < divsToSkip.length; ++i) {
      if (node === divsToSkip[i]) {
        return '';
      }
    }
  }

  // Extract the text exactly at this node.
  var nodeText = __gCrWeb.autofill.nodeValue(node);
  if (node.nodeType === Node.TEXT_NODE && !nodeText) {
    // In the C++ version, this text node would have been stripped completely.
    // Just pass the buck.
    return __gCrWeb.autofill.findChildTextInner(node.nextSibling, depth,
                                                divsToSkip);
  }

  // Recursively compute the children's text.
  // Preserve inter-element whitespace separation.
  var childText = __gCrWeb.autofill.findChildTextInner(node.firstChild,
                                                       depth - 1,
                                                       divsToSkip);
  var addSpace = node.nodeType === Node.TEXT_NODE && !nodeText;
  // Emulate apparently incorrect Chromium behavior tracked in crbug 239819.
  addSpace = false;
  nodeText = __gCrWeb.autofill.combineAndCollapseWhitespace(nodeText,
      childText, addSpace);

  // Recursively compute the siblings' text.
  // Again, preserve inter-element whitespace separation.
  var siblingText = __gCrWeb.autofill.findChildTextInner(node.nextSibling,
                                                         depth - 1,
                                                         divsToSkip);
  addSpace = node.nodeType === Node.TEXT_NODE && !nodeText;
  // Emulate apparently incorrect Chromium behavior tracked in crbug 239819.
  addSpace = false;
  nodeText = __gCrWeb.autofill.combineAndCollapseWhitespace(nodeText,
      siblingText, addSpace);

  return nodeText;
};

/**
 * Same as findChildText() below, but with a list of div nodes to skip.
 *
 * It is based on the logic in
 *    string16 FindChildTextWithIgnoreList(
 *        const WebNode& node,
 *        const std::set<WebNode>& divs_to_skip)
 * in chromium/src/components/autofill/content/renderer/form_autofill_util.cc.
 *
 * @param {Node} node A node of which the child text will be return.
 * @param {Array<Node>} divsToSkip List of <div> tags to ignore if encountered.
 * @return {string} The child text.
 */
__gCrWeb.autofill.findChildTextWithIgnoreList = function(node, divsToSkip) {
  if (node.nodeType === Node.TEXT_NODE)
    return __gCrWeb.autofill.nodeValue(node);

  var child = node.firstChild;
  var kChildSearchDepth = 10;
  var nodeText = __gCrWeb.autofill.findChildTextInner(child, kChildSearchDepth,
                                                      divsToSkip);
  nodeText = nodeText.trim();
  return nodeText;
};

/**
 * Returns the aggregated values of the descendants of |element| that are
 * non-empty text nodes.
 *
 * It is based on the logic in
 *    string16 FindChildText(const WebNode& node)
 * chromium/src/components/autofill/content/renderer/form_autofill_util.cc,
 * which is a faster alternative to |innerText()| for performance critical
 * operations.
 *
 * @param {Node} node A node of which the child text will be return.
 * @return {string} The child text.
 */
__gCrWeb.autofill.findChildText = function(node) {
  return __gCrWeb.autofill.findChildTextWithIgnoreList(node, []);
};

/**
 * Shared function for InferLabelFromPrevious() and InferLabelFromNext().
 *
 * It is based on the logic in
 *     string16 InferLabelFromSibling(const WebFormControlElement& element,
 *                                    bool forward)
 * in chromium/src/components/autofill/content/renderer/form_autofill_util.cc.
 *
 * @param {FormControlElement} element An element to examine.
 * @param {boolean} forward whether to search for the next or previous element.
 * @return {string} The label of element or an empty string if there is no
 *                  sibling or no label.
 */
__gCrWeb.autofill.inferLabelFromSibling = function(element, forward) {
  var inferredLabel = '';
  var sibling = element;
  if (!sibling) {
    return '';
  }

  while (true) {
    if (forward) {
      sibling = sibling.nextSibling;
    } else {
      sibling = sibling.previousSibling;
    }

    if (!sibling) {
      break;
    }

    // Skip over comments.
    var nodeType = sibling.nodeType;
    if (nodeType === Node.COMMENT_NODE) {
      continue;
    }

    // Otherwise, only consider normal HTML elements and their contents.
    if (nodeType != Node.TEXT_NODE && nodeType != Node.ELEMENT_NODE) {
      break;
    }

    // A label might be split across multiple "lightweight" nodes.
    // Coalesce any text contained in multiple consecutive
    //  (a) plain text nodes or
    //  (b) inline HTML elements that are essentially equivalent to text nodes.
    if (nodeType === Node.TEXT_NODE ||
        __gCrWeb.autofill.hasTagName(sibling, 'b') ||
        __gCrWeb.autofill.hasTagName(sibling, 'strong') ||
        __gCrWeb.autofill.hasTagName(sibling, 'span') ||
        __gCrWeb.autofill.hasTagName(sibling, 'font')) {
      var value = __gCrWeb.autofill.findChildText(sibling);
      // A text node's value will be empty if it is for a line break.
      var addSpace = nodeType === Node.TEXT_NODE && value.length === 0;
      inferredLabel =
          __gCrWeb.autofill.combineAndCollapseWhitespace(
              value, inferredLabel, addSpace);
      continue;
    }

    // If we have identified a partial label and have reached a non-lightweight
    // element, consider the label to be complete.
    var trimmedLabel = inferredLabel.trim();
    if (trimmedLabel.length > 0) {
      break;
    }

    // <img> and <br> tags often appear between the input element and its
    // label text, so skip over them.
    if (__gCrWeb.autofill.hasTagName(sibling, 'img') ||
        __gCrWeb.autofill.hasTagName(sibling, 'br')) {
      continue;
    }

    // We only expect <p> and <label> tags to contain the full label text.
    if (__gCrWeb.autofill.hasTagName(sibling, 'p') ||
        __gCrWeb.autofill.hasTagName(sibling, 'label')) {
      inferredLabel = __gCrWeb.autofill.findChildText(sibling);
    }
    break;
  }
  return inferredLabel.trim();
};

/**
 * Helper for |InferLabelForElement()| that infers a label, if possible, from
 * a previous sibling of |element|,
 * e.g. Some Text <input ...>
 * or   Some <span>Text</span> <input ...>
 * or   <p>Some Text</p><input ...>
 * or   <label>Some Text</label> <input ...>
 * or   Some Text <img><input ...>
 * or   <b>Some Text</b><br/> <input ...>.
 *
 * It is based on the logic in
 *     string16 InferLabelFromPrevious(const WebFormControlElement& element)
 * in chromium/src/components/autofill/content/renderer/form_autofill_util.cc.
 *
 * @param {FormControlElement} element An element to examine.
 * @return {string} The label of element.
 */
__gCrWeb.autofill.inferLabelFromPrevious = function(element) {
  return __gCrWeb.autofill.inferLabelFromSibling(element, false);
};

/**
 * Same as InferLabelFromPrevious(), but in the other direction.
 * Useful for cases like: <span><input type="checkbox">Label For Checkbox</span>
 *
 * It is based on the logic in
 *     string16 InferLabelFromNext(const WebFormControlElement& element)
 * in chromium/src/components/autofill/content/renderer/form_autofill_util.cc.
 *
 * @param {FormControlElement} element An element to examine.
 * @return {string} The label of element.
 */
__gCrWeb.autofill.inferLabelFromNext = function(element) {
  return __gCrWeb.autofill.inferLabelFromSibling(element, true);
};

/**
 * Helper for |InferLabelForElement()| that infers a label, if possible, from
 * the placeholder attribute.
 *
 * It is based on the logic in
 *     string16 InferLabelFromPlaceholder(const WebFormControlElement& element)
 * in chromium/src/components/autofill/content/renderer/form_autofill_util.cc.
 *
 * @param {FormControlElement} element An element to examine.
 * @return {string} The label of element.
 */
__gCrWeb.autofill.inferLabelFromPlaceholder = function(element) {
  if (!element || !element.placeholder) {
    return '';
  }

  return element.placeholder;
};

/**
 * Helper for |InferLabelForElement()| that infers a label, if possible, from
 * enclosing list item, e.g.
 *     <li>Some Text<input ...><input ...><input ...></li>
 *
 * It is based on the logic in
 *     string16 InferLabelFromListItem(const WebFormControlElement& element)
 * in chromium/src/components/autofill/content/renderer/form_autofill_util.cc.
 *
 * @param {FormControlElement} element An element to examine.
 * @return {string} The label of element.
 */
__gCrWeb.autofill.inferLabelFromListItem = function(element) {
  if (!element) {
    return '';
  }

  var parentNode = element.parentNode;
  while (parentNode &&
         parentNode.nodeType === Node.ELEMENT_NODE &&
         !__gCrWeb.autofill.hasTagName(parentNode, 'li')) {
    parentNode = parentNode.parentNode;
  }

  if (parentNode && __gCrWeb.autofill.hasTagName(parentNode, 'li'))
    return __gCrWeb.autofill.findChildText(parentNode);

  return '';
};

/**
 * Helper for |InferLabelForElement()| that infers a label, if possible, from
 * surrounding table structure,
 * e.g. <tr><td>Some Text</td><td><input ...></td></tr>
 * or   <tr><th>Some Text</th><td><input ...></td></tr>
 * or   <tr><td><b>Some Text</b></td><td><b><input ...></b></td></tr>
 * or   <tr><th><b>Some Text</b></th><td><b><input ...></b></td></tr>
 *
 * It is based on the logic in
 *    string16 InferLabelFromTableColumn(const WebFormControlElement& element)
 * in chromium/src/components/autofill/content/renderer/form_autofill_util.cc.
 *
 * @param {FormControlElement} element An element to examine.
 * @return {string} The label of element.
 */
__gCrWeb.autofill.inferLabelFromTableColumn = function(element) {
  if (!element) {
    return '';
  }

  var parentNode = element.parentNode;
  while (parentNode &&
         parentNode.nodeType === Node.ELEMENT_NODE &&
         !__gCrWeb.autofill.hasTagName(parentNode, 'td')) {
    parentNode = parentNode.parentNode;
  }

  if (!parentNode) {
    return '';
  }

  // Check all previous siblings, skipping non-element nodes, until we find a
  // non-empty text block.
  var inferredLabel = '';
  var previous = parentNode.previousSibling;
  while (inferredLabel.length === 0 && previous) {
    if (__gCrWeb.autofill.hasTagName(previous, 'td') ||
        __gCrWeb.autofill.hasTagName(previous, 'th')) {
      inferredLabel = __gCrWeb.autofill.findChildText(previous);
    }
    previous = previous.previousSibling;
  }

  return inferredLabel;
};

/**
 * Helper for |InferLabelForElement()| that infers a label, if possible, from
 * surrounding table structure,
 * e.g. <tr><td>Some Text</td></tr><tr><td><input ...></td></tr>
 *
 * If there are multiple cells and the row with the input matches up with the
 * previous row, then look for a specific cell within the previous row.
 * e.g. <tr><td>Input 1 label</td><td>Input 2 label</td></tr>
 *  <tr><td><input name="input 1"></td><td><input name="input2"></td></tr>
 *
 * It is based on the logic in
 *     string16 InferLabelFromTableRow(const WebFormControlElement& element)
 * in chromium/src/components/autofill/content/renderer/form_autofill_util.cc.
 *
 * @param {FormControlElement} element An element to examine.
 * @return {string} The label of element.
 */
__gCrWeb.autofill.inferLabelFromTableRow = function(element) {
  if (!element) {
    return '';
  }

  var cell = element.parentNode;
  while (cell) {
    if (cell.nodeType === Node.ELEMENT_NODE &&
        __gCrWeb.autofill.hasTagName(cell, 'td')) {
      break;
    }
    cell = cell.parentNode;
  }

  // Not in a cell - bail out.
  if (!cell) {
    return '';
  }

  // Count the cell holding |element|.
  var cellCount = cell.colSpan;
  var cellPosition = 0;
  var cellPositionEnd = cellCount - 1;

  // Count cells to the left to figure out |element|'s cell's position.
  var cellIterator = cell.previousSibling;
  while (cellIterator) {
    if (cellIterator.nodeType === Node.ELEMENT_NODE &&
        __gCrWeb.autofill.hasTagName(cellIterator, 'td')) {
      cellPosition += cellIterator.colSpan;
    }
    cellIterator = cellIterator.previousSibling;
  }

  // Count cells to the right.
  cellIterator = cell.nextSibling;
  while (cellIterator) {
    if (cellIterator.nodeType === Node.ELEMENT_NODE &&
        __gCrWeb.autofill.hasTagName(cellIterator, 'td')) {
      cellCount += cellIterator.colSpan;
    }
    cellIterator = cellIterator.nextSibling;
  }

  // Combine left + right.
  cellCount += cellPosition;
  cellPositionEnd += cellPosition

  // Find the current row.
  var parentNode = element.parentNode;
  while (parentNode &&
         parentNode.nodeType === Node.ELEMENT_NODE &&
         !__gCrWeb.autofill.hasTagName(parentNode, 'tr')) {
    parentNode = parentNode.parentNode;
  }

  if (!parentNode) {
    return '';
  }

  // Now find the previous row.
  var rowIt = parentNode.previousSibling;
  while (rowIt) {
    if (rowIt.nodeType === Node.ELEMENT_NODE &&
        __gCrWeb.autofill.hasTagName(parentNode, 'tr')) {
      break;
    }
    rowIt = rowIt.previousSibling;
  }

  // If there exists a previous row, check its cells and size. If they align
  // with the current row, infer the label from the cell above.
  if (rowIt) {
    var matchingCell = null;
    var prevRowCount = 0;
    var prevRowIt = rowIt.firstChild;
    while (prevRowIt) {
      if (prevRowIt.nodeType === Node.ELEMENT_NODE) {
        if (__gCrWeb.autofill.hasTagName(prevRowIt, 'td') ||
            __gCrWeb.autofill.hasTagName(prevRowIt, 'th')) {
          var span = prevRowIt.colSpan;
          var prevRowCountEnd = prevRowCount + span - 1;
          if (prevRowCount === cellPosition &&
              prevRowCountEnd === cellPositionEnd) {
            matchingCell = prevRowIt;
          }
          prevRowCount += span;
        }
      }
      prevRowIt = prevRowIt.nextSibling;
    }
    if (cellCount === prevRowCount && matchingCell) {
      var inferredLabel = __gCrWeb.autofill.findChildText(matchingCell);
      if (inferredLabel.length > 0) {
        return inferredLabel;
      }
    }
  }

  // If there is no previous row, or if the previous row and current row do not
  // align, check all previous siblings, skipping non-element nodes, until we
  // find a non-empty text block.
  var inferredLabel = '';
  var previous = parentNode.previousSibling;
  while (inferredLabel.length === 0 && previous) {
    if (__gCrWeb.autofill.hasTagName(previous, 'tr')) {
      inferredLabel = __gCrWeb.autofill.findChildText(previous);
    }
    previous = previous.previousSibling;
  }
  return inferredLabel;
};

/**
 * Returns true if |node| is an element and it is a container type that
 * inferLabelForElement() can traverse.
 *
 * It is based on the logic in
 *     bool IsTraversableContainerElement(const WebNode& node);
 * in chromium/src/components/autofill/content/renderer/form_autofill_util.cc.
 *
 * @param {!Node} node The node to be examined.
 * @return {boolean} Whether it can be traversed.
 */
__gCrWeb.autofill.isTraversableContainerElement = function(node) {
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return false;
  }

  var tagName = /** @type {Element} */(node).tagName;
  return (tagName === "DD" ||
          tagName === "DIV" ||
          tagName === "FIELDSET" ||
          tagName === "LI" ||
          tagName === "TD" ||
          tagName === "TABLE");
};

/**
 * Helper for |InferLabelForElement()| that infers a label, if possible, from
 * a surrounding div table,
 * e.g. <div>Some Text<span><input ...></span></div>
 * e.g. <div>Some Text</div><div><input ...></div>
 *
 * Because this is already traversing the <div> structure, if it finds a <label>
 * sibling along the way, infer from that <label>.
 *
 * It is based on the logic in
 *    string16 InferLabelFromDivTable(const WebFormControlElement& element)
 * in chromium/src/components/autofill/content/renderer/form_autofill_util.cc.
 *
 * @param {FormControlElement} element An element to examine.
 * @return {string} The label of element.
 */
__gCrWeb.autofill.inferLabelFromDivTable = function(element) {
  if (!element) {
    return '';
  }

  var node = element.parentNode;
  var lookingForParent = true;
  var divsToSkip = [];

  // Search the sibling and parent <div>s until we find a candidate label.
  var inferredLabel = '';
  while (inferredLabel.length === 0 && node) {
    if (__gCrWeb.autofill.hasTagName(node, 'div')) {
      if (lookingForParent) {
        inferredLabel =
            __gCrWeb.autofill.findChildTextWithIgnoreList(node, divsToSkip);
      } else {
        inferredLabel = __gCrWeb.autofill.findChildText(node);
      }
      // Avoid sibling DIVs that contain autofillable fields.
      if (!lookingForParent && inferredLabel.length > 0) {
        var resultElement = node.querySelector('input, select, textarea');
        if (resultElement) {
          inferredLabel = '';
          var addDiv = true;
          for (var i = 0; i < divsToSkip.length; ++i) {
            if (node === divsToSkip[i]) {
              addDiv = false;
              break;
            }
          }
          if (addDiv) {
            divsToSkip.push(node);
          }
        }
      }

      lookingForParent = false;
    } else if (!lookingForParent &&
               __gCrWeb.autofill.hasTagName(node, 'label')) {
      if (!node.control) {
        inferredLabel = __gCrWeb.autofill.findChildText(node);
      }
    } else if (lookingForParent &&
               __gCrWeb.autofill.isTraversableContainerElement(node)) {
      // If the element is in a non-div container, its label most likely is too.
      break;
    }

    if (!node.previousSibling) {
      // If there are no more siblings, continue walking up the tree.
      lookingForParent = true;
    }

    if (lookingForParent) {
      node = node.parentNode;
    } else {
      node = node.previousSibling;
    }
  }

  return inferredLabel;
};

/**
 * Helper for |InferLabelForElement()| that infers a label, if possible, from
 * a surrounding definition list,
 * e.g. <dl><dt>Some Text</dt><dd><input ...></dd></dl>
 * e.g. <dl><dt><b>Some Text</b></dt><dd><b><input ...></b></dd></dl>
 *
 * It is based on the logic in
 *    string16 InferLabelFromDefinitionList(
 *        const WebFormControlElement& element)
 * in chromium/src/components/autofill/content/renderer/form_autofill_util.cc.
 *
 * @param {FormControlElement} element An element to examine.
 * @return {string} The label of element.
 */
__gCrWeb.autofill.inferLabelFromDefinitionList = function(element) {
  if (!element) {
    return '';
  }

  var parentNode = element.parentNode;
  while (parentNode &&
         parentNode.nodeType === Node.ELEMENT_NODE &&
         !__gCrWeb.autofill.hasTagName(parentNode, 'dd')) {
    parentNode = parentNode.parentNode;
  }

  if (!parentNode || !__gCrWeb.autofill.hasTagName(parentNode, 'dd')) {
    return '';
  }

  // Skip by any intervening text nodes.
  var previous = parentNode.previousSibling;
  while (previous && previous.nodeType === Node.TEXT_NODE) {
    previous = previous.previousSibling;
  }

  if (!previous || !__gCrWeb.autofill.hasTagName(previous, 'dt'))
    return '';

  return __gCrWeb.autofill.findChildText(previous);
};

/**
 * Returns the element type for all ancestor nodes in CAPS, starting with the
 * parent node.
 *
 * It is based on the logic in
 *    std::vector<std::string> AncestorTagNames(
 *        const WebFormControlElement& element);
 * in chromium/src/components/autofill/content/renderer/form_autofill_util.cc.
 *
 * @param {FormControlElement} element An element to examine.
 * @return {Array} The element types for all ancestors.
 */
__gCrWeb.autofill.ancestorTagNames = function(element) {
  var tagNames = [];
  var parentNode = element.parentNode;
  while (parentNode) {
    if (parentNode.nodeType === Node.ELEMENT_NODE)
      tagNames.push(parentNode.tagName);
    parentNode = parentNode.parentNode;
  }
  return tagNames;
}

/**
 * Infers corresponding label for |element| from surrounding context in the DOM,
 * e.g. the contents of the preceding <p> tag or text element.
 *
 * It is based on the logic in
 *    string16 InferLabelForElement(const WebFormControlElement& element)
 * in chromium/src/components/autofill/content/renderer/form_autofill_util.cc.
 *
 * @param {FormControlElement} element An element to examine.
 * @return {string} The label of element.
 */
__gCrWeb.autofill.inferLabelForElement = function(element) {
  var inferredLabel;
  if (__gCrWeb.autofill.isCheckableElement(element)) {
    inferredLabel = __gCrWeb.autofill.inferLabelFromNext(element);
    if (inferredLabel.length > 0) {
      return inferredLabel;
    }
  }

  inferredLabel = __gCrWeb.autofill.inferLabelFromPrevious(element);
  if (inferredLabel.length > 0) {
    return inferredLabel;
  }

  // If we didn't find a label, check for the placeholder case.
  inferredLabel = __gCrWeb.autofill.inferLabelFromPlaceholder(element);
  if (inferredLabel.length > 0) {
    return inferredLabel;
  }

  // For all other searches that involve traversing up the tree, the search
  // order is based on which tag is the closest ancestor to |element|.
  var tagNames = __gCrWeb.autofill.ancestorTagNames(element);
  var seenTagNames = {};
  for (var index = 0; index < tagNames.length; ++index) {
    var tagName = tagNames[index];
    if (tagName in seenTagNames) {
      continue;
    }

    seenTagNames[tagName] = true;
    if (tagName === "DIV") {
      inferredLabel = __gCrWeb.autofill.inferLabelFromDivTable(element);
    } else if (tagName === "TD") {
      inferredLabel = __gCrWeb.autofill.inferLabelFromTableColumn(element);
      if (inferredLabel.length === 0)
        inferredLabel = __gCrWeb.autofill.inferLabelFromTableRow(element);
    } else if (tagName === "DD") {
      inferredLabel = __gCrWeb.autofill.inferLabelFromDefinitionList(element);
    } else if (tagName === "LI") {
      inferredLabel = __gCrWeb.autofill.inferLabelFromListItem(element);
    } else if (tagName === "FIELDSET") {
      break;
    }

    if (inferredLabel.length > 0) {
      break;
    }
  }

  return inferredLabel;
};

/**
 * Fills |field| data with the values of the <option> elements present in
 * |selectElement|.
 *
 * It is based on the logic in
 *     void GetOptionStringsFromElement(const WebSelectElement& select_element,
 *                                      std::vector<string16>* option_values,
 *                                      std::vector<string16>* option_contents)
 * in chromium/src/components/autofill/content/renderer/form_autofill_util.cc.
 *
 * @param {Element} selectElement A select element from which option data are
 *     extracted.
 * @param {Object} field A field that will contain the extracted option
 *     information.
 */
__gCrWeb.autofill.getOptionStringsFromElement = function(
    selectElement, field) {
  field['option_values'] = [];
  // Protect against custom implementation of Array.toJSON in host pages.
  field['option_values'].toJSON = null;
  field['option_contents'] = [];
  field['option_contents'].toJSON = null;
  var options = selectElement.options;
  for (var i = 0; i < options.length; ++i) {
    var option = options[i];
    field['option_values'].push(option['value']);
    field['option_contents'].push(option['text']);
  }
};

/**
 * Sets the |field|'s value to the value in |data|.
 * Also sets the "autofilled" attribute.
 *
 * It is based on the logic in
 *     void FillFormField(const FormFieldData& data,
 *                        bool is_initiating_node,
 *                        blink::WebFormControlElement* field)
 * in chromium/src/components/autofill/content/renderer/form_autofill_util.cc.
 *
 * Different from FillFormField(), is_initiating_node is not considered in
 * this implementation.
 *
 * @param {AutofillFormFieldData} data Data that will be filled into field.
 * @param {FormControlElement} field The element to which data will be filled.
 */
__gCrWeb.autofill.fillFormField = function(data, field) {
  // Nothing to fill.
  if (!data['value'] || data['value'].length === 0) {
    return;
  }

  if (__gCrWeb.autofill.isTextInput(field) ||
      __gCrWeb.autofill.isTextAreaElement(field)) {
    var sanitizedValue = data['value'];

    if (__gCrWeb.autofill.isTextInput(field)) {
      // If the 'max_length' attribute contains a negative value, the default
      // maxlength value is used.
      var maxLength = data['max_length'];
      if (maxLength < 0) {
        maxLength = __gCrWeb.autofill.MAX_DATA_LENGTH;
      }
      sanitizedValue = data['value'].substr(0, maxLength);
    }

    __gCrWeb.common.setInputElementValue(sanitizedValue, field, true);
    field.isAutofilled = true;
  } else if (__gCrWeb.autofill.isSelectElement(field)) {
    if (field.value !== data['value']) {
      field.value = data['value'];
      __gCrWeb.common.createAndDispatchHTMLEvent(field, 'change', true, false);
    }
  } else {
    if (__gCrWeb.autofill.isCheckableElement(field)) {
      __gCrWeb.common.setInputElementChecked(data['is_checked'], field, true);
    }
  }
};

/**
 * Returns true if |element| is a text input element.
 *
 * It is based on the logic in
 *     bool IsTextInput(const blink::WebInputElement* element)
 * in chromium/src/components/autofill/content/renderer/form_autofill_util.h.
 *
 * @param {FormControlElement} element An element to examine.
 * @return {boolean} Whether element is a text input field.
 */
__gCrWeb.autofill.isTextInput = function(element) {
  if (!element) {
    return false;
  }
  return __gCrWeb.common.isTextField(element);
};

/**
 * Returns true if |element| is a 'select' element.
 *
 * It is based on the logic in
 *     bool IsSelectElement(const blink::WebFormControlElement& element)
 * in chromium/src/components/autofill/content/renderer/form_autofill_util.h.
 *
 * @param {FormControlElement} element An element to examine.
 * @return {boolean} Whether element is a 'select' element.
 */
__gCrWeb.autofill.isSelectElement = function(element) {
  if (!element) {
    return false;
  }
  return element.type === 'select-one';
};

/**
 * Returns true if |element| is a 'textarea' element.
 *
 * It is based on the logic in
 *     bool IsTextAreaElement(const blink::WebFormControlElement& element)
 * in chromium/src/components/autofill/content/renderer/form_autofill_util.h.
 *
 * @param {FormControlElement} element An element to examine.
 * @return {boolean} Whether element is a 'textarea' element.
 */
__gCrWeb.autofill.isTextAreaElement = function(element) {
  if (!element) {
    return false;
  }
  return element.type === 'textarea';
};

/**
 * Returns true if |element| is a checkbox or a radio button element.
 *
 * It is based on the logic in
 *     bool IsCheckableElement(const blink::WebInputElement* element)
 * in chromium/src/components/autofill/content/renderer/form_autofill_util.h.
 *
 * @param {FormControlElement} element An element to examine.
 * @return {boolean} Whether element is a checkbox or a radio button.
 */
__gCrWeb.autofill.isCheckableElement = function(element) {
  if (!element) {
    return false;
  }
  return element.type === 'checkbox' || element.type === 'radio';
};

/**
 * Returns true if |element| is one of the input element types that can be
 * autofilled. {Text, Radiobutton, Checkbox}.
 *
 * It is based on the logic in
 *    bool IsAutofillableInputElement(const blink::WebInputElement* element)
 * in chromium/src/components/autofill/content/renderer/form_autofill_util.h.
 *
 * @param {FormControlElement} element An element to examine.
 * @return {boolean} Whether element is one of the input element types that
 *     can be autofilled.
 */
__gCrWeb.autofill.isAutofillableInputElement = function(element) {
  return __gCrWeb.autofill.isTextInput(element) ||
         __gCrWeb.autofill.isCheckableElement(element);
};

/**
 * Returns the nodeValue in a way similar to the C++ version of node.nodeValue,
 * used in src/components/autofill/content/renderer/form_autofill_util.h.
 * Newlines and tabs are stripped.
 *
 * @param {Node} node A node to examine.
 * @return {string} The text contained in |element|.
 */
__gCrWeb.autofill.nodeValue = function(node) {
  return (node.nodeValue || '').replace(/[\n\t]/gm, '');
};

/**
 * Returns the value in a way similar to the C++ version of node.value,
 * used in src/components/autofill/content/renderer/form_autofill_util.h.
 * Newlines and tabs are stripped.
 *
 * @param {Element} element An element to examine.
 * @return {string} The value for |element|.
 */
__gCrWeb.autofill.value = function(element) {
  return (element.value || '').replace(/[\n\t]/gm, '');
};

/**
 * Returns the auto-fillable form control elements in |formElement|.
 *
 * It is based on the logic in:
 *     std::vector<blink::WebFormControlElement>
 *     ExtractAutofillableElementsFromSet(
 *         const WebVector<WebFormControlElement>& control_elements);
 * in chromium/src/components/autofill/content/renderer/form_autofill_util.h.
 *
 * @param {Array<FormControlElement>} controlElements Set of control elements.
 * @return {Array<FormControlElement>} The array of autofillable elements.
 */
__gCrWeb.autofill.extractAutofillableElementsFromSet =
    function(controlElements) {
  var autofillableElements = [];
  for (var i = 0; i < controlElements.length; ++i) {
    var element = controlElements[i];
    if (!__gCrWeb.autofill.isAutofillableElement(element)) {
      continue;
    }
    autofillableElements.push(element);
  }
  return autofillableElements;
};

/**
 * Returns all the auto-fillable form control elements in |formElement|.
 *
 * It is based on the logic in
 *     void ExtractAutofillableElementsInForm(
 *         const blink::WebFormElement& form_element);
 * in chromium/src/components/autofill/content/renderer/form_autofill_util.h.
 *
 * @param {HTMLFormElement} formElement A form element to be processed.
 * @return {Array<FormControlElement>} The array of autofillable elements.
 */
__gCrWeb.autofill.extractAutofillableElementsInForm = function(formElement) {
  var controlElements = __gCrWeb.common.getFormControlElements(formElement);
  return __gCrWeb.autofill.extractAutofillableElementsFromSet(controlElements);
};

/**
 * Fills out a FormField object from a given form control element.
 *
 * It is based on the logic in
 *     void WebFormControlElementToFormField(
 *         const blink::WebFormControlElement& element,
 *         ExtractMask extract_mask,
 *         FormFieldData* field);
 * in chromium/src/components/autofill/content/renderer/form_autofill_util.h.
 *
 * @param {FormControlElement} element The element to be processed.
 * @param {number} extractMask A bit field mask to extract data from |element|.
 *     See the document on variable __gCrWeb.autofill.EXTRACT_MASK_NONE,
 *     __gCrWeb.autofill.EXTRACT_MASK_VALUE,
 *     __gCrWeb.autofill.EXTRACT_MASK_OPTION_TEXT and
 *     __gCrWeb.autofill.EXTRACT_MASK_OPTIONS.
 * @param {AutofillFormFieldData} field Field to fill in the element
 *     information.
 */
__gCrWeb.autofill.webFormControlElementToFormField = function(
    element, extractMask, field) {
  if (!field || !element) {
    return;
  }
  // The label is not officially part of a form control element; however, the
  // labels for all form control elements are scraped from the DOM and set in
  // form data.
  field['name'] = __gCrWeb['common'].nameForAutofill(element);
  field['form_control_type'] = element.type;
  var autocomplete_attribute = element.getAttribute('autocomplete');
  if (autocomplete_attribute) {
    field['autocomplete_attribute'] = autocomplete_attribute;
  }
  if (field['autocomplete_attribute'] != null &&
      field['autocomplete_attribute'].length >
          __gCrWeb.autofill.MAX_DATA_LENGTH) {
    // Discard overly long attribute values to avoid DOS-ing the browser
    // process. However, send over a default string to indicate that the
    // attribute was present.
    field['autocomplete_attribute'] = 'x-max-data-length-exceeded';
  }

  var role_attribute = element.getAttribute('role');
  if (role_attribute && role_attribute.toLowerCase() == 'presentation') {
    field['role'] = __gCrWeb.autofill.ROLE_ATTRIBUTE_PRESENTATION;
  }

  if (!__gCrWeb.autofill.isAutofillableElement(element)) {
    return;
  }

  if (__gCrWeb.autofill.isAutofillableInputElement(element) ||
          __gCrWeb.autofill.isTextAreaElement(element) ||
          __gCrWeb.autofill.isSelectElement(element)) {
    field['is_autofilled'] = element.isAutofilled;
    field['should_autocomplete'] = __gCrWeb.common.autoComplete(element);
    field['is_focusable'] = !element.disabled && !element.readOnly &&
        element.tabIndex >= 0 && isVisibleNode_(element);
  }

  if (__gCrWeb.autofill.isAutofillableInputElement(element)) {
    if (__gCrWeb.autofill.isTextInput(element)) {
      field['max_length'] = element.maxLength;
    }
    field['is_checkable'] = __gCrWeb.autofill.isCheckableElement(element);
  } else if (__gCrWeb.autofill.isTextAreaElement(element)) {
    // Nothing more to do in this case.
  } else if (extractMask & __gCrWeb.autofill.EXTRACT_MASK_OPTIONS) {
    __gCrWeb.autofill.getOptionStringsFromElement(element, field);
  }

  if (!(extractMask & __gCrWeb.autofill.EXTRACT_MASK_VALUE)) {
    return;
  }

  var value = __gCrWeb.autofill.value(element);

  if (__gCrWeb.autofill.isSelectElement(element) &&
      (extractMask & __gCrWeb.autofill.EXTRACT_MASK_OPTION_TEXT)) {
    // Convert the |select_element| value to text if requested.
    var options = element.options;
    for (var index = 0; index < options.length; ++index) {
      var optionElement = options[index];
      if (__gCrWeb.autofill.value(optionElement) === value) {
        value = optionElement.text;
        break;
      }
    }
  }

  // There is a constraint on the maximum data length in method
  // WebFormControlElementToFormField() in form_autofill_util.h in order to
  // prevent a malicious site from DOS'ing the browser: http://crbug.com/49332,
  // which isn't really meaningful here, but we need to follow the same logic to
  // get the same form signature wherever possible (to get the benefits of the
  // existing crowdsourced field detection corpus).
  if (value.length > __gCrWeb.autofill.MAX_DATA_LENGTH) {
    value = value.substr(0, __gCrWeb.autofill.MAX_DATA_LENGTH);
  }
  field['value'] = value;
};

/**
 * For debugging purposes, annotate forms on the page with prediction data using
 * the placeholder attribute.
 *
 * @param {Object<AutofillFormData>} data The form and field identifiers with
 *     their prediction data.
 */
__gCrWeb.autofill['fillPredictionData'] = function(data) {
  for (var formName in data) {
    var form = __gCrWeb.common.getFormElementFromIdentifier(formName);
    var formData = data[formName];
    var controlElements = __gCrWeb.common.getFormControlElements(form);
    for (var i = 0; i < controlElements.length; ++i) {
      var element = controlElements[i];
      if (!__gCrWeb.autofill.isAutofillableElement(element)) {
        continue;
      }
      var elementName = __gCrWeb['common'].nameForAutofill(element);
      var value = formData[elementName];
      if (value) {
        element.placeholder = value;
      }
    }
  }
};
