import type { Schema, Struct } from '@strapi/strapi';

export interface HomepagePillar extends Struct.ComponentSchema {
  collectionName: 'components_homepage_pillars';
  info: {
    displayName: 'Pillar';
    icon: 'grid';
  };
  attributes: {
    image: Schema.Attribute.Media<'images'> & Schema.Attribute.Required;
    link: Schema.Attribute.String;
    number: Schema.Attribute.String;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedJournalImage extends Struct.ComponentSchema {
  collectionName: 'components_shared_journal_images';
  info: {
    displayName: 'Journal Image';
    icon: 'picture';
  };
  attributes: {
    alt: Schema.Attribute.String;
    image: Schema.Attribute.Media<'images'> & Schema.Attribute.Required;
  };
}

export interface SharedNavLink extends Struct.ComponentSchema {
  collectionName: 'components_shared_nav_links';
  info: {
    displayName: 'Nav Link';
    icon: 'link';
  };
  attributes: {
    label: Schema.Attribute.String & Schema.Attribute.Required;
    url: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedTickerItem extends Struct.ComponentSchema {
  collectionName: 'components_shared_ticker_items';
  info: {
    displayName: 'Ticker Item';
    icon: 'list';
  };
  attributes: {
    label: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'homepage.pillar': HomepagePillar;
      'shared.journal-image': SharedJournalImage;
      'shared.nav-link': SharedNavLink;
      'shared.ticker-item': SharedTickerItem;
    }
  }
}
