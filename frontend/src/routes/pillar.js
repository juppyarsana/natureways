'use strict';

const express = require('express');
const { getPillarBySlug, getArticlesByPillar, getSiteSettings, mediaUrl } = require('../services/strapiClient');

const router = express.Router();

router.get('/:pillarSlug', async (req, res, next) => {
  if (req.params.pillarSlug.includes('.')) {
    next();
    return;
  }

  let pillar;
  try {
    pillar = await getPillarBySlug(req.params.pillarSlug);
  } catch (err) {
    console.error('[pillar route] Failed to fetch content from Strapi:', err.message);
    res
      .status(500)
      .send('Unable to load site content — the CMS may be unreachable. Please try again shortly.');
    return;
  }

  if (!pillar) {
    next();
    return;
  }

  let articles;
  let siteSettings;
  try {
    [articles, siteSettings] = await Promise.all([
      getArticlesByPillar(req.params.pillarSlug),
      getSiteSettings(),
    ]);
  } catch (err) {
    console.error('[pillar route] Failed to fetch content from Strapi:', err.message);
    res
      .status(500)
      .send('Unable to load site content — the CMS may be unreachable. Please try again shortly.');
    return;
  }

  res.render('pillar', { pillar, articles, siteSettings, mediaUrl });
});

module.exports = router;
