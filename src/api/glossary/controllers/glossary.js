'use strict';

/**
 * glossary controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::glossary.glossary', ({ strapi }) => ({
  async find(ctx) {
    try {
      const entities = await strapi.entityService.findMany('api::glossary.glossary', {
        populate: {
          Entries: true
        }
      });

      // If no glossary exists, return default data
      if (!entities || entities.length === 0) {
        return {
          data: {
            id: 1,
            Title: 'Podcast Glossary',
            Description: 'Complete collection of podcasting terms and definitions',
            Entries: [
              {
                id: 1,
                Title: 'Dead Air',
                Description: 'Unwanted silence or pauses in audio recordings that can make content feel unprofessional.',
                Metadata: { category: 'audio-editing' }
              },
              {
                id: 2,
                Title: 'Filler Words',
                Description: 'Words like "um," "ah," and "you know" that speakers use to fill pauses but can distract listeners.',
                Metadata: { category: 'speech' }
              },
              {
                id: 3,
                Title: 'Background Noise',
                Description: 'Unwanted sounds in the background of a recording, such as traffic, pets, or room ambiance.',
                Metadata: { category: 'audio-quality' }
              }
            ]
          },
          meta: {}
        };
      }

      const glossary = entities[0];

      // Ensure Entries is always an array
      if (!glossary.Entries) {
        glossary.Entries = [];
      }

      return {
        data: {
          id: glossary.id,
          Title: glossary.Title,
          Description: glossary.Description,
          Entries: glossary.Entries
        },
        meta: {}
      };
    } catch (error) {
      strapi.log.error('Error in glossary controller:', error);
      return {
        data: {
          id: 1,
          Title: 'Podcast Glossary',
          Description: 'Complete collection of podcasting terms and definitions',
          Entries: [
            {
              id: 1,
              Title: 'Dead Air',
              Description: 'Unwanted silence or pauses in audio recordings that can make content feel unprofessional.',
              Metadata: { category: 'audio-editing' }
            },
            {
              id: 2,
              Title: 'Filler Words',
              Description: 'Words like "um," "ah," and "you know" that speakers use to fill pauses but can distract listeners.',
              Metadata: { category: 'speech' }
            },
            {
              id: 3,
              Title: 'Background Noise',
              Description: 'Unwanted sounds in the background of a recording, such as traffic, pets, or room ambiance.',
              Metadata: { category: 'audio-quality' }
            }
          ]
        },
        meta: {}
      };
    }
  }
}));
