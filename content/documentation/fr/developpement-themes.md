# Créer un thème de site ou d’administration

Un thème personnalise une interface avec ses vues, styles et réglages. Les thèmes `site` et `admin` sont sélectionnés séparément et suivent le même format de paquet.

## Générer et organiser le thème

```shell
php artisan kraft:make theme "My theme" --id=my-theme
php artisan kraft:make theme "My panel" --id=my-panel --target=admin
```

Le paquet est créé sous `extensions/installed/themes/`. Installez-le puis sélectionnez-le pour sa cible dans le panneau.

| Dossier ou fichier | Contenu |
| --- | --- |
| `manifest.json` | Identité, cible, exigences et ressources |
| `resources/views/default/` | Vues publiques d’un thème `site` |
| `resources/views/admin/` | Vues du panneau d’un thème `admin` |
| `resources/scss/` | Sources des styles |
| `public/` | CSS, JavaScript, images et polices distribués |
| `lang/fr/messages.php`, `lang/en/messages.php` | Traductions avec les mêmes clés |
| `src/` | Classes PHP éventuelles, avec la même organisation qu’un plugin |

```json
{
    "id": "my-theme",
    "name": "My theme",
    "type": "theme",
    "target": "site",
    "version": "1.0.0",
    "requires": {"cms": ">=0.0.1", "php": "^8.4.1"},
    "assets": {"styles": ["theme.css"], "scripts": [], "fonts": []},
    "build": {"scss": ["resources/scss/theme.scss"]}
}
```

