"use strict";

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::global.global", ({ strapi }) => ({
  async find(ctx) {
    const locale = ctx.query?._locale || ctx.query?.locale || "en";
    // Fetch single-type with populated relations
    // Use query API for reliability
    const results = await strapi.db
      .query("api::global.global")
      .findMany({
        where: { locale },
        populate: {
          SEO: true,
          navbar: { populate: ["links"] },
          footer: { populate: { columns: { populate: ["links"] } } },
          social: true,
        },
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
        limit: 1,
      });
    let entity = results?.[0] || null;

    // Removed v3 file-based fallback. In production, rely solely on database content.

    // v3 compatibility: expose SEO and always provide an object
    if (entity) {
      // Prefer `SEO` (v3 naming). Fallback to `defaultSeo` if old data still exists.
      entity.SEO = entity?.SEO || entity?.defaultSeo || {};
      // Ensure navbar/footer/social keys exist with safe defaults (v3 clients expect objects)
      entity.navbar = entity.navbar || { links: [] };
      if (!Array.isArray(entity.navbar.links)) entity.navbar.links = [];
      entity.footer = entity.footer || { columns: [] };
      if (!Array.isArray(entity.footer.columns)) entity.footer.columns = [];
      entity.social = entity.social || {};
    }

    // Return flat object (v3 shape) and always ensure SEO exists for v3 clients
    ctx.body = entity || { SEO: {} };
  },
}));
