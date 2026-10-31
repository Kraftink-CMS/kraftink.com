# Fournir un catalogue Market

Cette référence concerne les éditeurs d’un catalogue. Pour distribuer une extension avec les workflows existants, commencez par [Publier un paquet](extensions-publication.md).

## Source et identité

Le CMS lit les URL HTTPS déclarées dans `config/market.php`, sans découvrir de dépôts ou de sources supplémentaires. Les URL de flux refusent identifiants, paramètres, fragments et ports personnalisés. Le flux répond en JSON avec HTTP 200, sans redirection.

Une source peut être un fichier JSON public ou une API qui applique les droits du compte. Remplacer son URL par un endpoint respectant ce contrat ne demande aucune mise à jour du CMS. L’endpoint fournit le catalogue complet, dans les limites ci-dessous, et non une page HTML du Market.

Chaque source possède un nom, une URL et une capacité d’authentification déclarée dans `config/market.php` :

```php
'sources' => [
    [
        'name' => 'KraftInk',
        'url' => 'https://raw.githubusercontent.com/kraftink-cms/Market/master/catalogue.json',
        'supports_site_key' => false,
    ],
    [
        'name' => 'Community Market',
        'url' => 'https://market.example/api/catalogue',
        'supports_site_key' => true,
    ],
],
```

Chaque entrée de `sources` est un objet avec `name`, `url` et `supports_site_key`. Avec `supports_site_key: false`, le panneau ne propose aucun champ de clé et le CMS n’envoie jamais d’en-tête d’authentification à cette source. La valeur `true` active la configuration d’une clé facultative pour cette source.

Une offre est identifiée par le couple `(source, resource.id)`. `id` vaut `auteur/slug`. `slug` correspond à l’identifiant du manifeste et au dossier installé. Deux offres de sources différentes restent distinctes, mais deux paquets ne peuvent pas occuper le même dossier local.

## Clé de site et requêtes

Dans **Administration → Market**, chaque catalogue configuré possède sa propre carte. Le propriétaire configure une clé dans la carte du catalogue concerné si celui-ci l’accepte. Le CMS conserve la clé chiffrée, sans la réafficher. Une clé enregistrée apparaît uniquement par son état. **Remplacer** ouvre le champ d’une nouvelle clé. **Retirer** demande une confirmation avant de supprimer l’accès enregistré pour cette source. La configuration des URL reste dans `config/market.php`.

Le CMS envoie les en-têtes suivants au catalogue et aux téléchargements de sa source :

```http
KraftInk-Market-Protocol: 1
KraftInk-Version: 0.0.1
KraftInk-Site-Url: https://community.example
Accept-Language: fr
Authorization: Bearer <site-key>
```

`Authorization` est absent sans clé ou si la source ne prend pas en charge les clés. Il est transmis uniquement à la même origine HTTPS que la source configurée. La clé n’est jamais envoyée à GitHub ni à un autre domaine de distribution lors d’une redirection. Les liens du catalogue ne contiennent pas la clé.

La clé est associée à l’URL exacte de la source. Changer d’endpoint exige de configurer sa clé sur la nouvelle source. Le service résout le compte, les achats et les restrictions depuis ce jeton. Le CMS ne réalise aucun achat de licence.

Une clé contient de 16 à 512 caractères parmi les lettres ASCII, chiffres et caractères `._~-`. Le service la traite comme un jeton opaque, sans en déduire le compte depuis un identifiant déclaré par le CMS.

`KraftInk-Site-Url` décrit l’adresse configurée du site, sans prouver la possession du domaine. Pour limiter les accès par IP, le service utilise l’adresse réellement observée après ses propres règles de proxy de confiance. Il ne doit pas accepter une adresse IP déclarée par le CMS comme preuve d’autorisation.

## Réponse minimale

Remplacez les URL et l’empreinte d’exemple par celles d’une vraie archive :

```json
{
    "schema_version": 1,
    "resources": [{
        "id": "community/example",
        "slug": "example",
        "type": "plugin",
        "name": {"fr": "Exemple", "en": "Example"},
        "description": {"fr": "Une extension pour le site.", "en": "A website extension."},
        "author": {"id": "community", "name": "Community"},
        "repository": "https://github.com/community/Plugin-Example",
        "commercial": {"kind": "free"},
        "manual_only": false,
        "versions": [{
            "version": "1.0.0",
            "requirements": {"cms": ">=0.0.1", "php": "^8.4.1"},
            "download": {
                "url": "https://github.com/community/Plugin-Example/releases/download/v1.0.0/example-1.0.0.zip",
                "sha256": "0000000000000000000000000000000000000000000000000000000000000000"
            }
        }]
    }]
}
```

## Champs et limites