La cible ne change pas lors des mises à jour. Le générateur fournit le layout de la cible et les fichiers npm nécessaires à Sass. Conservez leurs fichiers de verrouillage. Les [dépendances et bibliothèques](extensions-publication.md#bibliotheques-et-ressources) restent propres au thème.

## Surcharger les vues

Une surcharge conserve le chemin de la vue d’origine :

| Vue d’origine | Fichier du thème |
| --- | --- |
| `default.home.index` | `resources/views/default/home/index.blade.php` |
| `default.layouts.layout` | `resources/views/default/layouts/layout.blade.php` |
| `admin.layouts.layout` | `resources/views/admin/layouts/layout.blade.php` |
| `wiki::default.documents.show` | `resources/views/plugins/wiki/default/documents/show.blade.php` |

Seules les vues présentes sont remplacées. Supprimez le layout généré pour créer un habillage CSS du rendu natif, ou adaptez-le pour une structure propre au thème. Déclarez les compatibilités facultatives avec les plugins dans `integrations`.

Gardez les formulaires et leurs protections, les slots `<x-extensions.slot>`, les zones `<x-widgets.zone>` et les piles `@stack('head')` et `@stack('scripts')`. Le layout public conserve `default.layouts.partials.metadata`, qui produit le titre et les balises SEO.

Les composants génériques s’appellent avec `<x-…>`, ceux du panneau avec `<x-admin::…>`. Les fragments réutilisés vont dans les `partials/` de leur ressource ou layout. Les traductions du thème actif utilisent `theme::messages.*`. La configuration utilise son identifiant, par exemple `my-theme::messages.settings.accent`.

### Erreurs, pagination et e-mails

| Rendu | Surcharge |
| --- | --- |
| Erreur HTTP | `resources/views/errors/404.blade.php`, puis `4xx.blade.php` en repli |
| Maintenance | `resources/views/errors/maintenance.blade.php` |
| Pagination | `resources/views/partials/pagination.blade.php` |
| E-mail de compte | `resources/views/emails/account/notification.blade.php` |
| E-mail de plugin | `resources/views/plugins/<plugin>/<chemin>.blade.php` |
| E-mail Laravel | `resources/views/vendor/notifications/email.blade.php` |
| Composants Markdown | `resources/views/vendor/mail/html/` et `text/` |

La pagination simple utilise la même vue sans total ni `$elements`. Les [tableaux interactifs](tables.md) conservent leurs attributs et le JavaScript commun. Les e-mails utilisent le thème du site et doivent garder leurs variables, liens d’action et versions texte.

## Contexte et ressources

Les vues publiques reçoivent `$publicSite`, `$appearance`, `$capabilities` et les liens filtrés `$headerLinks`, `$footerLinks`, `$extensionHeaderLinks` et `$extensionFooterLinks`. Utilisez `$capabilities->extension($id)` et `routeAvailable($routeName)` pour vérifier une destination.

Si vous créez un autre namespace de vues, fournissez le contexte avec `app(App\Kraft\Site\PublicViewContext::class)->data(request())` depuis un composeur de vues. Les propriétés natives de disponibilité sont définies dans `App\Kraft\Site\ViewCapabilities`.

Déclarez les CSS dans `assets.styles`, les scripts dans `assets.scripts` et les polices dans `assets.fonts`, avec des chemins relatifs à `public/`. Le CMS les charge automatiquement, avec le CSS du thème après celui du noyau. Depuis le dossier du thème, utilisez `npm ci` puis `npm run build` si un script est défini. Sinon, le build déclaré dans le manifeste est traité par l’outillage de publication.

Conservez les polices localement sous `public/fonts/`, leurs licences et des URL CSS relatives. Un habillage du natif peut cibler `.theme-native .site-header`.

```json
"capabilities": {
    "appearance": ["light", "dark", "auto"]
}
```

Annoncez seulement les palettes prises en charge. `auto` exige `light` et `dark`. Le layout reçoit `data-bs-theme="light"` ou `"dark"`. Un layout public personnalisé peut réutiliser les partiels `default.layouts.partials.appearance-head` et `appearance-menu`.

## Réglages du thème

Le CMS peut générer le formulaire à partir de `configuration.schema` :

```json
"configuration": {
    "schema": [{
        "id": "appearance",
        "label": "my-theme::messages.settings.appearance",
        "fields": {
            "accent": {
                "type": "color",
                "label": "my-theme::messages.settings.accent",
                "default": "#4267a8"
            },
            "hero_title": {
                "type": "text",
                "label": "my-theme::messages.settings.hero_title",
                "max": 120
            },
            "sections": {
                "type": "repeater",
                "label": "my-theme::messages.settings.sections",
                "max": 12,
                "fields": {
                    "title": {"type": "text", "label": "my-theme::messages.settings.title", "required": true},
                    "body": {"type": "richtext", "label": "my-theme::messages.settings.body"},
                    "enabled": {"type": "boolean", "label": "my-theme::messages.settings.enabled", "default": true}
                }
            }
        }
    }]
}
```

Les types sont `text`, `textarea`, `richtext`, `url`, `color`, `number`, `boolean`, `select`, `multiselect`, `media`, `menu` et `repeater`. Utilisez `help`, `default`, `required`, `min` et `max` selon le type. `options` associe les valeurs aux clés de traduction et `mime` limite les médias. Un `repeater` contient des champs simples, sans imbrication.

Les valeurs sont disponibles dans `$themeSettings`. Échappez les textes avec `{{ }}`. Le HTML d’un champ `richtext` est nettoyé et peut être affiché avec `{!! !!}`. Résolvez les identifiants médias avec les services du CMS.

Pour une configuration spécifique, déclarez une route :

```json
"configuration": {
    "route": "themes.my-theme.admin.configuration.index",
    "routes": "routes/admin.php",
    "permission": "settings.manage"
}
```

Le fichier reste sous `routes/`. Les routes suivent `themes.<id>.admin.*` sous `/admin/themes/<id>/`. Le CMS ajoute les contrôles d’accès au panneau. Votre code garde validation et sauvegarde. Une route peut compléter le schéma via **Configuration avancée**.

Les réglages restent accessibles pour un thème installé inactif. La prévisualisation permet d’essayer les valeurs sans les enregistrer, pour le compte courant et sur le thème actif.

## Modèles de pages et menus

Déclarez des variantes pour une vue :

```json
"templates": {
    "pages": {
        "label": "my-theme::messages.templates.pages",
        "view": "default.content.show",
        "routes": ["site.pages.show"],
        "choices": {
            "wide": {"label": "my-theme::messages.templates.wide", "view": "templates.content.wide"},
            "sidebar": {"label": "my-theme::messages.templates.sidebar", "view": "templates.content.sidebar"}
        }
    }
}
```

Les fichiers Blade sont locaux au thème. `default` peut indiquer le choix initial. Le formulaire propose les sélections par vue. Pour `default.content.show`, un administrateur ayant `content.manage` peut aussi choisir un modèle par page ou actualité.

Un thème public peut ajouter des emplacements de menus :

```json
"navigation_locations": {
    "mobile": "my-theme::messages.menus.mobile",
    "footer_resources": "my-theme::messages.menus.resources"
}
```

Leurs arbres filtrés sont accessibles dans `$themeMenus['mobile']`, au même format que `$headerLinks`. Les liens sont conservés lors d’un changement de thème. Pour des blocs déplaçables par le propriétaire, utilisez les [widgets](plugin-widgets.md).
