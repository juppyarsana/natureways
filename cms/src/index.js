'use strict';

const { setPublicPermissions } = require('./bootstrap/set-public-permissions');
const { seed } = require('./bootstrap/seed');

module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/*{ strapi }*/) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }) {
    await setPublicPermissions(strapi);
    await seed(strapi);
  },
};
