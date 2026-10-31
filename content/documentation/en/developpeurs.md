# Developing an extension

KraftInk offers three package types: plugins add features, themes customise the site or panel, and game modules add support for a game.

## Preparing a local installation

Install a development copy of KraftInk with the [usual requirements](installation.md). PHP development uses Laravel and Blade. Run `kraft:*` commands from the directory containing `artisan`.

The installation archive is enough to get started. If you use CMS sources, prepare them with Composer and Node.js 22.12 or later:

```shell
composer install
npm ci
npm run build
```

Serve `public/` through your local web server and complete the installer. Use that address in `APP_URL` and site settings. After changing `.env`, run `php artisan config:clear`.

## Choosing a package

| Need | Guide |
| --- | --- |
| Add a feature and its screens | [Create a plugin](developpement-plugins.md) |
| Customise the public site or administration | [Create a theme](developpement-themes.md) |
| Add a game’s identities and connections | [Create a game module](developpement-jeux.md) |

The generator creates packages under `extensions/installed/{plugins,themes,games}/`. Install the package from the panel afterwards. Keep its own repository and integrate it without editing CMS files.

The [manifest and lifecycle](architecture-extensions.md) apply to all three types. They define dependencies, migrations and data kept during updates.

## References for specific needs

| Feature | Reference |
| --- | --- |
| Menus, blocks, forms, images and SEO | [Interface](ui-contributions.md) and [tables](tables.md) |
| Blocks configured by the owner | [Widgets](plugin-widgets.md) |
| Notifications and preferences | [Notifications](plugin-notifications.md) |
| Integration between plugins | [Plugin services](api-plugins.md) and [events](plugin-events.md) |
| Balances and payments | [Wallet](developpement-soldes.md) and [Shop gateways](passerelles-paiement.md) |
| Member data and importing another CMS | [Privacy](privacy-extensions.md) and [imports](development-migrations.md) |
| APIs for external applications | [Public data](api-publique.md), [authentication](auth-api.md) and [API permissions](plugin-api-scopes.md) |
| Game server communication | [Connection protocol](developpement-kraftlink.md) and [account and balance API](developpement-serveurs.md) |

When the package works, check installation and updates with test data before [distributing it](extensions-publication.md).
