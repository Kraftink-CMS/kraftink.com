# Créer un thème

Un thème personnalise le site ou le panneau sans modifier les vues du noyau. Pour simplement installer une présentation, consultez [Installer une extension](extensions-catalogue.md).

## Générer le paquet

Depuis la racine du CMS :

```shell
php artisan kraft:make theme "Mon thème" --id=mon-theme
php artisan kraft:make theme "Mon panel" --id=mon-panel --target=admin
```

La première commande crée un thème `site`, la seconde un thème `admin`, sous `extensions/installed/themes/`. Installez ensuite le paquet et choisissez-le pour sa cible dans le panneau. Le rendu natif sert de repli pour les vues absentes.

Le générateur fournit `resources/views/default/layouts/layout.blade.php` pour un thème `site`, et `resources/views/admin/layouts/layout.blade.php` pour un thème `admin`. Ce layout est facultatif. Supprimez-le pour créer un simple habillage CSS de la structure native ou conservez-le si votre présentation exige sa propre structure. Le rendu natif sert de repli pour chaque page ou layout absent.

Le générateur fournit aussi `package.json` et `package-lock.json` avec les dépendances Sass verrouillées nécessaires au build SCSS déclaré dans le manifeste. Versionnez ces deux fichiers avec le thème. La publication compile ses ressources dans un dossier temporaire.

```text
manifest.json
package.json
package-lock.json
resources/scss/theme.scss
public/theme.css
public/fonts/
resources/views/
lang/fr/messages.php
lang/en/messages.php
```

Le manifeste déclare `type: "theme"`, `target: "site"` ou `"admin"`, sa version, ses exigences et ses ressources. Une mise à jour ne peut pas changer la cible du thème.

Les vues sont regroupées sous `resources/views` par surface et ressource. Le dossier `views` reste reconnu pour les paquets existants. Les classes PHP éventuelles suivent les mêmes dossiers que les plugins, avec `src/Providers`, `src/Http/Controllers` et `src/Services` selon les besoins du thème.

