import AuthLogo from './extensions/logo-full.png';
import MenuLogo from './extensions/logo-icon.png';
import Favicon from './extensions/logo-icon.png';

const config = {
  auth: {
    logo: AuthLogo,
  },
  menu: {
    logo: MenuLogo,
  },
  head: {
    favicon: Favicon,
  },
  locales: [],
  // Hide "Getting started" guided tour videos (Strapi-branded)
  tutorials: false,
  // Hide "A new version of Strapi is available!" banner
  notifications: { releases: false },
  translations: {
    en: {
      'Auth.form.welcome.title': 'Welcome to NatureWays',
      'Auth.form.welcome.subtitle': 'Log in to your admin account',
      'Auth.form.register.subtitle':
        'Credentials are only used to authenticate in the admin panel. All saved data will be stored in your database.',
      'Auth.form.button.login.strapi': 'Log in via SSO',
      'app.components.LeftMenu.navbrand.title': 'NatureWays',
      'app.components.LeftMenu.navbrand.workplace': 'CMS',
      'Settings.application.strapi-version': 'Platform version',
      'Settings.application.strapiVersion': 'Platform version',
      'Settings.permissions.users.listview.header.subtitle':
        'All the users who have access to the admin panel',
      'components.AutoReloadBlocker.description': 'Run the app with one of the following commands:',
      'HomePage.widget.deploy-now.description': 'Deploy your changes',
    },
  },
};

const bootstrap = () => {};

export default {
  config,
  bootstrap,
};