| Champ | Contrat |
| --- | --- |
| `type` | `plugin`, `theme` ou `game` |
| Auteur et slug | 2 à 50 lettres minuscules, chiffres ou tirets, commençant par une lettre |
| `name` / `description` | Chaînes brutes ou dictionnaires par langue, avec au moins une traduction et une limite de 120 / 1 000 caractères par valeur |
| `image` | Facultatif, URL HTTPS publique brute ou dictionnaire d’URL par langue, avec au plus 2 048 caractères par URL |
| `author.id` | Partie auteur de `id` |
| `versions` | De 1 à 100 versions Semver distinctes |
| `requirements` | Objet plat identique à `requires` dans le manifeste, avec les clés obligatoires `cms` et `php`, puis des références `plugin:id`, `theme:id` ou `game:id`, chacune associée à une contrainte Composer |
| `download` | URL explicite et SHA-256 du ZIP pour une offre installable automatiquement |
| `access` sur une ressource | Facultatif, objet avec `allowed` booléen et `code` facultatif pour expliquer un refus |

`name` et `description` acceptent aussi une chaîne brute sans langue attribuée. Un dictionnaire contient uniquement les traductions réellement fournies, indépendamment pour chaque champ, avec au plus 100 langues et 35 caractères par code de langue. Par exemple, `"name": "Example"`, `"description": {"fr": "Un exemple."}` et `"image": "https://example.com/image.jpg"` sont valides. Les URL d’image utilisent HTTPS, sans identifiants, port personnalisé, paramètres ni fragment.

Le site et le CMS affichent chaque texte dans la langue demandée, puis sa langue de base, puis en anglais, puis dans la première langue disponible. Une chaîne brute s’affiche telle quelle. Le site utilise aussi ce repli pour les images et affiche directement toutes les offres des sources configurées.

Le flux accepte de 0 à 1 000 ressources et 2 Mio. Les doublons d’identité dans une source et les schémas inconnus sont refusés. `repository` est facultatif, informatif et ne permet pas de déduire une archive.

Les dépendances d’extension portent un préfixe correspondant au type du manifeste. Par exemple, `"requirements": {"cms": ">=0.0.1", "php": "^8.4.1", "plugin:shop": ">=0.0.1"}` exige une version compatible du plugin Shop. Les bibliothèques PHP se déclarent dans le `composer.json` de l’extension et sont préparées dans son ZIP, les bibliothèques frontend dans son `package.json`. Elles ne deviennent pas des exigences sur le Composer du CMS. Le catalogue conserve ses identités `auteur/slug` pour distinguer les offres et leurs sources.

Pour une offre payante, `commercial.kind` vaut `paid`, avec un lien HTTPS `commercial.url` vers l’acquisition. `commercial.price` peut contenir `amount` décimal sous forme de chaîne et `currency` ISO de trois lettres. `manual_only` vaut alors `true` par défaut et `download` peut être absent. Le CMS ne réalise aucun achat de licence.

## Accès public, privé et refus

Un catalogue public peut omettre le champ `access`. Une API peut ajouter un objet `access` à la racine :

```json
{
    "schema_version": 1,
    "access": {
        "scope": "public",
        "code": "ip_not_allowed"
    },
    "resources": []
}
```

`scope` vaut `public` ou `private`. `code` est facultatif. Le catalogue retourné fait autorité : une réponse publique ne contient ni offre réservée ni URL de téléchargement privée.

Un code suit `^[a-z][a-z0-9_]{0,79}$`.

HTTP 200 avec `scope: public` permet de conserver un accès au catalogue public tout en expliquant pourquoi l’accès privé est refusé. Pour refuser entièrement la requête, le service retourne un statut d’erreur et ce corps JSON :

```json
{
    "error": {
        "code": "ip_not_allowed"
    }
}
```

| Statut | Usage |
| --- | --- |
| `401` | Clé absente, invalide ou révoquée alors que l’authentification est exigée |
| `403` | Clé reconnue mais IP, domaine ou droit insuffisant |
| `404` | Ressource ou version indisponible |
| `429` | Limite de requêtes atteinte |
| `5xx` | Service temporairement indisponible |

Cet exemple utilise HTTP `403`. Les mêmes codes fonctionnent dans `error.code`, `access.code` à la racine et `access.code` d’une ressource.

### Codes et traduction des motifs

Le service envoie uniquement un code. Le CMS choisit son propre texte traduit dans la langue de l’administration. Il ignore tous les champs `message` distants, dans les erreurs HTTP comme dans l’accès au catalogue ou à une ressource, quel que soit leur type ou leur langue.

| Code | Cause |
| --- | --- |
| `site_key_required` | Clé de site nécessaire |
| `site_key_invalid` | Clé non reconnue |
| `site_key_expired` | Clé expirée |
| `site_key_revoked` | Clé révoquée |
| `site_access_invalid` | Clé de site ou IP configurée à vérifier, sans distinction publique |
| `ip_not_allowed` | Adresse IP non autorisée |
| `domain_not_allowed` | Domaine non autorisé |
| `purchase_required` | Achat requis |
| `resource_not_found` | Ressource indisponible |
| `version_not_found` | Version indisponible |
| `rate_limited` | Limite de requêtes atteinte |
| `service_unavailable` | Service temporairement indisponible |
| `resource_denied` | Téléchargement de la ressource refusé |

Un code inconnu produit un motif générique traduit par le CMS. Sans code, le CMS utilise `http_<statut>` et choisit son texte local à partir du statut HTTP. Une erreur HTML ou un corps invalide suit la même règle, sans afficher la réponse brute du serveur.

