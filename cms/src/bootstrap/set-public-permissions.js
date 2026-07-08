'use strict';

const PUBLIC_READ_PERMISSIONS = {
  homepage: ['find'],
  'site-setting': ['find'],
  article: ['find', 'findOne'],
  pillar: ['find', 'findOne'],
  subcategory: ['find', 'findOne'],
};

async function setPublicPermissions(strapi) {
  const publicRole = await strapi
    .query('plugin::users-permissions.role')
    .findOne({ where: { type: 'public' } });

  if (!publicRole) {
    strapi.log.warn('[bootstrap] Public role not found, skipping permission setup.');
    return;
  }

  const existingPermissions = await strapi
    .query('plugin::users-permissions.permission')
    .findMany({ where: { role: publicRole.id } });
  const existingActions = new Set(existingPermissions.map((permission) => permission.action));

  const permissionsToCreate = [];
  for (const [controller, actions] of Object.entries(PUBLIC_READ_PERMISSIONS)) {
    for (const action of actions) {
      const actionName = `api::${controller}.${controller}.${action}`;
      if (!existingActions.has(actionName)) {
        permissionsToCreate.push(
          strapi.query('plugin::users-permissions.permission').create({
            data: { action: actionName, role: publicRole.id },
          })
        );
      }
    }
  }

  if (permissionsToCreate.length > 0) {
    await Promise.all(permissionsToCreate);
    strapi.log.info(`[bootstrap] Granted ${permissionsToCreate.length} public API read permission(s).`);
  }
}

module.exports = { setPublicPermissions };
