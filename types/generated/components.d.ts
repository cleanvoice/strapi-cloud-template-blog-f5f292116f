import type { Schema, Struct } from '@strapi/strapi';

export interface ScoringFactors extends Struct.ComponentSchema {
  collectionName: 'components_scoring_factors';
  info: {
    description: 'Component from v3: scoring.factors';
    displayName: 'Factors';
  };
  attributes: {
    factor: Schema.Attribute.String;
    one_points_text: Schema.Attribute.String;
    one_tip_description: Schema.Attribute.String;
    one_tip_title: Schema.Attribute.String;
    three_points_text: Schema.Attribute.String;
    tree_points_text: Schema.Attribute.String;
    two_points_text: Schema.Attribute.String;
    two_tip_description: Schema.Attribute.Text;
    two_tip_title: Schema.Attribute.String;
  };
}

export interface ScoringGradeText extends Struct.ComponentSchema {
  collectionName: 'components_scoring_grade_text';
  info: {
    description: 'Component from v3: scoring.grade-text';
    displayName: 'Grade Text';
  };
  attributes: {
    description_text_rank: Schema.Attribute.String;
    rank: Schema.Attribute.String;
    short_text_rank: Schema.Attribute.String;
  };
}

export interface Sections123 extends Struct.ComponentSchema {
  collectionName: 'components_sections_1_2_3';
  info: {
    description: 'Component from v3: sections.1-2-3';
    displayName: '1 2 3';
  };
  attributes: {
    Header: Schema.Attribute.String;
    Items: Schema.Attribute.Component<'sections.1-2-3-item', true>;
    leveled: Schema.Attribute.Boolean;
    SubHeader: Schema.Attribute.String;
  };
}

export interface Sections123Item extends Struct.ComponentSchema {
  collectionName: 'components_sections_1_2_3_item';
  info: {
    description: 'Single item for the 1-2-3 section (v3 compatible)';
    displayName: '1 2 3 Item';
  };
  attributes: {
    Header: Schema.Attribute.String;
    Media: Schema.Attribute.Media<'images'>;
    Number: Schema.Attribute.String;
    SubHeader: Schema.Attribute.String;
  };
}

export interface SectionsAudioCarousel extends Struct.ComponentSchema {
  collectionName: 'components_sections_audio_carousel';
  info: {
    description: 'Component from v3: sections.audio-carousel';
    displayName: 'Audio Carousel';
  };
  attributes: {
    audiocarouselTab: Schema.Attribute.JSON;
    SubTitle: Schema.Attribute.String;
    Title: Schema.Attribute.String;
  };
}

export interface SectionsAudioCarouselTwo extends Struct.ComponentSchema {
  collectionName: 'components_sections_audio_carousel_two';
  info: {
    description: 'Component from v3: sections.audio-carousel-two';
    displayName: 'Audio Carousel Two';
  };
  attributes: {
    subtitle: Schema.Attribute.String;
    tabs: Schema.Attribute.JSON;
    title: Schema.Attribute.String;
  };
}

export interface SectionsAudioVisualizer extends Struct.ComponentSchema {
  collectionName: 'components_sections_audio_visualizer';
  info: {
    description: 'Component from v3: sections.audio-visualizer';
    displayName: 'Audio Visualizer';
  };
  attributes: {
    subtitle: Schema.Attribute.String;
    title: Schema.Attribute.String;
  };
}

export interface SectionsAudioVolume extends Struct.ComponentSchema {
  collectionName: 'components_sections_audio_volume';
  info: {
    description: 'Component from v3: sections.audio-volume';
    displayName: 'Audio Volume';
  };
  attributes: {
    subtitle: Schema.Attribute.String;
    title: Schema.Attribute.String;
  };
}

export interface SectionsBentoBox extends Struct.ComponentSchema {
  collectionName: 'components_sections_bento_box';
  info: {
    description: 'Component from v3: sections.bento-box';
    displayName: 'Bento Box';
  };
  attributes: {
    bento: Schema.Attribute.Component<'sections.bento-item', true>;
    CTA: Schema.Attribute.String;
    CTA_url: Schema.Attribute.String;
    subtitle: Schema.Attribute.String;
    title: Schema.Attribute.String;
  };
}

