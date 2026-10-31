# Develop with KraftInk

This path is for extension authors and people integrating KraftInk into an application. To install or configure a website, follow the [site owner guide](README.md).

## Create your first package

Prepare a [local environment](local-development.md), then choose a starting point:

- [Create a plugin](developpement-plugins.md) to add a feature.
- [Create a theme](developpement-themes.md) to customise the site or administration panel.
- [Create a game module](developpement-jeux.md) to support another game.

These guides explain the package structure and first steps. Read the [extension lifecycle](architecture-extensions.md) for installation, compatibility and migration rules.

## Connect an integration

| Need | Reference |
| --- | --- |
| Add screens, menus and forms | [UI contributions](ui-contributions.md) |
| Use another plugin’s features | [Plugin APIs](api-plugins.md) |
| Display news or server status in another app | [Public API](api-publique.md) |
| Authenticate players from a launcher | [Authentication API](auth-api.md) |
| Develop a server connector | [KraftLink](developpement-kraftlink.md) and [server API](developpement-serveurs.md) |
| Work with balances or add a payment provider | [Balances](developpement-soldes.md) and [payment gateways](passerelles-paiement.md) |

[Imports](development-migrations.md) and [privacy](privacy-extensions.md) have their own contracts: consult them if your extension stores member data.

## Test and distribute

Test your package on a separate installation, then follow the [publishing guide](extensions-publication.md). The [Market contract](market-contract.md) describes compatible catalogues.

For core contributions, the [testing guide](contribuer-tests.md) covers the suites and data isolation.
