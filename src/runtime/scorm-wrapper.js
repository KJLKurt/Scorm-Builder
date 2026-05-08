/* SCORM 1.2 API wrapper — finds the LMSInitialize API in parent frames */
(function (global) {
  'use strict';

  var _api = null;
  var _initialized = false;
  var MAX_DEPTH = 7;

  function findAPIInWindow(win) {
    var depth = 0;
    while (win.API == null && win.parent != null && win.parent !== win) {
      depth++;
      if (depth > MAX_DEPTH) break;
      win = win.parent;
    }
    return win.API || null;
  }

  function locateAPI() {
    if (_api) return _api;
    _api = findAPIInWindow(window);
    if (!_api && window.opener) {
      _api = findAPIInWindow(window.opener);
    }
    return _api;
  }

  var ScormWrapper = {
    isAvailable: function () {
      return locateAPI() != null;
    },

    initialize: function () {
      var api = locateAPI();
      if (!api) {
        console.log('[SCORM] No SCORM API found — running in standalone/preview mode.');
        return false;
      }
      var result = api.LMSInitialize('');
      _initialized = result === 'true' || result === true;
      if (!_initialized) {
        console.warn('[SCORM] LMSInitialize failed. Error:', api.LMSGetLastError());
      } else {
        console.log('[SCORM] Initialized successfully.');
      }
      return _initialized;
    },

    getValue: function (key) {
      var api = locateAPI();
      if (!api || !_initialized) {
        console.log('[SCORM] getValue (no API):', key);
        return '';
      }
      var val = api.LMSGetValue(key);
      var err = api.LMSGetLastError();
      if (err !== '0' && err !== 0) {
        console.warn('[SCORM] LMSGetValue error for key "' + key + '":', err, api.LMSGetErrorString(err));
      }
      return val;
    },

    setValue: function (key, value) {
      var api = locateAPI();
      if (!api || !_initialized) {
        console.log('[SCORM] setValue (no API):', key, '=', value);
        return false;
      }
      var result = api.LMSSetValue(key, String(value));
      if (result !== 'true' && result !== true) {
        var err = api.LMSGetLastError();
        console.warn('[SCORM] LMSSetValue failed for "' + key + '":', err, api.LMSGetErrorString(err));
        return false;
      }
      return true;
    },

    commit: function () {
      var api = locateAPI();
      if (!api || !_initialized) return false;
      var result = api.LMSCommit('');
      return result === 'true' || result === true;
    },

    finish: function () {
      var api = locateAPI();
      if (!api || !_initialized) return false;
      var result = api.LMSFinish('');
      _initialized = false;
      return result === 'true' || result === true;
    },
  };

  global.ScormWrapper = ScormWrapper;
})(window);