export interface SectionsBentoItem extends Struct.ComponentSchema {
  collectionName: 'components_sections_bento_item';
  info: {
    description: 'Single bento tile with media, text and link (v3 compatible)';
    displayName: 'Bento Item';
  };
  attributes: {
    ButtonLink: Schema.Attribute.String;
    ButtonText: Schema.Attribute.String;
    Content: Schema.Attribute.Text;
    Icon: Schema.Attribute.Media<'images' | 'videos' | 'files'>;
    ImagePosition: Schema.Attribute.String;
    Link: Schema.Attribute.Component<'shared.link', false>;
    Media: Schema.Attribute.Media<'images' | 'videos'>;
    Size: Schema.Attribute.String;
    Title: Schema.Attribute.String;
  };
}

export interface SectionsBigImageCta extends Struct.ComponentSchema {
  collectionName: 'components_sections_big_image_cta';
  info: {
    description: 'Component from v3: sections.big-image-cta';
    displayName: 'Big Image Cta';
  };
  attributes: {
    buttonLink: Schema.Attribute.String;
    buttonText: Schema.Attribute.String;
    image: Schema.Attribute.Media<'images'>;
    subtitle: Schema.Attribute.String;
    Title: Schema.Attribute.String;
  };
}

export interface SectionsBigVideoCta extends Struct.ComponentSchema {
  collectionName: 'components_sections_big_video_cta';
  info: {
    description: 'Component from v3: sections.big-video-cta';
    displayName: 'Big Video Cta';
  };
  attributes: {
    buttonLink: Schema.Attribute.String;
    buttonText: Schema.Attribute.String;
    cta: Schema.Attribute.String;
    cta_url: Schema.Attribute.String;
    description: Schema.Attribute.String;
    issilent: Schema.Attribute.String;
    mp4_url: Schema.Attribute.String;
    subtitle: Schema.Attribute.String;
    thumbnail_video_url: Schema.Attribute.String;
    title: Schema.Attribute.String;
    url: Schema.Attribute.String;
    video_url: Schema.Attribute.String;
    webm_url: Schema.Attribute.String;
  };
}

export interface SectionsBrandLogoItem extends Struct.ComponentSchema {
  collectionName: 'components_sections_brand_logo_item';
  info: {
    description: 'Single brand logo with media and optional URL';
    displayName: 'Brand Logo Item';
  };
  attributes: {
    Media: Schema.Attribute.Media<'images'>;
    mediaUrl: Schema.Attribute.String;
    name: Schema.Attribute.String;
    url: Schema.Attribute.String;
  };
}

export interface SectionsBrandLogos extends Struct.ComponentSchema {
  collectionName: 'components_sections_brand_logos';
  info: {
    description: 'Component from v3: sections.brand-logos';
    displayName: 'Brand Logos';
  };
  attributes: {
    brand: Schema.Attribute.Component<'sections.brand-logo-item', true>;
  };
}

export interface SectionsCta extends Struct.ComponentSchema {
  collectionName: 'components_sections_cta';
  info: {
    description: 'Component from v3: sections.cta';
    displayName: 'Cta';
  };
  attributes: {
    Button: Schema.Attribute.String;
    Title: Schema.Attribute.String;
  };
}

export interface SectionsCustomPlanCta extends Struct.ComponentSchema {
  collectionName: 'components_sections_custom_plan_cta';
  info: {
    description: 'Component from v3: sections.custom-plan-cta';
    displayName: 'Custom Plan Cta';
  };
  attributes: {
    buttonSubtext: Schema.Attribute.String;
    buttonText: Schema.Attribute.String;
    buttonUrl: Schema.Attribute.String;
    compareFeaturesText: Schema.Attribute.String;
    compareFeaturesUrl: Schema.Attribute.String;
    description: Schema.Attribute.String;
    enterpriseButtonText: Schema.Attribute.String;
    enterpriseButtonUrl: Schema.Attribute.String;
    enterpriseTitle: Schema.Attribute.String;
    freeTrialButtonText: Schema.Attribute.String;
    freeTrialSubtext: Schema.Attribute.String;
    freeTrialText: Schema.Attribute.String;
    priceUnit: Schema.Attribute.String;
    startingPrice: Schema.Attribute.String;
    subtitle: Schema.Attribute.String;
    tagline: Schema.Attribute.String;
    title: Schema.Attribute.String;
    viewPricingText: Schema.Attribute.String;
    viewPricingUrl: Schema.Attribute.String;
  };
}

