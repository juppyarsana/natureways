'use strict';

const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, '..', '..', 'seed-assets');

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const MIME_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
};

async function uploadImage(strapi, filename, alt) {
  const filepath = path.join(ASSETS_DIR, filename);
  const { size } = fs.statSync(filepath);
  const ext = path.extname(filename).toLowerCase();

  const [uploaded] = await strapi.plugin('upload').service('upload').upload({
    data: {
      fileInfo: {
        alternativeText: alt,
        caption: alt,
        name: filename,
      },
    },
    files: {
      filepath,
      originalFilename: filename,
      mimetype: MIME_TYPES[ext] || 'application/octet-stream',
      size,
    },
  });

  return uploaded;
}

const SUBCATEGORIES_BY_PILLAR = {
  Food: ['Seasonal Living', 'Nature-Based Recipes', 'Farm & Producer Stories', 'Places to Eat'],
  Space: ['Architecture', 'Landscape', 'Hospitality', 'Home & Living', 'Environmental Psychology'],
  Nature: ['Forest Bathing', 'Nature & Wellbeing', 'Slow Travel', 'Wilderness Psychology', 'Field Notes'],
  Workshop: ['Nature Reset', 'Road Trip Experiences', 'Forest Immersion', 'Private Sessions', 'Upcoming Events'],
};

