# Connecter un bot ou un service

Un compte technique donne à une application ses propres accès API, sans utiliser le compte personnel d’un membre. Gérez-le dans **Comptes techniques** après avoir activé **Connexion des applications** dans les réglages.

## Créer l’accès

1. Ajoutez un compte technique avec un nom et son utilisation.
2. Autorisez uniquement les permissions API demandées par l’application. Vous ne pouvez déléguer que vos propres droits.
3. Ouvrez sa fiche et créez un jeton nommé, avec une durée et les permissions nécessaires.
4. Copiez le secret affiché une seule fois dans la configuration privée de l’application.

Utilisez un jeton par installation pour pouvoir couper l’accès d’une machine sans affecter les autres. Le compte et le jeton doivent tous deux autoriser la permission utilisée.

## Choisir les droits

Sans plugin supplémentaire, deux usages sont disponibles :

| Usage | Permission API | Droit nécessaire au gestionnaire |
| --- | --- | --- |
| Bot d’annonces des actualités | `site:news:read` | `content.manage` |
| Suivi de l’état des serveurs | `site:servers:read` | `servers.manage` |

Ces accès lisent uniquement les données publiques. Ils ne donnent ni droit de publication ni commande serveur. Les extensions peuvent proposer d’autres permissions.

Un compte technique possède ses propres ressources. Un accès aux tickets personnels ne donne pas accès à tous les tickets du site. Les droits de profil et d’identités de jeu réservés aux membres ne sont pas proposés à ces comptes.

## Couper ou remplacer l’accès

La fiche affiche les jetons, leurs échéances et leur dernière utilisation. Révoquez un jeton pour une installation, ou désactivez le compte pour les bloquer tous.

**Remplacer le jeton** invalide l’ancien secret en gardant la même échéance et les mêmes limites de droits. Après un import, recréez ces accès sur le nouveau site.

Pour intégrer ces jetons dans une application, consultez l’[API d’authentification](auth-api.md#jetons-de-service).
