# Create a theme

A theme customizes the site or panel without editing core views. To install an existing design, see [Install an extension](extensions-catalogue.md).

## Generate the package

From the CMS root:

```shell
php artisan kraft:make theme "My theme" --id=my-theme
php artisan kraft:make theme "My panel" --id=my-panel --target=admin
```

The first command creates a `site` theme, the second an `admin` theme, under `extensions/installed/themes/`. Install the package and select it for its target in the panel. Missing overrides retain the native rendering.

The generator provides `resources/views/default/layouts/layout.blade.php` for a `site` theme, and `resources/views/admin/layouts/layout.blade.php` for an `admin` theme. This layout is optional. Remove it to create a CSS skin over the native structure, or keep it if your presentation requires its own structure. Native rendering provides the fallback for each missing page or layout.

The generator also provides `package.json` and `package-lock.json` with the locked Sass dependencies required by the manifest’s SCSS build. Commit both files with the theme. Publication compiles its assets in a temporary directory.

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

The manifest declares `type: "theme"`, `target: "site"` or `"admin"`, its version, requirements and assets. An update cannot change a theme’s target.

Views are grouped under `resources/views` by surface and resource. The `views` directory remains supported for existing packages. Optional PHP classes follow the same directories as plugins, with `src/Providers`, `src/Http/Controllers` and `src/Services` according to the theme's needs.

Optional PHP libraries belong in the theme’s `composer.json`. Its frontend libraries and build tools belong in its `package.json`, with committed lock files. Publication prepares private PHP libraries and compiles assets. The server receives a self-contained archive. See [Libraries and frontend builds](architecture-extensions.md#libraries-and-frontend-builds).

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

## Override views

An override retains the original view path. [Views and components](architecture-extensions.md#views-and-components) explains where pages, layouts, partials and components belong:

| Original view | Theme file |
| --- | --- |
| `default.home.index` | `resources/views/default/home/index.blade.php` |
| `default.layouts.layout` | `resources/views/default/layouts/layout.blade.php` |
| `admin.layouts.layout` | `resources/views/admin/layouts/layout.blade.php` |
| `wiki::default.documents.show` | `resources/views/plugins/wiki/default/documents/show.blade.php` |

A `site` theme overrides public views, while an `admin` theme overrides panel views. Declare optional plugin compatibility in `integrations`, such as `"plugin:wiki": ">=0.0.1"`. Preserve form protections, `head` and `scripts` stacks, shared assets, slots and access checks when replacing a layout.

Fragments owned by a single page are inlined into that page. Layout partials, such as the header, footer or navigation, remain reusable override points when they support theme customization. Preserve the `<x-extensions.slot>` and `<x-widgets.zone>` insertion points expected by pages and their contributions.

The public `default.layouts.layout` layout receives `$pageMetadata` prepared by the core using the page context, including `$seoVariables`. Its overrides retain the `default.layouts.partials.metadata` include, which contains the single `<title>` and SEO tags. The local `<!--suppress HtmlRequiredTitleElement -->` annotation before `<head>` avoids warnings in IDEs that do not resolve this Blade include.

Active-theme translations use `__('theme::messages.key')`. Configuration pages use the theme identifier, such as `__('my-theme::messages.accent')`.

### Pagination

Complete and simple pagination share `resources/views/partials/pagination.blade.php`. Override this same path in the theme. The view must handle the absence of `$elements` and a total when rendering simple pagination.

## View context

Public views receive `$publicSite` for site identity, `$appearance` for appearance and `$capabilities` for features available to the visitor. `$headerLinks`, `$footerLinks`, `$extensionHeaderLinks` and `$extensionFooterLinks` already apply availability rules.

```blade
@if ($capabilities->canManageConnections)
    <a href="{{ route('account.connections.index') }}">{{ __('oauth.connections') }}</a>
@endif

@if ($capabilities->extension('wiki'))
    <a href="{{ route('plugins.wiki.public.documents.index') }}">{{ __('wiki::messages.wiki') }}</a>
@endif
```

Use `$capabilities->routeAvailable($routeName)` for a custom destination. Native properties are defined in `App\Kraft\Site\ViewCapabilities`. Do not rebuild rules from settings or route existence alone. Server access checks remain mandatory.

If your theme defines another view namespace, add the common context:

```php
view()->composer('my-theme::*', function ($view) {
    $view->with(app(\App\Kraft\Site\PublicViewContext::class)->data(request()));
});
```

The public server connection address is available through `app(App\Kraft\CommunityConnection::class)->address()`, returning a validated address or `null`.

## Theme configuration

The theme owns its configuration form. Its manifest provides the route and permission:

```json
"configuration": {
    "route": "themes.my-theme.admin.configuration.index",
    "routes": "routes/admin.php",
    "permission": "settings.manage"
}
```

`configuration.routes` loads configuration routes even for an inactive theme, provided it is installed and verified. The file must stay under `routes/`. The core applies panel access checks. Your theme owns validation and persistence. Routes follow `themes.<id>.admin.*` under `/admin/themes/<id>/`.

## Styles, fonts and appearance

Declare SCSS entries in `build.scss`, outputs in `assets.styles` and scripts in `assets.scripts`. The core automatically loads the active theme's declared assets into the `head` and `scripts` stacks, with theme CSS after core CSS. Preserve `@stack('head')` and `@stack('scripts')` in each custom layout to receive these assets and extension contributions.

A CSS skin reusing the native layout targets its classes, such as `.theme-native .site-header`. A theme's own layout chooses its own classes. From a development installation, using Node 22.12 or later:

```shell
npm ci
npm run build
```

Ship compiled assets in the package. Place WOFF2 files under `public/fonts/`, declare them in `assets.fonts`, use relative CSS URLs and preserve their licenses. Use `font-display: swap` to display content while fonts load. Font files remain local.

Only advertise supported palettes:

```json
"capabilities": {
    "appearance": ["light", "dark", "auto"]
}
```

`auto` requires `light` and `dark`. The layout receives `data-bs-theme="light"` or `"dark"`. A standalone layout can reuse `default.layouts.partials.appearance-head` and `default.layouts.partials.appearance-menu` with the result of `Appearance::resolve($request, $themeManifest)`.

Verify desktop and mobile layouts, long content, forms, empty states, permissions and each advertised palette. See [Interface integration](ui-contributions.md) for shared blocks and forms.