async function seed(strapi) {
  const existingHomepage = await strapi.documents('api::homepage.homepage').findFirst();
  if (existingHomepage) {
    strapi.log.info('[bootstrap] Homepage already seeded, skipping.');
    return;
  }

  strapi.log.info('[bootstrap] Seeding NatureWays content...');

  // ── Pillars (taxonomy collection type) ─────────────────────
  const pillarImages = {
    Food: await uploadImage(strapi, 'pillar-food.jpg', 'Natural food'),
    Space: await uploadImage(strapi, 'pillar-space.jpg', 'Natural space'),
    Nature: await uploadImage(strapi, 'pillar-nature.jpg', 'Forest nature'),
    Workshop: await uploadImage(strapi, 'pillar-workshop.jpg', 'Workshop retreat'),
  };

  const pillars = {};
  for (const name of ['Food', 'Space', 'Nature', 'Workshop']) {
    pillars[name] = await strapi.documents('api::pillar.pillar').create({
      data: {
        name,
        slug: slugify(name),
        heroImage: pillarImages[name].id,
      },
    });
  }

  // ── Subcategories ───────────────────────────────────────────
  for (const [pillarName, subcategoryNames] of Object.entries(SUBCATEGORIES_BY_PILLAR)) {
    for (const name of subcategoryNames) {
      await strapi.documents('api::subcategory.subcategory').create({
        data: {
          name,
          slug: slugify(name),
          pillar: pillars[pillarName].documentId,
        },
      });
    }
  }

  // ── Articles ─────────────────────────────────────────────────
  const articleSeeds = [
    {
      title: 'Cooking with what the season gives you',
      excerpt:
        'A quiet Sunday in the kitchen, a handful of foraged herbs, and the understanding that the best meals begin outside.',
      pillarName: 'Food',
      subcategoryName: 'Nature-Based Recipes',
      publishDate: '2026-06-01',
      image: 'article-seasonal-recipe.jpg',
      alt: 'Seasonal recipe',
    },
    {
      title: 'Designing for belonging: homes that breathe',
      excerpt:
        'How a new generation of architects is dissolving the boundary between built and wild.',
      pillarName: 'Space',
      subcategoryName: 'Architecture',
      publishDate: '2026-05-01',
      image: 'article-architecture.jpg',
      alt: 'Architecture in nature',
    },
    {
      title: 'Slow travel as a form of listening',
      excerpt:
        'To travel slowly is to become available — to encounter not just a place, but what the place is trying to tell you.',
      pillarName: 'Nature',
      subcategoryName: 'Slow Travel',
      publishDate: '2026-04-01',
      image: 'article-slow-travel.jpg',
      alt: 'Slow travel',
    },
  ];

  const subcategoryLookup = {};
  const allSubcategories = await strapi.documents('api::subcategory.subcategory').findMany({
    populate: ['pillar'],
  });
  for (const sub of allSubcategories) {
    subcategoryLookup[sub.name] = sub;
  }

  const articles = [];
  for (const seedArticle of articleSeeds) {
    const coverImage = await uploadImage(strapi, seedArticle.image, seedArticle.alt);
    const article = await strapi.documents('api::article.article').create({
      data: {
        title: seedArticle.title,
        slug: slugify(seedArticle.title),
        excerpt: seedArticle.excerpt,
        publishDate: seedArticle.publishDate,
        pillar: pillars[seedArticle.pillarName].documentId,
        subcategory: subcategoryLookup[seedArticle.subcategoryName].documentId,
        coverImage: coverImage.id,
        featured: false,
      },
      status: 'published',
    });
    articles.push(article);
  }

  // ── Site settings (nav / footer) ────────────────────────────
  await strapi.documents('api::site-setting.site-setting').create({
    data: {
      siteName: 'NatureWays',
      tagline: 'Journeys That Realign',
      navLinks: [
        { label: 'Food', url: '/food' },
        { label: 'Space', url: '/space' },
        { label: 'Nature', url: '/nature' },
        { label: 'Workshop', url: '/workshop' },
        { label: 'About', url: '#about' },
        { label: 'Contact', url: '#contact' },
      ],
      footerBrandDesc:
        'A sanctuary for those who seek to live more closely with the rhythms of the natural world.',
      footerExploreLinks: [
        { label: 'Food', url: '/food' },
        { label: 'Space', url: '/space' },
        { label: 'Nature', url: '/nature' },
        { label: 'Workshop', url: '/workshop' },
      ],
      footerAboutLinks: [
        { label: 'Our Philosophy', url: '#' },
        { label: 'Founder', url: '#' },
        { label: 'What We Do', url: '#' },
        { label: 'Collaborations', url: '#' },
      ],
      footerConnectLinks: [
        { label: 'Contact', url: '#' },
        { label: 'Instagram', url: '#' },
        { label: 'Newsletter', url: '#' },
      ],
      footerCopyrightText: '© 2026 NatureWays · natureways.id',
      socialLinks: [
        { label: 'Instagram', url: '#' },
        { label: 'Newsletter', url: '#' },
      ],
    },
  });

  // ── Homepage singleton ───────────────────────────────────────
  const heroImage = await uploadImage(strapi, 'hero.jpg', 'Misty forest trail');
  const featureImage = await uploadImage(strapi, 'feature-forest-bathing.jpg', 'Forest path, soft morning light');
  const workshopImage = await uploadImage(strapi, 'workshop-cta.jpg', 'Forest immersion workshop');
  const journalImages = await Promise.all([
    uploadImage(strapi, 'journal-1.jpg', 'Nature moment 1'),
    uploadImage(strapi, 'journal-2.jpg', 'Nature moment 2'),
    uploadImage(strapi, 'journal-3.jpg', 'Nature moment 3'),
    uploadImage(strapi, 'journal-4.jpg', 'Nature moment 4'),
    uploadImage(strapi, 'journal-5.jpg', 'Nature moment 5'),
  ]);

  await strapi.documents('api::homepage.homepage').create({
    data: {
      heroEyebrow: 'Journeys That Realign',
      heroTitleLine1: 'Rooted in nature.',
      heroTitleLine2: 'Guided by',
      heroTitleEmphasis: 'rhythm.',
      heroImage: heroImage.id,
      heroBody:
        'NatureWays is a sanctuary for those seeking to slow down, reconnect, and rediscover the quiet intelligence of the natural world.',
      heroCtaLabel: 'Explore our world',
      heroCtaLink: '#pillars',
      tickerItems: [
        { label: 'Forest Bathing' },
        { label: 'Slow Travel' },
        { label: 'Nature-Based Recipes' },
        { label: 'Wilderness Psychology' },
        { label: 'Landscape Architecture' },
        { label: 'Forest Immersion' },
        { label: 'Seasonal Living' },
        { label: 'Environmental Psychology' },
      ],
      pillars: [
        { number: '01', title: 'Food', image: pillarImages.Food.id, link: '/food' },
        { number: '02', title: 'Space', image: pillarImages.Space.id, link: '/space' },
        { number: '03', title: 'Nature', image: pillarImages.Nature.id, link: '/nature' },
        { number: '04', title: 'Workshop', image: pillarImages.Workshop.id, link: '/workshop' },
      ],
      featureLabel: 'Featured · Nature',
      featureTitle: 'The quiet art of forest bathing',
      featureBody:
        'Shinrin-yoku — the Japanese practice of immersing oneself in the forest atmosphere — is not a walk. It is an arrival. A deliberate return to the sensory world that shaped us.',
      featureCtaLabel: 'Read the story',
      featureImage: featureImage.id,
      philosophyQuote:
        'Nature is not a backdrop to our lives. It is the original text from which all meaning is drawn.',
      philosophyAttribution: '— NatureWays Philosophy',
      workshopLabel: 'Experiences',
      workshopTitle: 'Join a NatureWays workshop',
      workshopBody:
        'From road trip immersions to private forest sessions — our workshops are designed to shift your relationship with the world around you. No agenda. Just presence.',
      workshopCtaLabel: 'View upcoming events',
      workshopImage: workshopImage.id,
      journalImages: [
        { image: journalImages[0].id, alt: 'Nature moment 1' },
        { image: journalImages[1].id, alt: 'Nature moment 2' },
        { image: journalImages[2].id, alt: 'Nature moment 3' },
        { image: journalImages[3].id, alt: 'Nature moment 4' },
        { image: journalImages[4].id, alt: 'Nature moment 5' },
      ],
      recentArticles: articles.map((article) => article.documentId),
    },
  });

  strapi.log.info('[bootstrap] Seeding complete.');
}

module.exports = { seed };