Les bibliothèques PHP éventuelles appartiennent au `composer.json` du thème. Ses bibliothèques frontend et outils de compilation appartiennent à son `package.json`, avec leurs fichiers de verrouillage versionnés. La publication prépare ses bibliothèques privées et compile ses assets. Le serveur reçoit une archive autonome. Voir [Bibliothèques et compilation](architecture-extensions.md#bibliotheques-et-compilation).

```json
{
    "id": "mon-theme",
    "name": "Mon thème",
    "type": "theme",
    "target": "site",
    "version": "1.0.0",
    "requires": {"cms": ">=0.0.1", "php": "^8.4.1"},
    "assets": {"styles": ["theme.css"], "scripts": [], "fonts": []},
    "build": {"scss": ["resources/scss/theme.scss"]}
}
```

## Remplacer des vues

Une surcharge conserve le chemin de la vue d’origine. Le guide [Organisation des vues et composants](architecture-extensions.md#organisation-des-vues-et-composants) précise où se trouvent les pages, layouts, partiels et composants :

| Vue d’origine | Fichier du thème |
| --- | --- |
| `default.home.index` | `resources/views/default/home/index.blade.php` |
| `default.layouts.layout` | `resources/views/default/layouts/layout.blade.php` |
| `admin.layouts.layout` | `resources/views/admin/layouts/layout.blade.php` |
| `wiki::default.documents.show` | `resources/views/plugins/wiki/default/documents/show.blade.php` |

Un thème `site` remplace les vues publiques, tandis qu’un thème `admin` remplace celles du panneau. Déclarez les compatibilités facultatives avec les plugins dans `integrations`, par exemple `"plugin:wiki": ">=0.0.1"`. Conservez les protections des formulaires, les piles `head` et `scripts`, les ressources communes, les slots et les contrôles d’accès du layout remplacé.

Les fragments propres à une seule page sont intégrés dans cette page. Les partiels de layout, par exemple l’en-tête, le pied de page ou la navigation, restent réutilisables et surchargeables séparément lorsqu’ils servent la personnalisation du thème. Conservez les points d’insertion `<x-extensions.slot>` et `<x-widgets.zone>` attendus par les pages et leurs contributions.

Le layout public `default.layouts.layout` reçoit `$pageMetadata` préparé par le noyau à partir du contexte de la page, dont `$seoVariables`. Ses surcharges conservent l’inclusion `default.layouts.partials.metadata`, qui contient l’unique `<title>` et les balises SEO. L’annotation locale `<!--suppress HtmlRequiredTitleElement -->` avant `<head>` évite l’alerte des IDE qui ne résolvent pas cette inclusion Blade.

Les traductions du thème actif utilisent des sections dans un seul `messages.php`, par exemple `__('theme::messages.home.welcome.title')` ou `__('theme::messages.navigation.home')`. Pour une page de configuration, utilisez son identifiant, par exemple `__('mon-theme::messages.admin.fields.accent')`. Conservez les mêmes clés et paramètres dans chaque langue.

### Erreurs, pagination et emails

Ces surcharges sont facultatives et conservent un repli sur le rendu natif :

| Rendu | Fichier du thème |
| --- | --- |
| Erreur HTTP précise | `resources/views/errors/404.blade.php`, `403.blade.php`, `419.blade.php`, `500.blade.php`… |
| Famille d’erreurs | `resources/views/errors/4xx.blade.php`, `5xx.blade.php` |
| Maintenance | `resources/views/errors/maintenance.blade.php` |
| Pagination complète et simple | `resources/views/partials/pagination.blade.php` |
| Email de compte | `resources/views/emails/account/notification.blade.php` |
| Email d’un plugin | `resources/views/plugins/<plugin>/<chemin-de-la-vue>.blade.php` |
| Notification Laravel | `resources/views/vendor/notifications/email.blade.php` |
| Composants email Markdown | `resources/views/vendor/mail/html/` et `resources/views/vendor/mail/text/` |

La pagination complète et la pagination simple utilisent la même vue. Une surcharge doit accepter l’absence de `$elements` et de total pour la pagination simple.

Les [tableaux interactifs](tables.md) utilisent le JavaScript commun du CMS. Personnalisez `.table`, `.page-link` et `.kraft-table-controls` dans une région `[data-table]` pour adapter leur apparence. Une surcharge conserve les attributs de région, de tri et de filtres ainsi que le composant `<x-tables.controls>`. Aucun contrôleur JavaScript du thème n’est nécessaire pour la recherche ou les changements de page.

Les erreurs choisissent d’abord le code précis, puis sa famille. Le statut et les en-têtes HTTP sont conservés. Les erreurs JSON utilisent `success: false` et `data.message`, avec `data.errors` pour la validation. Les erreurs JSON de statut 500 ou supérieur gardent un message générique, même en mode debug. Un thème public s’applique aussi à une URL inconnue. Le thème du panneau reste distinct, y compris sur ses erreurs.

Les emails utilisent toujours le thème du site, même lors d’un envoi depuis le panneau, une commande ou un worker. Une prévisualisation de réglages ne change pas les emails envoyés. Conservez les variables, liens d’action et versions texte attendus par la vue remplacée. Les fichiers et traductions sont isolés pendant le rendu ; un thème absent ou indisponible laisse fonctionner le rendu natif.

## Contexte des vues

Les vues publiques reçoivent `$publicSite` avec l’identité du site, `$appearance` avec son apparence et `$capabilities` avec les fonctionnalités utilisables par le visiteur. Les liens `$headerLinks`, `$footerLinks`, `$extensionHeaderLinks` et `$extensionFooterLinks` ont déjà leurs règles de disponibilité.

```blade
@if ($capabilities->canManageConnections)
    <a href="{{ route('account.connections.index') }}">{{ __('site.account.connections.title') }}</a>
@endif

@if ($capabilities->extension('wiki'))
    <a href="{{ route('plugins.wiki.public.documents.index') }}">{{ __('wiki::messages.common.wiki') }}</a>
@endif
```

Utilisez `$capabilities->routeAvailable($routeName)` pour une destination personnalisée. Les propriétés natives sont définies dans `App\Kraft\Site\ViewCapabilities`. Ne recalculez pas les règles à partir des réglages ou de la seule existence d’une route. Les contrôles serveur restent obligatoires.

Si votre thème crée un autre namespace de vues, ajoutez le contexte commun :

```php
view()->composer('mon-theme::*', function ($view) {
    $view->with(app(\App\Kraft\Site\PublicViewContext::class)->data(request()));
});
```

L’adresse publique de connexion au serveur est disponible par `app(App\Kraft\CommunityConnection::class)->address()`, qui renvoie une adresse validée ou `null`.

## Configuration du thème

Un formulaire de configuration appartient au thème. Le manifeste indique sa route et sa permission :

```json
"configuration": {
    "route": "themes.mon-theme.admin.configuration.index",
    "routes": "routes/admin.php",
    "permission": "settings.manage"
}
```

`configuration.routes` charge des routes de configuration même lorsque le thème est inactif, tant qu’il est installé et vérifié. Ce fichier reste sous `routes/`. Le noyau ajoute les contrôles d’accès au panneau. Votre thème conserve validation et sauvegarde. Les routes suivent `themes.<id>.admin.*` sous `/admin/themes/<id>/`.

## Styles, polices et apparence

Déclarez les entrées SCSS dans `build.scss`, les sorties dans `assets.styles` et les scripts dans `assets.scripts`. Le noyau charge automatiquement les assets déclarés du thème actif dans les piles `head` et `scripts`, avec le CSS après celui du noyau. Conservez `@stack('head')` et `@stack('scripts')` dans chaque layout personnalisé pour recevoir ces ressources et les contributions des extensions.

Un habillage CSS qui réutilise le layout natif cible ses classes, par exemple `.theme-native .site-header`. Un layout propre au thème choisit ses propres classes. Depuis une installation de développement, avec Node 22.12 ou supérieur :

```shell
npm ci
npm run build
```

Le paquet doit contenir ses ressources compilées. Livrez les WOFF2 sous `public/fonts/`, déclarez-les dans `assets.fonts`, utilisez des URL CSS relatives et conservez leurs licences. `font-display: swap` permet l’affichage pendant le chargement. Les polices restent locales.

Annoncez uniquement les palettes réellement prises en charge :

```json
"capabilities": {
    "appearance": ["light", "dark", "auto"]
}
```

`auto` nécessite `light` et `dark`. Le layout reçoit `data-bs-theme="light"` ou `"dark"`. Un layout autonome réutilise `default.layouts.partials.appearance-head` et `default.layouts.partials.appearance-menu`, avec le résultat de `Appearance::resolve($request, $themeManifest)`.

Vérifiez ordinateur et mobile, contenus longs, formulaires, états vides, permissions et chaque palette annoncée. Pour les blocs et formulaires communs, voir [Intégrer une interface](ui-contributions.md).

## Configuration déclarative

Pour les réglages de présentation, le noyau peut produire le formulaire, valider les valeurs et les enregistrer. Déclarez des sections dans `configuration.schema` :

```json
"configuration": {
    "schema": [{
        "id": "appearance",
        "label": "mon-theme::messages.settings.appearance",
        "fields": {
            "accent": {
                "type": "color",
                "label": "mon-theme::messages.settings.accent",
                "default": "#4267a8"
            },
            "hero_title": {
                "type": "text",
                "label": "mon-theme::messages.settings.hero_title",
                "max": 120
            },
            "sections": {
                "type": "repeater",
                "label": "mon-theme::messages.settings.sections",
                "max": 12,
                "fields": {
                    "title": {"type": "text", "label": "mon-theme::messages.settings.title", "required": true},
                    "body": {"type": "richtext", "label": "mon-theme::messages.settings.body"},
                    "enabled": {"type": "boolean", "label": "mon-theme::messages.settings.enabled", "default": true}
                }
            }
        }
    }]
}
```

Les types disponibles sont `text`, `textarea`, `richtext`, `url`, `color`, `number`, `boolean`, `select`, `multiselect`, `media`, `menu` et `repeater`. Les champs acceptent `help`, `default`, `required` et les bornes `min`/`max` adaptées à leur type. Les choix utilisent `options`, une correspondance identifiant → clé de traduction. Un média peut limiter ses types avec `mime`, par exemple `["image/png", "image/webp"]`. Les listes répétables contiennent des champs simples et peuvent être ajoutées, retirées et réordonnées ; elles ne s’imbriquent pas.

Les valeurs sont disponibles dans les vues sous `$themeSettings`, par exemple `{{ $themeSettings['hero_title'] }}`. Le HTML riche est nettoyé avant stockage ; affichez-le avec `{!! $themeSettings['sections'][0]['body'] !!}` seulement pour un champ `richtext`. Un identifiant média reste un identifiant : utilisez les services de médias du CMS pour le résoudre. Les clés non déclarées et les valeurs invalides sont refusées.

Le bouton **Configurer** ouvre le formulaire commun lorsqu’un schéma ou des modèles sont déclarés. L’accès demande `settings.manage` et la permission du thème si elle est précisée. La configuration d’un thème installé et vérifié reste disponible lorsqu’il est inactif. Les réglages appartiennent au thème et sont conservés lors d’un changement de thème.

Une route personnalisée peut coexister avec le schéma : le formulaire commun affiche alors un lien **Configuration avancée**. Conservez cette possibilité pour des outils propres au thème ; les champs ordinaires peuvent utiliser le mécanisme commun.

Le thème actif propose aussi une prévisualisation privée sur le chemin d’une page du site ou du panneau selon sa cible. Les valeurs sont validées sans être enregistrées. Le brouillon est lié à la session, au compte et à un jeton valable trente minutes ; les autres visiteurs continuent de voir les réglages enregistrés. Enregistrer supprime le brouillon. La prévisualisation n’active pas un thème inactif.

## Modèles de pages

Un thème peut déclarer plusieurs modèles pour une même vue, avec éventuellement une restriction aux noms de routes :

```json
"templates": {
    "pages": {
        "label": "mon-theme::messages.templates.pages",
        "view": "default.content.show",
        "routes": ["site.pages.show"],
        "choices": {
            "wide": {"label": "mon-theme::messages.templates.wide", "view": "templates.content.wide"},
            "sidebar": {"label": "mon-theme::messages.templates.sidebar", "view": "templates.content.sidebar"}
        }
    }
}
```

`templates.content.wide` désigne `resources/views/templates/content/wide.blade.php` dans le thème. `view` peut également cibler une vue de plugin, comme `wiki::default.documents.show`. Les choix restent des fichiers Blade locaux au thème. `default` peut indiquer un identifiant de choix ; sans sélection, le rendu par défaut reste utilisé.

Le formulaire de configuration propose les sélections par vue. Pour `default.content.show`, les administrateurs ayant aussi `content.manage` peuvent attribuer un modèle à une page ou une actualité précise. Les routes, données, permissions, traductions et protections restent celles du CMS. Un fichier manquant ou une sélection devenue indisponible revient au rendu par défaut.

## Menus et blocs du thème

Un thème public peut déclarer des emplacements supplémentaires, sans remplacer les menus natifs :

```json
"navigation_locations": {
    "mobile": "mon-theme::messages.menus.mobile",
    "footer_resources": "mon-theme::messages.menus.resources"
}
```

Ces emplacements apparaissent dans la gestion des menus lorsque le thème est actif. Leurs arbres filtrés sont disponibles dans `$themeMenus['mobile']`, avec le même format et les mêmes contrôles que `$headerLinks`. Les liens sont conservés si le thème change. Un champ `menu` peut aussi sélectionner un emplacement parmi ceux du thème et du noyau.

Les blocs configurables peuvent combiner les listes `repeater`, les modèles et les slots existants. Le thème garde sa présentation et ses traductions ; le noyau fournit le formulaire et la validation. Aucun constructeur de page supplémentaire n’est nécessaire pour une simple liste de sections.
