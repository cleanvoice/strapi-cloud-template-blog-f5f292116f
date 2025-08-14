module.exports = [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  'strapi::cors',
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  // Map upload admin query param folderPath -> folder.path for v3/v4 compatibility
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
