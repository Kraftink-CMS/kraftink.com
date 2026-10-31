# Développer une extension

KraftInk propose trois types de paquets : les plugins pour ajouter des fonctionnalités, les thèmes pour personnaliser le site ou le panneau, et les modules pour prendre en charge un jeu.

## Préparer votre installation locale

Installez une copie de KraftInk dédiée au développement avec les [prérequis habituels](installation.md). Le développement PHP utilise Laravel et Blade. Les commandes `kraft:*` se lancent depuis le dossier contenant `artisan`.

L’archive d’installation suffit pour commencer. Si vous partez des sources du CMS, préparez-les avec Composer et Node.js 22.12 ou supérieur :

```shell
composer install
npm ci
npm run build
```

Faites servir `public/` par votre serveur local puis terminez l’assistant. Utilisez cette adresse dans `APP_URL` et dans les réglages du site. Après une modification de `.env`, lancez `php artisan config:clear`.

## Choisir votre paquet

| Besoin | Guide |
| --- | --- |
| Ajouter une fonctionnalité et ses écrans | [Créer un plugin](developpement-plugins.md) |
| Habiller le site public ou l’administration | [Créer un thème](developpement-themes.md) |
| Ajouter les identités et connexions d’un jeu | [Créer un module de jeu](developpement-jeux.md) |

Le générateur crée le paquet sous `extensions/installed/{plugins,themes,games}/`. Installez-le ensuite depuis le panneau. Conservez son propre dépôt et ne modifiez pas les fichiers du CMS pour l’intégrer.

Le [manifeste et le cycle de vie](architecture-extensions.md) sont communs aux trois types. Ils définissent les dépendances, les migrations et les données conservées lors des mises à jour.

## Références selon vos besoins

| Fonction | Référence |
| --- | --- |
| Menus, blocs, formulaires, images et référencement | [Interface](ui-contributions.md) et [tableaux](tables.md) |
| Blocs configurables par le propriétaire | [Widgets](plugin-widgets.md) |
| Notifications et préférences | [Notifications](plugin-notifications.md) |
| Intégration entre plugins | [Services des plugins](api-plugins.md) et [événements](plugin-events.md) |
| Solde et paiements | [Portefeuille](developpement-soldes.md) et [passerelles Shop](passerelles-paiement.md) |
| Données de membres et reprise d’un autre CMS | [Confidentialité](privacy-extensions.md) et [imports](development-migrations.md) |
| API pour une application externe | [Données publiques](api-publique.md), [authentification](auth-api.md) et [permissions API](plugin-api-scopes.md) |
| Échanges avec un serveur de jeu | [Protocole de liaison](developpement-kraftlink.md) et [API de comptes et soldes](developpement-serveurs.md) |

Quand le paquet fonctionne, vérifiez son installation et sa mise à jour avec des données d’essai avant de le [distribuer](extensions-publication.md).
