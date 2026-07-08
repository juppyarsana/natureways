'use strict';

const express = require('express');
const { marked } = require('marked');
const { getArticleBySlug, getSiteSettings, mediaUrl } = require('../services/strapiClient');

const router = express.Router();

router.get('/articles/:slug', async (req, res) => {
  let article;
  let siteSettings;

  try {
    [article, siteSettings] = await Promise.all([getArticleBySlug(req.params.slug), getSiteSettings()]);
  } catch (err) {
    console.error('[article route] Failed to fetch content from Strapi:', err.message);
    res
      .status(500)
      .send('Unable to load site content — the CMS may be unreachable. Please try again shortly.');
    return;
  }

  if (!article) {
    res.status(404).send('Article not found.');
    return;
  }

  const bodyHtml = marked.parse(article.body || '');

  res.render('article', { article, bodyHtml, siteSettings, mediaUrl });
});

module.exports = router;
