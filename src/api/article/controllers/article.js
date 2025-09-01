'use strict';

/**
 *  article controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::article.article', ({ strapi }) => ({
  async _getUploadById(id) {
    try {
      if (!id) return null;
      const file = await strapi.entityService.findOne('plugin::upload.file', id);
      return file && file.url ? file : null;
    } catch (_) {
      return null;
    }
  },

  async _resolveMediaIds(input) {
    if (!input) return input;
    const isPlainObject = (val) => Object.prototype.toString.call(val) === '[object Object]';

    if (Array.isArray(input)) {
      const resolved = [];
      for (const item of input) {
        resolved.push(await this._resolveMediaIds(item));
      }
      return resolved;
    }

    if (isPlainObject(input)) {
      const clone = { ...input };
      for (const [key, value] of Object.entries(clone)) {
        if (key === 'image') {
          if (value === null || value === undefined) {
            // Handle null/undefined image - keep as null
            clone[key] = null;
          } else if (typeof value === 'number') {
            // Handle numeric image IDs by resolving to the actual file
            const file = await this._getUploadById(value);
            if (file) {
              clone[key] = file.id;
            } else {
              // If file not found, set to null to clear the field
              clone[key] = null;
            }
          } else if (isPlainObject(value) && value.id) {
            // Handle object with ID (already resolved file)
            clone[key] = value.id;
          } else if (isPlainObject(value)) {
            // Handle object without ID - try to resolve by URL or other means
            if (value.url) {
              const files = await strapi.entityService.findMany('plugin::upload.file', {
                filters: { url: value.url },
                limit: 1
              });
              const file = files && files[0];
              if (file) {
                clone[key] = file.id;
              } else {
                clone[key] = null;
              }
            } else {
              clone[key] = null;
            }
          }
        } else if (isPlainObject(value) || Array.isArray(value)) {
          clone[key] = await this._resolveMediaIds(value);
        }
      }
      return clone;
    }

    return input;
  },

  async find(ctx) {
    const entities = await strapi.entityService.findMany('api::article.article', {
      populate: {
        category: true,
        image: true,
        tags: true,
        seo: true
      }
    });

    // Ensure we always return an array
    const articles = Array.isArray(entities) ? entities : [];

    return {
      data: articles,
      meta: {}
    };
  },

  async create(ctx) {
    // Resolve any media IDs in the request body
    if (ctx.request.body && ctx.request.body.data) {
      ctx.request.body.data = await this._resolveMediaIds(ctx.request.body.data);
    }

    // Call the default core action
    const result = await super.create(ctx);

    // Ensure image is populated in the response
    if (result.data && result.data.id) {
      const populated = await strapi.entityService.findOne('api::article.article', result.data.id, {
        populate: {
          category: true,
          image: true,
          tags: true,
          seo: true
        }
      });
      return { data: populated, meta: result.meta };
    }

    return result;
  },

  async delete(ctx) {
    // Handle image cleanup before deletion if needed
    const { id } = ctx.params;
    if (id) {
      try {
        const article = await strapi.entityService.findOne('api::article.article', id, {
          populate: { image: true }
        });

        // If article has an image, we might want to handle cleanup here
        // For now, just proceed with normal deletion
      } catch (error) {
        strapi.log.warn(`Failed to find article ${id} before deletion: ${error.message}`);
      }
    }

    return await super.delete(ctx);
  },

  async update(ctx) {
    // Resolve any media IDs in the request body
    if (ctx.request.body && ctx.request.body.data) {
      ctx.request.body.data = await this._resolveMediaIds(ctx.request.body.data);
    }

    // Handle special case for image replacement
    const { id } = ctx.params;
    const articleData = ctx.request.body.data;

    if (id && articleData && articleData.image !== undefined) {
      try {
        // Get the current article to see if there's an existing image
        const currentArticle = await strapi.entityService.findOne('api::article.article', id, {
          populate: { image: true }
        });

        // If the image field is being set to null, ensure it's properly handled
        if (articleData.image === null) {
          articleData.image = null;
        }

        // Log for debugging
        strapi.log.info(`Updating article ${id} - current image: ${currentArticle?.image?.id}, new image: ${articleData.image}`);
      } catch (error) {
        strapi.log.warn(`Failed to get current article state for image handling: ${error.message}`);
      }
    }

    // Call the default core action
    const result = await super.update(ctx);

    // Ensure image is populated in the response
    if (result.data && result.data.id) {
      const populated = await strapi.entityService.findOne('api::article.article', result.data.id, {
        populate: {
          category: true,
          image: true,
          tags: true,
          seo: true
        }
      });
      return { data: populated, meta: result.meta };
    }

    return result;
  }
}));
