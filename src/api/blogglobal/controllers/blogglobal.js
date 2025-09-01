'use strict';

/**
 * blogglobal controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::blogglobal.blogglobal', ({ strapi }) => ({
  async find(ctx) {
    // Override the default find method to ensure metadata is populated
    const entity = await strapi.entityService.findMany('api::blogglobal.blogglobal', {
      populate: {
        metadata: {
          populate: '*'
        }
      }
    });

    // Since blogglobal is a single type, return the first (and only) entity
    const blogglobal = Array.isArray(entity) ? entity[0] : entity;

    return {
      data: blogglobal,
      meta: {}
    };
  }
}));