export interface SectionsDemoItem extends Struct.ComponentSchema {
  collectionName: 'components_sections_demo_item';
  info: {
    description: 'Single demo item with fields like Label, Subtitle, DemoType, Icon, Title, and DemoData';
    displayName: 'Demo Item';
  };
  attributes: {
    DemoData: Schema.Attribute.JSON;
    DemoType: Schema.Attribute.String;
    Icon: Schema.Attribute.Media<'images' | 'files' | 'videos'>;
    Label: Schema.Attribute.String;
    Subtitle: Schema.Attribute.String;
    Title: Schema.Attribute.String;
  };
}

export interface SectionsDemoSection extends Struct.ComponentSchema {
  collectionName: 'components_sections_demo_section';
  info: {
    description: 'Component from v3: sections.demo-section';
    displayName: 'Demo Section';
  };
  attributes: {
    ctaLink: Schema.Attribute.String;
    ctaSubtext: Schema.Attribute.String;
    ctaText: Schema.Attribute.String;
    demo: Schema.Attribute.Component<'sections.demo-item', true>;
    title: Schema.Attribute.String;
  };
}

export interface SectionsFaq extends Struct.ComponentSchema {
  collectionName: 'components_sections_faq';
  info: {
    description: 'Component from v3: sections.faq';
    displayName: 'Faq';
  };
  attributes: {
    FAQItem: Schema.Attribute.JSON;
    Title: Schema.Attribute.String;
  };
}

export interface SectionsFeatureStates extends Struct.ComponentSchema {
  collectionName: 'components_sections_feature_states';
  info: {
    description: 'Component from v3: sections.feature-states';
    displayName: 'Feature States';
  };
  attributes: {
    description: Schema.Attribute.String;
    features: Schema.Attribute.JSON;
    mainSubtitle: Schema.Attribute.String;
    mainTitle: Schema.Attribute.String;
    states: Schema.Attribute.JSON;
  };
}

export interface SectionsGridImage extends Struct.ComponentSchema {
  collectionName: 'components_sections_grid_image';
  info: {
    description: 'Component from v3: sections.grid-image';
    displayName: 'Grid Image';
  };
  attributes: {
    ImageGrid: Schema.Attribute.Component<'sections.grid-image-item', true>;
    Title: Schema.Attribute.String;
  };
}

export interface SectionsGridImageItem extends Struct.ComponentSchema {
  collectionName: 'components_sections_grid_image_item';
  info: {
    description: 'Single feature tile with media, text and link (v3 compatible)';
    displayName: 'Grid Image Item';
  };
  attributes: {
    Link: Schema.Attribute.Component<'shared.link', false>;
    Media: Schema.Attribute.Media<'images'>;
    mediaUrl: Schema.Attribute.String;
    Text: Schema.Attribute.String;
  };
}

export interface SectionsHero extends Struct.ComponentSchema {
  collectionName: 'components_sections_hero';
  info: {
    description: 'Component from v3: sections.hero';
    displayName: 'Hero';
  };
  attributes: {
    ButtonText: Schema.Attribute.String;
    ButtonUrl: Schema.Attribute.String;
    CTA_subtitle: Schema.Attribute.String;
    freeTrialText: Schema.Attribute.String;
    newSubTitle: Schema.Attribute.String;
    newTitle: Schema.Attribute.String;
    senja_url: Schema.Attribute.String;
    SubTitle: Schema.Attribute.String;
    Title: Schema.Attribute.String;
  };
}

export interface SectionsIntroOutro extends Struct.ComponentSchema {
  collectionName: 'components_sections_intro_outro';
  info: {
    description: 'Component from v3: sections.intro-outro';
    displayName: 'Intro Outro';
  };
  attributes: {
    subtitle: Schema.Attribute.String;
    title: Schema.Attribute.String;
  };
}

export interface SectionsMarkdown extends Struct.ComponentSchema {
  collectionName: 'components_sections_markdown';
  info: {
    description: 'Component from v3: sections.markdown';
    displayName: 'Markdown';
  };
  attributes: {
    text: Schema.Attribute.RichText;
    title: Schema.Attribute.String;
  };
}

