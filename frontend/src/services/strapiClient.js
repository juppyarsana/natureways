'use strict';

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN || '';

async function strapiFetch(path) {
  const res = await fetch(`${STRAPI_URL}${path}`, {
    headers: STRAPI_API_TOKEN ? { Authorization: `Bearer ${STRAPI_API_TOKEN}` } : {},
  });

  if (!res.ok) {
    throw new Error(`Strapi request failed: ${path} (${res.status})`);
  }

  const json = await res.json();
  return json.data;
}

// Strapi's populate=* does not recurse into component/relation media,
// so every field that needs a nested image or relation is populated explicitly.
const HOMEPAGE_POPULATE =
  'populate[heroImage]=true' +
  '&populate[tickerItems]=true' +
  '&populate[pillars][populate][image]=true' +
  '&populate[featureImage]=true' +
  '&populate[workshopImage]=true' +
  '&populate[journalImages][populate][image]=true' +
  '&populate[recentArticles][populate][coverImage]=true' +
  '&populate[recentArticles][populate][pillar]=true';

const SITE_SETTINGS_POPULATE =
  'populate[logoMark]=true' +
  '&populate[navLinks]=true' +
  '&populate[footerExploreLinks]=true' +
  '&populate[footerAboutLinks]=true' +
  '&populate[footerConnectLinks]=true' +
  '&populate[socialLinks]=true';

function getHomepage() {
  return strapiFetch(`/api/homepage?${HOMEPAGE_POPULATE}`);
}

function getSiteSettings() {
  return strapiFetch(`/api/site-setting?${SITE_SETTINGS_POPULATE}`);
}

function mediaUrl(media) {
  if (!media || !media.url) return '';
  return media.url.startsWith('http') ? media.url : `${STRAPI_URL}${media.url}`;
}

module.exports = { getHomepage, getSiteSettings, mediaUrl };
