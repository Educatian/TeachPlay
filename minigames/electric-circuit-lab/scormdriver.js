(function () {
  function findApi(win) {
    var tries = 0;
    while (win && tries < 20) {
      if (win.API) return win.API;
      if (win.parent && win.parent !== win) win = win.parent;
      else break;
      tries += 1;
    }
    if (window.opener && window.opener !== window) {
      tries = 0;
      win = window.opener;
      while (win && tries < 20) {
        if (win.API) return win.API;
        if (win.parent && win.parent !== win) win = win.parent;
        else break;
        tries += 1;
      }
    }
    return null;
  }

  var api = null;
  var initialized = false;

  function getApi() {
    if (!api) api = findApi(window);
    return api;
  }

  function call(method, arg1, arg2) {
    var target = getApi();
    if (!target || typeof target[method] !== "function") return "";
    try {
      if (arguments.length === 1) return target[method]();
      if (arguments.length === 2) return target[method](arg1);
      return target[method](arg1, arg2);
    } catch (error) {
      return "";
    }
  }

  window.Scorm12 = {
    init: function () {
      if (initialized) return true;
      var result = String(call("LMSInitialize", ""));
      initialized = result === "true";
      return initialized;
    },
    get: function (key) {
      if (!initialized) return "";
      return String(call("LMSGetValue", key) || "");
    },
    set: function (key, value) {
      if (!initialized) return false;
      return String(call("LMSSetValue", key, String(value))) === "true";
    },
    commit: function () {
      if (!initialized) return false;
      return String(call("LMSCommit", "")) === "true";
    },
    finish: function () {
      if (!initialized) return false;
      var ok = String(call("LMSFinish", "")) === "true";
      initialized = false;
      return ok;
    },
    connected: function () {
      return !!getApi();
    }
  };
})();
