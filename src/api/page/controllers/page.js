"use strict";

const { createCoreController } = require("@strapi/strapi").factories;

const v3ImageMap = (() => {
  try {
    return require("../../../config/v3-image-map.json");
  } catch (e) {
    return {};
  }
})();

module.exports = createCoreController("api::page.page", ({ strapi }) => ({
  async _getUploadById(id) {
    try {
      if (!id) return null;
      const file = await strapi.entityService.findOne("plugin::upload.file", id);
      return file && file.url ? file : null;
    } catch (_) {
      return null;
    }
  },
  async _mapSectionsV3(sections) {
    if (!Array.isArray(sections)) return sections;
    const out = [];
    for (const sec of sections) {
      if (!sec || typeof sec !== "object") {
        out.push(sec);
        continue;
      }
      // Demo section: normalize to frontend schema and ensure icon URL & stable id
      if (sec.__component === "sections.demo-section" && Array.isArray(sec.demo)) {
        const demo = [];
        let idx = 0;
        for (const item of sec.demo) {
          if (item && typeof item === "object") {
            // Normalize base fields (support both cases)
            const label = item.Label ?? item.label ?? item.Title ?? item.title ?? '';
            const title = item.Title ?? item.title ?? label;
            const subtitle = item.Subtitle ?? item.subtitle ?? item.Text ?? item.text ?? '';
            const demoType = item.DemoType ?? item.demoType ?? '';
            const demoData = item.DemoData ?? item.demoData ?? null;
            let id = item.id ?? (this._slugify(label) || null);
            if (!id) {
              id = `demo-${idx + 1}`;
            }
            // Resolve icon to object with url
            const sourceIcon = Object.prototype.hasOwnProperty.call(item, 'Icon') ? item.Icon : item.icon;
            let iconUrl = '';
            if (typeof sourceIcon === 'number') {
              const f = await this._getUploadById(sourceIcon);
              iconUrl = f?.url || '';
            } else if (sourceIcon && typeof sourceIcon === 'object' && typeof sourceIcon.url === 'string') {
              iconUrl = sourceIcon.url;
            } else if (typeof sourceIcon === 'string') {
              iconUrl = sourceIcon;
            }
            demo.push({ id, label, title, subtitle, demoType, demoData, icon: iconUrl ? { url: iconUrl } : undefined });
            idx++;
            continue;
          }
          // Strings or other primitives -> coerce into minimal item
          const label = String(item || '').trim();
          const id = label ? this._slugify(label) : `demo-${idx + 1}`;
          demo.push({ id, label, title: label, subtitle: '', demoType: '', demoData: null });
          idx++;
        }
        // Ensure exactly 3 items if possible
        const three = demo.slice(0, 3);
        const ctaText = sec.ctaText || 'Clean it for free';
        const ctaLink = sec.ctaLink || 'https://app.cleanvoice.ai/beta';
        const ctaSubtext = sec.ctaSubtext || 'Without sign-up. No credit card needed.';
        out.push({ ...sec, ctaText, ctaLink, ctaSubtext, demo: three });
        continue;
      }
      // Bento: expose v3 field aliases alongside v5 fields
      if (sec.__component === "sections.bento-box" && Array.isArray(sec.bento)) {
        const bento = [];
        for (const it of sec.bento) {
          if (it && typeof it === "object") {
            const mediaUrl = it?.Media?.url || it?.mediaUrl || null;
            const linkText = it?.ButtonText || it?.Link?.text || null;
            const linkUrl = it?.ButtonLink || it?.Link?.url || null;
            const content = it?.Content ?? it?.Subtitle ?? '';
            const size = it?.Size ?? it?.size ?? '';
            const imagePosition = it?.ImagePosition ?? it?.imagePosition ?? '';
            const iconUrl = it?.Icon?.url || '';
            bento.push({
              ...it,
              // v3 aliases
              Image: mediaUrl ? { url: mediaUrl } : undefined,
              ButtonText: it.ButtonText ?? linkText ?? '',
              ButtonLink: it.ButtonLink ?? linkUrl ?? '',
              Content: content,
              Size: size,
              ImagePosition: imagePosition,
              Icon: iconUrl,
            });
          } else {
            bento.push(it);
          }
        }
        out.push({ ...sec, bento });
        continue;
      }
      // Big Image CTA: ensure image has a usable URL in response
      if (sec.__component === "sections.big-image-cta") {
        let image = sec.image;
        if (!image || (typeof image === "object" && !image.url)) {
          image = { url: "/uploads/1_568c4af47e.png" };
        }
        out.push({ ...sec, image });
        continue;
      }
      out.push(sec);
    }
    return out;
  },
  _featureSlugFromLink(link) {
    if (!link) return null;
    const url = link.url || link.href || "";
    const match = url.match(/\/([a-z0-9\-]+)\/?$/i);
    if (match) return match[1].toLowerCase();
    return null;
  },
  _slugify(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  },
  // Add a small helper to flatten Strapi v4/v5 media objects to have a direct .url
  _flattenMediaFields(object) {
    if (!object || typeof object !== "object") return object;

    const clone = Array.isArray(object) ? [...object] : { ...object };

    const flattenIfMedia = (val) => {
      const url = val?.data?.attributes?.url;
      if (url) return { url };
      return val;
    };

    if (Array.isArray(clone)) {
      return clone.map((item) => this._flattenMediaFields(item));
    }

    for (const key of Object.keys(clone)) {
      const val = clone[key];
      // Media single
      if (val && typeof val === "object" && val.data && val.data.attributes) {
        clone[key] = flattenIfMedia(val);
        continue;
      }
      // Media array
      if (Array.isArray(val) && val.length && val[0]?.data?.attributes) {
        clone[key] = val.map((v) => flattenIfMedia(v));
        continue;
      }
      // Recurse into nested objects/arrays
      if (val && typeof val === "object") {
        clone[key] = this._flattenMediaFields(val);
      }
    }

    return clone;
  },
  // Resolve numeric media IDs embedded inside JSON fields (e.g., components with JSON attributes)
  async _resolveMediaIds(input) {
    if (!input) return input;
    const isPlainObject = (val) => Object.prototype.toString.call(val) === "[object Object]";
    const mediaLikeKey = (key) => /^(media|image|icon|heroimage|shareimage|thumbnail|logo|file|files)$/i.test(key);

    if (Array.isArray(input)) {
      const resolved = [];
      for (const item of input) {
        resolved.push(await this._resolveMediaIds(item));
      }
      return resolved;
    }

    if (isPlainObject(input)) {
      const clone = { ...input };
      const FEATURES_IMAGE_MAP = v3ImageMap;
      for (const [key, value] of Object.entries(clone)) {
        // 1) Prefer explicit v3 mapping for feature grid items or migrate string URL
        if (key === "Media" && ("Text" in clone || "Link" in clone)) {
          const slugFromLink = this._featureSlugFromLink(clone.Link);
          const slugFromText = this._slugify(clone.Text);
          const preferredSlug = slugFromLink || slugFromText;
          const mappedUrl = preferredSlug ? FEATURES_IMAGE_MAP[preferredSlug] : null;
          if (mappedUrl) {
            clone[key] = { url: mappedUrl };
            continue; // mapping applied
          }
          // If there is a mediaUrl string, use it as-is
          if (typeof clone.mediaUrl === "string" && clone.mediaUrl) {
            clone[key] = { url: clone.mediaUrl };
            continue;
          }
        }

        // 2) Otherwise resolve numeric media ids normally
        if (mediaLikeKey(key)) {
          const numericId = typeof value === "number" ? value : (value && typeof value === "object" && typeof value.id === "number" ? value.id : null);
          if (numericId != null) {
            try {
              const file = await strapi.db.query("plugin::upload.file").findOne({ where: { id: numericId } });
              if (file?.url) {
                clone[key] = {
                  url: file.url,
                  width: file.width,
                  height: file.height,
                  alternativeText: file.alternativeText || file.name,
                };
              }
            } catch (e) {
              // ignore if file not found
            }
            continue;
          }
        }

        // 3) Recurse into nested structures
        clone[key] = await this._resolveMediaIds(value);
      }
      return clone;
    }

    return input;
  },
  async find(ctx) {
    // Return v3-compatible array of pages for frontend
    const q = ctx.query || {};
    const locale = q._locale || q.locale || "en";
    const filters = {};
    if (q.slug) filters.slug = { $eq: q.slug };

    const entities = await strapi.entityService.findMany("api::page.page", {
      locale,
      filters,
      // Deep-populate nested components including grid item links
      populate: {
        SEO: { populate: "*" },
          // For dynamic zones (polymorphic), Strapi requires '*' for second level links
          // Use per-component population to include third-level nested pieces like Grid Image Item -> Link
          contentSections: {
            populate: "*",
            on: {
              // Deep populate for all known section components
              "sections.two-col-feature": { populate: "*" },
              "sections.hero": { populate: "*" },
              "sections.demo-section": { populate: { demo: { populate: { Icon: true }} } },
              // Brand logos: include Media for each logo
              "sections.brand-logos": {
                populate: { brand: { populate: { Media: true } } },
              },
              "sections.sticky-feature-tab": { populate: "*" },
              // Bento: include Media, Icon and Link for tiles (v3-compatible fields too)
              "sections.bento-box": {
                populate: { bento: { populate: { Media: true, Icon: true, Link: true } } },
              },
              // Steps (1-2-3): deep-populate nested repeatable items to include Media relation
              "sections.1-2-3": {
                populate: {
                  Items: { populate: { Media: true } },
                },
              },
              "sections.big-image-cta": { populate: "*" },
              "sections.single-testimonial": { populate: "*" },
              "sections.statistics": { populate: "*" },
              "sections.testimonial": { populate: "*" },
              "sections.faq": { populate: "*" },
              "sections.pricing-new": { populate: "*" },
              "sections.cta": { populate: "*" },
              "sections.grid-image": {
                populate: {
                  ImageGrid: {
                    populate: { Link: true },
                  },
                },
              },
              "sections.name-generator": { populate: "*" },
              "sections.markdown": { populate: "*" },
              "sections.podcast-search": { populate: "*" },
              "sections.topic-generator": { populate: "*" },
              "sections.title-generator": { populate: "*" },
              "sections.audio-carousel": { populate: "*" },
              "sections.audio-carousel-two": { populate: "*" },
              "sections.big-video-cta": { populate: "*" },
              "sections.feature-states": { populate: "*" },
              "sections.custom-plan-cta": { populate: "*" },
              "sections.startup-cta": { populate: "*" },
              "sections.video-to-audio": { populate: "*" },
              "sections.trim-audio": { populate: "*" },
              "sections.audio-volume": { populate: "*" },
              "sections.merge-audio": { populate: "*" },
              "sections.mic-check": { populate: "*" },
              "sections.intro-outro": { populate: "*" },
              "sections.audio-visualizer": { populate: "*" },
              "sections.quote-maker": { populate: "*" },
            },
          },
      },
    });

    const payload = [];
    for (const e of Array.isArray(entities) ? entities : []) {
      try {
        if (e?.slug) {
          const types = Array.isArray(e.contentSections)
            ? e.contentSections.map((s) => s?.__component).filter(Boolean)
            : [];
          strapi.log.info(
            `[page.find] slug=${e.slug} sections=${types.length} types=${types.join(",")}`
          );
        }
      } catch (err) {
        // ignore logging issues
      }
      let resolvedSections = e.contentSections ? await this._resolveMediaIds(e.contentSections) : [];
      resolvedSections = await this._mapSectionsV3(resolvedSections);
      payload.push({
        id: e.id,
        slug: e.slug,
        shortName: e.shortName,
        locale: e.locale,
        status: e.publishedAt ? "published" : "draft",
        metadata: e.SEO ? this._flattenMediaFields(e.SEO) : null,
        localizations: e.localizations || [],
        contentSections: resolvedSections ? this._flattenMediaFields(resolvedSections) : [],
      });
    }

    ctx.body = payload;
  },

  async findOne(ctx) {
    // Provide v3-compatible single entry when requested by id
    const { id } = ctx.params;
    const q = ctx.query || {};
    const locale = q._locale || q.locale || "en";
    const entity = await strapi.entityService.findOne("api::page.page", id, {
      locale,
      populate: {
        SEO: { populate: "*" },
        // For dynamic zones (polymorphic), Strapi requires '*' for second level links
        // Use per-component population to include third-level nested pieces like Grid Image Item -> Link
        contentSections: {
          populate: "*",
          on: {
            "sections.two-col-feature": { populate: "*" },
            "sections.hero": { populate: "*" },
            "sections.demo-section": { populate: "*" },
            // Brand logos: include Media for each logo
            "sections.brand-logos": {
              populate: { brand: { populate: { Media: true } } },
            },
            "sections.sticky-feature-tab": { populate: "*" },
            // Bento: include Media, Icon and Link for tiles (v3-compatible fields too)
            "sections.bento-box": {
              populate: { bento: { populate: { Media: true, Icon: true, Link: true } } },
            },
            // Steps (1-2-3): deep-populate nested repeatable items to include Media relation
            "sections.1-2-3": {
              populate: {
                Items: { populate: { Media: true } },
              },
            },
            "sections.big-image-cta": { populate: "*" },
            "sections.single-testimonial": { populate: "*" },
            "sections.statistics": { populate: "*" },
            "sections.testimonial": { populate: "*" },
            "sections.faq": { populate: "*" },
            "sections.pricing-new": { populate: "*" },
            "sections.cta": { populate: "*" },
            "sections.grid-image": {
              populate: {
                ImageGrid: {
                  populate: { Link: true },
                },
              },
            },
            "sections.name-generator": { populate: "*" },
            "sections.markdown": { populate: "*" },
            "sections.podcast-search": { populate: "*" },
            "sections.topic-generator": { populate: "*" },
            "sections.title-generator": { populate: "*" },
            "sections.audio-carousel": { populate: "*" },
            "sections.audio-carousel-two": { populate: "*" },
            "sections.big-video-cta": { populate: "*" },
            "sections.feature-states": { populate: "*" },
            "sections.custom-plan-cta": { populate: "*" },
            "sections.startup-cta": { populate: "*" },
            "sections.video-to-audio": { populate: "*" },
            "sections.trim-audio": { populate: "*" },
            "sections.audio-volume": { populate: "*" },
            "sections.merge-audio": { populate: "*" },
            "sections.mic-check": { populate: "*" },
            "sections.intro-outro": { populate: "*" },
            "sections.audio-visualizer": { populate: "*" },
            "sections.quote-maker": { populate: "*" },
          },
        },
      },
    });
    if (!entity) {
      ctx.body = null;
      return null;
    }
    let resolvedSections = entity.contentSections ? await this._resolveMediaIds(entity.contentSections) : [];
    resolvedSections = await this._mapSectionsV3(resolvedSections);
    const result = {
      id: entity.id,
      slug: entity.slug,
      shortName: entity.shortName,
      locale: entity.locale,
      status: entity.publishedAt ? "published" : "draft",
      metadata: entity.SEO ? this._flattenMediaFields(entity.SEO) : null,
      localizations: entity.localizations || [],
      contentSections: resolvedSections ? this._flattenMediaFields(resolvedSections) : [],
    };
    ctx.body = result;
    return result;
  },
}));
