"use strict";

module.exports = (plugin) => {
  try {
    const contentApi = plugin.routes?.["content-api"]?.routes || [];
    // Make GET /i18n/locales public
    const localesList = contentApi.find(
      (r) => r.method === "GET" && r.path === "/locales"
    );
    if (localesList) {
      localesList.config = localesList.config || {};
      localesList.config.auth = false;
    }
  } catch (e) {
    // noop
  }
  return plugin;
};


