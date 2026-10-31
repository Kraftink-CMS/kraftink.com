# Connecter un bot ou un service

Un compte technique donne une identité propre à un bot, un outil de supervision ou un service externe. Il est administré depuis **Comptes techniques** dans le panneau. Il ne possède ni mot de passe de connexion au site, ni e-mail personnel, ni rang de membre.

Le gestionnaire n’a pas besoin d’ouvrir une session au nom du bot. Il choisit les droits autorisés puis crée les jetons utilisés par chaque installation du service.

## Créer un compte technique

Le gestionnaire doit avoir accès au panneau et la permission `service-accounts.manage`.

1. Ouvrez `/admin/service-accounts` puis **Ajouter un compte technique**.
2. Donnez un nom au service et décrivez son utilisation prévue.
3. Sélectionnez uniquement les permissions API nécessaires.
4. Confirmez votre identité avec votre mot de passe ou votre authentification externe récente, et votre 2FA lorsqu’elle est active.

Un gestionnaire ne peut pas déléguer plus de droits qu’il n’en possède. Les permissions disponibles viennent du même registre que les accès API personnels et les extensions conservent leurs contrôles métier.

Les informations de présentation et les permissions sont enregistrées séparément. Renommer le service ou préciser son utilisation ne demande pas une nouvelle confirmation de vos identifiants. Modifier ses droits en demande une.

## Créer un jeton pour une installation

Activez l’API dans `/admin/settings/api`, puis ouvrez le compte technique.

Créez un jeton nommé, choisissez ses permissions parmi celles autorisées au compte et indiquez sa durée. Utilisez un jeton distinct par installation pour pouvoir révoquer une machine sans bloquer les autres.

Le secret est affiché une seule fois. Placez-le dans la configuration privée de votre service. Le CMS conserve uniquement son empreinte. La réponse contenant le secret n’est pas mise en cache et le secret n’est pas conservé dans la session.

Chaque requête transmet :

```http
Authorization: Bearer <jeton>
```

Utilisez HTTPS. La durée d’un jeton est limitée par le réglage global de l’API. Les jetons expirés ou révoqués ne peuvent pas être réutilisés.

## Comprendre les droits

`GET /api/auth/token` permet à votre service de vérifier son jeton. La réponse décrit son identité, ses permissions effectives et son échéance. Cet endpoint fonctionne avec les comptes techniques sans exiger un scope de profil personnel.

L’accès effectif dépend des droits autorisés au compte technique, des permissions sélectionnées sur le jeton, de l’état de l’extension et des règles propres à la ressource.

Les scopes de profil, d’e-mail et d’identités de jeu destinés aux membres ne sont pas proposés aux comptes techniques. Une extension peut également réserver un scope aux membres lorsqu’il suppose une identité humaine.

Un compte technique ne prend pas l’identité du gestionnaire. Une API qui ne lit que les ressources appartenant à son titulaire reste limitée aux ressources de ce compte technique. Une API de gestion globale doit être explicitement fournie par son extension avec une permission adaptée. Un nom de scope ou un rang ne permet pas de contourner cette règle.

Les permissions et la propriété des ressources utilisent les services existants du CMS. Il n’y a pas de seconde copie des membres, des tickets ou des commandes pour les intégrations.

## Deux usages disponibles sans plugin

Le noyau fournit deux droits compatibles avec les comptes techniques :

| Utilisation | Droit du compte technique et du jeton | Permission nécessaire au gestionnaire | Requêtes |
| --- | --- | --- | --- |
| Bot d’annonces des actualités | `site:news:read` | `content.manage` | `GET /api/site/news` et `GET /api/site/news/{id}` |
| Suivi de l’état des serveurs | `site:servers:read` | `servers.manage` | `GET /api/site/servers` |

Pour un bot d’annonces, autorisez `site:news:read` sur le compte puis sur son jeton. Le bot peut consulter les actualités publiques déjà publiées et préparer son annonce. Il ne reçoit ni brouillon, ni contenu réservé, ni droit de publication dans le CMS. L’envoi vers Discord ou un autre service appartient au bot.

Pour un outil de suivi, autorisez `site:servers:read`. Il consulte le statut public des serveurs activés sans recevoir leurs secrets de connexion, leurs commandes ou leur configuration d’administration.

Ces requêtes protégées réutilisent la lecture des données publiques du CMS. Elles ne créent pas un second stockage et n’élargissent pas la visibilité des contenus. Les routes publiques existantes restent documentées dans [l’API publique](api-publique.md).

Un gestionnaire qui ne possède que `content.manage` ne peut pas déléguer `site:servers:read`. La permission de gérer les comptes techniques ne donne pas, à elle seule, tous les droits de toutes les intégrations. Les extensions peuvent proposer d’autres scopes adaptés à leurs fonctions.

## Surveiller et révoquer

La liste affiche les comptes techniques, leur état, le nombre de jetons actifs et leur dernière utilisation. Leur fiche affiche les échéances et les états de chaque jeton.

- **Révoquer** retire un jeton précis.
- **Révoquer tous les jetons** coupe toutes les installations de ce compte.
- **Remplacer le jeton** crée un nouveau secret et révoque l’ancien sans prolonger la durée ni ajouter de droits.
- **Désactiver le compte** bloque l’identité technique tout en conservant ses données et son historique.

La réactivation et le remplacement d’un secret demandent une confirmation de l’identité du gestionnaire. La révocation et la désactivation conservent les permissions du panneau, la protection CSRF et l’audit, sans imposer de ressaisir les identifiants pour couper un accès.

Une extension désactivée ne peut plus autoriser ses scopes. Les déclarations enregistrées dans le compte technique restent visibles pour comprendre sa configuration. Elles ne donnent aucun accès tant que leur fournisseur est indisponible.

Les créations, changements de droits, émissions de jetons, rotations, révocations et changements d’état sont journalisés. Ne transmettez jamais le secret d’un jeton dans une URL, un message public ou un journal.

## Après un import

Recréez explicitement les comptes techniques depuis l’administration de destination. L’import de comptes exige une source ne contenant que des membres. Les comptes techniques, leurs autorisations et leurs jetons ne sont jamais réactivés à partir d’une archive.

Pour déclarer une permission dans une extension, consultez [les permissions API des plugins](plugin-api-scopes.md). Les jetons personnels des membres restent documentés dans [l’API d’authentification](auth-api.md).
