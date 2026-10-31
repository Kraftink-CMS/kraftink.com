# Développer avec KraftInk

Ce parcours s’adresse aux auteurs d’extensions et aux personnes qui intègrent KraftInk dans une application. Pour installer ou configurer un site, suivez le [guide propriétaire](README.md).

## Créer votre premier paquet

Préparez un [environnement local](local-development.md), puis choisissez votre point de départ :

- [Créer un plugin](developpement-plugins.md) pour ajouter une fonctionnalité.
- [Créer un thème](developpement-themes.md) pour personnaliser le site ou le panneau.
- [Créer un module de jeu](developpement-jeux.md) pour prendre en charge un autre jeu.

Ces guides expliquent la structure du paquet et les premières étapes. Consultez le [cycle de vie des extensions](architecture-extensions.md) pour les règles d’installation, de compatibilité et de migration.

## Brancher une intégration

| Besoin | Référence |
| --- | --- |
| Ajouter des écrans, menus et formulaires | [Contributions à l’interface](ui-contributions.md) |
| Créer un tableau avec pagination, filtres et tri | [Tableaux interactifs](tables.md) |
| Utiliser les fonctions d’un autre plugin | [API des plugins](api-plugins.md) |
| Publier ou écouter un événement métier | [Événements des plugins](plugin-events.md) |
| Déclarer des widgets configurables | [Widgets des plugins](plugin-widgets.md) |
| Envoyer des notifications et respecter les préférences | [Notifications des plugins](plugin-notifications.md) |
| Déclarer les permissions d’une API | [Permissions API des plugins](plugin-api-scopes.md) |
| Connecter un bot ou un service sans compte membre | [Comptes techniques](service-accounts.md) |
| Afficher des actualités ou l’état des serveurs ailleurs | [API publique](api-publique.md) |
| Authentifier les joueurs depuis un launcher | [API d’authentification](auth-api.md) |
| Développer un connecteur serveur | [KraftLink](developpement-kraftlink.md) et [API serveur](developpement-serveurs.md) |
| Manipuler un solde ou ajouter un paiement | [Soldes](developpement-soldes.md) et [passerelles de paiement](passerelles-paiement.md) |

Les [imports](development-migrations.md) et la [confidentialité](privacy-extensions.md) ont leurs propres contrats : consultez-les si votre extension conserve des données de membres.

## Tester et distribuer

Testez votre paquet sur une installation séparée, puis suivez le [guide de publication](extensions-publication.md). Le [contrat du Market](market-contract.md) sert à fournir un catalogue compatible.

Pour contribuer au noyau, les [consignes de test](contribuer-tests.md) décrivent les suites et l’isolation des données.