Cette règle concerne uniquement les motifs d’accès et les erreurs. Les langues des noms, descriptions et images restent propres à chaque ressource. Elles proviennent de son manifeste ou de ses traductions de paquet et ne sont pas remplacées par les traductions de l’interface du CMS.

## Ressources payantes et droits de téléchargement

Le service peut conserver une fiche visible tout en refusant son installation avec `access.allowed: false` et un motif :

```json
{
    "access": {
        "allowed": false,
        "code": "purchase_required"
    }
}
```

La fiche garde son lien d’acquisition. Le bouton d’installation est bloqué et le motif est affiché. Aucune URL privée ne doit être fournie dans une fiche refusée.

Pour autoriser une ressource achetée, retournez `commercial.kind: paid`, `manual_only: false`, `access.allowed: true` et, pour chaque version disponible, `download.url` et `download.sha256`. Le téléchargement privé utilise une URL HTTPS de la même origine que la source. Son endpoint vérifie à nouveau la clé, les droits et les restrictions avant d’envoyer le ZIP. Un refus utilise le même format JSON d’erreur que le catalogue.

La ressource peut être hébergée entièrement par le distributeur, sans dépôt Git. `repository` reste facultatif. Les installations et mises à jour utilisent l’URL de chaque version renvoyée par le catalogue, avec les mêmes contrôles de clé et de SHA-256. Publier une version supérieure compatible suffit à la proposer dans le CMS.

Par exemple, le catalogue peut fournir ces champs pour une version :

```json
{
    "version": "1.1.0",
    "requirements": {"cms": ">=0.0.1", "php": "^8.4.1"},
    "download": {
        "url": "https://market.example/api/resources/example/versions/1.1.0/download",
        "sha256": "0000000000000000000000000000000000000000000000000000000000000000"
    }
}
```

L’endpoint renvoie le ZIP depuis son propre stockage. Il peut aussi servir de relais vers son stockage privé. Une URL initiale vers un CDN arbitraire, avec jeton dans les paramètres, ne respecte pas ce contrat.

`manual_only: true` reste disponible pour une distribution externe avec installation manuelle. La clé contrôle l’accès aux fichiers et aux mises à jour. Ce contrat ne garantit pas qu’une copie déjà téléchargée ne puisse pas être redistribuée.

## Validation d’une installation

Le CMS vérifie les exigences avant téléchargement, puis le SHA-256, la structure et le véritable manifeste du ZIP. Identifiant, type, version et exigences doivent correspondre au catalogue. Après contrôle de démarrage, une première installation active automatiquement un plugin. Les thèmes et les jeux installés attendent un choix explicite pour être utilisés.

L’URL d’archive doit appartenir à GitHub ou au domaine de la source choisie, avec les seules redirections de distribution autorisées. Les liens contenant des identifiants ou paramètres ne sont pas acceptés comme URL initiale.

Le choix conserve sa source pendant toute l’opération. Une panne ne doit pas provoquer de repli vers un autre catalogue portant le même identifiant.

## Cache et disponibilité

Le cache du CMS est frais pendant 60 secondes et utilise `ETag`/`Last-Modified` si disponibles. Il sépare les sources, les clés, la langue, la version du CMS et l’URL du site. Ajouter, remplacer ou retirer une clé invalide le contexte de cache et les notifications du Market.

Une ancienne réponse valide peut rester visible pendant 24 heures après sa vérification en cas de panne réseau ou d’erreur `5xx`. Un refus HTTP `4xx`, une réponse de catalogue invalide ou un protocole inconnu retirent l’ancienne réponse de la source, sans conserver ses offres privées à l’écran. Un refus est conservé pendant 60 secondes pour éviter de répéter immédiatement la requête. L’installation exige une réponse fraîche ou revalidée. Les offres des autres sources restent disponibles.

Les réponses personnalisées doivent rester privées dans les caches intermédiaires. Si le service utilise `ETag` ou `Last-Modified`, ses validateurs tiennent compte des droits, des restrictions et de la langue. Il ne retourne `304` qu’après avoir vérifié que la même réponse est toujours autorisée pour cette requête.

Le registre GitHub fourni utilise l’automatisation centrale pour construire le catalogue depuis `kraftink-extension.json`. Le fichier `resources.json` reste sur `dev`. Le workflow **Market validation** contrôle les changements et les PR vers cette branche. Sa liste `repositories` contient des objets `{"repository": "auteur/Plugin-Example", "auto_update": true}`. La liste `resources` reste disponible pour les offres manuelles.

Le booléen `auto_update` permet de suspendre les mises à jour automatiques en conservant une fiche déjà publiée. Les portées manuelles de Refresh Market sont `automatic` pour les dépôts actifs, `repository` pour un dépôt inscrit précis et `all` pour tous les dépôts inscrits. Les deux dernières incluent les offres en pause sans modifier `auto_update`. La branche `master` contient uniquement `README.md` et `catalogue.json`. Voir [Distribution](extensions-publication.md).
