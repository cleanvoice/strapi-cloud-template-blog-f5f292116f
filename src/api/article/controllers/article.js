'use strict';

/**
 *  article controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::article.article', ({ strapi }) => ({
  async find(ctx) {
    const entities = await strapi.entityService.findMany('api::article.article', {
      populate: {
        category: true,
        image: true,
        tags: true
      }
    });

    // Ensure we always return an array
    const articles = Array.isArray(entities) ? entities : [];

    return {
      data: articles,
      meta: {}
    };
  }
}));