export interface SectionsMergeAudio extends Struct.ComponentSchema {
  collectionName: 'components_sections_merge_audio';
  info: {
    description: 'Component from v3: sections.merge-audio';
    displayName: 'Merge Audio';
  };
  attributes: {
    subtitle: Schema.Attribute.String;
    title: Schema.Attribute.String;
  };
}

export interface SectionsMicCheck extends Struct.ComponentSchema {
  collectionName: 'components_sections_mic_check';
  info: {
    description: 'Component from v3: sections.mic-check';
    displayName: 'Mic Check';
  };
  attributes: {
    subtitle: Schema.Attribute.String;
    title: Schema.Attribute.String;
  };
}

export interface SectionsNameGenerator extends Struct.ComponentSchema {
  collectionName: 'components_sections_name_generator';
  info: {
    description: 'Component from v3: sections.name-generator';
    displayName: 'Name Generator';
  };
  attributes: {
    placeholder: Schema.Attribute.String;
    searchText: Schema.Attribute.String;
  };
}

export interface SectionsPodcastSearch extends Struct.ComponentSchema {
  collectionName: 'components_sections_podcast_search';
  info: {
    description: 'Component from v3: sections.podcast-search';
    displayName: 'Podcast Search';
  };
  attributes: {
    errorText: Schema.Attribute.String;
    loadingText: Schema.Attribute.String;
    path: Schema.Attribute.String;
    placeholderText: Schema.Attribute.String;
    searchText: Schema.Attribute.String;
  };
}

export interface SectionsPricingNew extends Struct.ComponentSchema {
  collectionName: 'components_sections_pricing_new';
  info: {
    description: 'Component from v3: sections.pricing-new';
    displayName: 'Pricing New';
  };
  attributes: {
    customPlan: Schema.Attribute.JSON;
    pricingOptions: Schema.Attribute.JSON;
    subtitle: Schema.Attribute.String;
    title: Schema.Attribute.String;
  };
}

export interface SectionsQuoteMaker extends Struct.ComponentSchema {
  collectionName: 'components_sections_quote_maker';
  info: {
    description: 'Component from v3: sections.quote-maker';
    displayName: 'Quote Maker';
  };
  attributes: {
    subtitle: Schema.Attribute.String;
    title: Schema.Attribute.String;
  };
}

export interface SectionsSingleTestimonial extends Struct.ComponentSchema {
  collectionName: 'components_sections_single_testimonial';
  info: {
    description: 'Component from v3: sections.single-testimonial';
    displayName: 'Single Testimonial';
  };
  attributes: {
    senja_url: Schema.Attribute.String;
    subtitle: Schema.Attribute.String;
    title: Schema.Attribute.String;
  };
}

export interface SectionsStartupCta extends Struct.ComponentSchema {
  collectionName: 'components_sections_startup_cta';
  info: {
    description: 'Component from v3: sections.startup-cta';
    displayName: 'Startup Cta';
  };
  attributes: {
    badgeText: Schema.Attribute.String;
    buttonText: Schema.Attribute.String;
    buttonUrl: Schema.Attribute.String;
    description: Schema.Attribute.String;
    subtitle: Schema.Attribute.String;
    title: Schema.Attribute.String;
  };
}

export interface SectionsStatistics extends Struct.ComponentSchema {
  collectionName: 'components_sections_statistics';
  info: {
    description: 'Component from v3: sections.statistics';
    displayName: 'Statistics';
  };
  attributes: {
    statisticscard: Schema.Attribute.JSON;
    title: Schema.Attribute.String;
  };
}

export interface SectionsStickyFeatureTab extends Struct.ComponentSchema {
  collectionName: 'components_sections_sticky_feature_tab';
  info: {
    description: 'Component from v3: sections.sticky-feature-tab';
    displayName: 'Sticky Feature Tab';
  };
  attributes: {
    CTA: Schema.Attribute.String;
    CTA_text: Schema.Attribute.String;
    description: Schema.Attribute.String;
    icon_svg: Schema.Attribute.String;
    icon_url: Schema.Attribute.String;
    sections: Schema.Attribute.JSON;
    subtitle: Schema.Attribute.String;
    title: Schema.Attribute.String;
  };
}

