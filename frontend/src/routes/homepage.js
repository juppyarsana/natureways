'use strict';

const express = require('express');
const { getHomepage, getSiteSettings, mediaUrl } = require('../services/strapiClient');

const router = express.Router();

router.get('/', async (req, res) => {
  let homepage;
  let siteSettings;

  try {
    [homepage, siteSettings] = await Promise.all([getHomepage(), getSiteSettings()]);
  } catch (err) {
    console.error('[homepage route] Failed to fetch content from Strapi:', err.message);
    res
      .status(500)
      .send('Unable to load site content — the CMS may be unreachable. Please try again shortly.');
    return;
  }

  if (!homepage || !siteSettings) {
    res.status(500).send('Site content is not fully set up yet in the CMS.');
    return;
  }

  res.render('index', { homepage, siteSettings, mediaUrl });
});

module.exports = router;