export interface SectionsTestimonial extends Struct.ComponentSchema {
  collectionName: 'components_sections_testimonial';
  info: {
    description: 'Component from v3: sections.testimonial';
    displayName: 'Testimonial';
  };
  attributes: {
    data_id: Schema.Attribute.String;
    Title: Schema.Attribute.String;
  };
}

export interface SectionsTitleGenerator extends Struct.ComponentSchema {
  collectionName: 'components_sections_title_generator';
  info: {
    description: 'Component from v3: sections.title-generator';
    displayName: 'Title Generator';
  };
  attributes: {
    descriptionText: Schema.Attribute.String;
    loadingText: Schema.Attribute.String;
    placeholder: Schema.Attribute.String;
    searchText: Schema.Attribute.String;
  };
}

export interface SectionsTopicGenerator extends Struct.ComponentSchema {
  collectionName: 'components_sections_topic_generator';
  info: {
    description: 'Component from v3: sections.topic-generator';
    displayName: 'Topic Generator';
  };
  attributes: {
    descriptionText: Schema.Attribute.String;
    loadingText: Schema.Attribute.String;
    placeholder: Schema.Attribute.String;
    searchText: Schema.Attribute.String;
  };
}

export interface SectionsTrimAudio extends Struct.ComponentSchema {
  collectionName: 'components_sections_trim_audio';
  info: {
    description: 'Component from v3: sections.trim-audio';
    displayName: 'Trim Audio';
  };
  attributes: {
    subtitle: Schema.Attribute.String;
    title: Schema.Attribute.String;
  };
}

export interface SectionsTwoColFeature extends Struct.ComponentSchema {
  collectionName: 'components_sections_two_col_feature';
  info: {
    description: 'Component from v3: sections.two-col-feature';
    displayName: 'Two Col Feature';
  };
  attributes: {
    BodyText: Schema.Attribute.String;
    Header: Schema.Attribute.String;
    link: Schema.Attribute.JSON;
    LottiePath: Schema.Attribute.String;
    Media: Schema.Attribute.Media<'images' | 'files' | 'videos'>;
    side: Schema.Attribute.Boolean;
    VideoPath: Schema.Attribute.String;
  };
}

export interface SectionsVideoToAudio extends Struct.ComponentSchema {
  collectionName: 'components_sections_video_to_audio';
  info: {
    description: 'Component from v3: sections.video-to-audio';
    displayName: 'Video To Audio';
  };
  attributes: {
    subtitle: Schema.Attribute.String;
    title: Schema.Attribute.String;
  };
}

export interface SharedFooter extends Struct.ComponentSchema {
  collectionName: 'components_shared_footer';
  info: {
    displayName: 'footer';
  };
  attributes: {
    columns: Schema.Attribute.Component<'shared.footer-column', true>;
    smallText: Schema.Attribute.Text;
    smallTextCopyright: Schema.Attribute.String;
  };
}

export interface SharedFooterColumn extends Struct.ComponentSchema {
  collectionName: 'components_shared_footer_column';
  info: {
    displayName: 'footer column';
  };
  attributes: {
    links: Schema.Attribute.Component<'shared.link', true>;
    title: Schema.Attribute.String;
  };
}

export interface SharedLink extends Struct.ComponentSchema {
  collectionName: 'components_shared_link';
  info: {
    displayName: 'link';
  };
  attributes: {
    newTab: Schema.Attribute.Boolean;
    text: Schema.Attribute.String;
    url: Schema.Attribute.String;
  };
}

export interface SharedMedia extends Struct.ComponentSchema {
  collectionName: 'components_shared_media';
  info: {
    displayName: 'Media';
    icon: 'file-video';
  };
  attributes: {
    file: Schema.Attribute.Media<'images' | 'files' | 'videos'>;
  };
}

export interface SharedNavbar extends Struct.ComponentSchema {
  collectionName: 'components_shared_navbar';
  info: {
    displayName: 'navbar';
  };
  attributes: {
    links: Schema.Attribute.Component<'shared.link', true>;
  };
}

export interface SharedQuote extends Struct.ComponentSchema {
  collectionName: 'components_shared_quotes';
  info: {
    displayName: 'Quote';
    icon: 'indent';
  };
  attributes: {
    body: Schema.Attribute.Text;
    title: Schema.Attribute.String;
  };
}

export interface SharedRichText extends Struct.ComponentSchema {
  collectionName: 'components_shared_rich_texts';
  info: {
    description: '';
    displayName: 'Rich text';
    icon: 'align-justify';
  };
  attributes: {
    body: Schema.Attribute.RichText;
  };
}

export interface SharedSeo extends Struct.ComponentSchema {
  collectionName: 'components_shared_seos';
  info: {
    description: '';
    displayName: 'Seo';
    icon: 'allergies';
    name: 'Seo';
  };
  attributes: {
    allowIndexing: Schema.Attribute.Boolean;
    metaDescription: Schema.Attribute.Text;
    metaTitle: Schema.Attribute.String;
    preventIndexing: Schema.Attribute.Boolean;
    shareImage: Schema.Attribute.Media<'images'>;
    titleReversed: Schema.Attribute.Boolean;
    twitterCardType: Schema.Attribute.String;
    twitterUsername: Schema.Attribute.String;
  };
}

export interface SharedSlider extends Struct.ComponentSchema {
  collectionName: 'components_shared_sliders';
  info: {
    description: '';
    displayName: 'Slider';
    icon: 'address-book';
  };
  attributes: {
    files: Schema.Attribute.Media<'images', true>;
  };
}

export interface SharedSocial extends Struct.ComponentSchema {
  collectionName: 'components_shared_social';
  info: {
    displayName: 'social';
  };
  attributes: {
    facebookUrl: Schema.Attribute.String;
    instagramUrl: Schema.Attribute.String;
    linkedinUrl: Schema.Attribute.String;
    twitterUrl: Schema.Attribute.String;
    youtubeUrl: Schema.Attribute.String;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'scoring.factors': ScoringFactors;
      'scoring.grade-text': ScoringGradeText;
      'sections.1-2-3': Sections123;
      'sections.1-2-3-item': Sections123Item;
      'sections.audio-carousel': SectionsAudioCarousel;
      'sections.audio-carousel-two': SectionsAudioCarouselTwo;
      'sections.audio-visualizer': SectionsAudioVisualizer;
      'sections.audio-volume': SectionsAudioVolume;
      'sections.bento-box': SectionsBentoBox;
      'sections.bento-item': SectionsBentoItem;
      'sections.big-image-cta': SectionsBigImageCta;
      'sections.big-video-cta': SectionsBigVideoCta;
      'sections.brand-logo-item': SectionsBrandLogoItem;
      'sections.brand-logos': SectionsBrandLogos;
      'sections.cta': SectionsCta;
      'sections.custom-plan-cta': SectionsCustomPlanCta;
      'sections.demo-item': SectionsDemoItem;
      'sections.demo-section': SectionsDemoSection;
      'sections.faq': SectionsFaq;
      'sections.feature-states': SectionsFeatureStates;
      'sections.grid-image': SectionsGridImage;
      'sections.grid-image-item': SectionsGridImageItem;
      'sections.hero': SectionsHero;
      'sections.intro-outro': SectionsIntroOutro;
      'sections.markdown': SectionsMarkdown;
      'sections.merge-audio': SectionsMergeAudio;
      'sections.mic-check': SectionsMicCheck;
      'sections.name-generator': SectionsNameGenerator;
      'sections.podcast-search': SectionsPodcastSearch;
      'sections.pricing-new': SectionsPricingNew;
      'sections.quote-maker': SectionsQuoteMaker;
      'sections.single-testimonial': SectionsSingleTestimonial;
      'sections.startup-cta': SectionsStartupCta;
      'sections.statistics': SectionsStatistics;
      'sections.sticky-feature-tab': SectionsStickyFeatureTab;
      'sections.testimonial': SectionsTestimonial;
      'sections.title-generator': SectionsTitleGenerator;
      'sections.topic-generator': SectionsTopicGenerator;
      'sections.trim-audio': SectionsTrimAudio;
      'sections.two-col-feature': SectionsTwoColFeature;
      'sections.video-to-audio': SectionsVideoToAudio;
      'shared.footer': SharedFooter;
      'shared.footer-column': SharedFooterColumn;
      'shared.link': SharedLink;
      'shared.media': SharedMedia;
      'shared.navbar': SharedNavbar;
      'shared.quote': SharedQuote;
      'shared.rich-text': SharedRichText;
      'shared.seo': SharedSeo;
      'shared.slider': SharedSlider;
      'shared.social': SharedSocial;
    }
  }
}
