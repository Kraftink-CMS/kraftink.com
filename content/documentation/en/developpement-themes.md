# Creating a site or admin theme

A theme customises one interface through views, styles and settings. `site` and `admin` themes are selected independently and use the same package format.

## Generating and organising a theme

```shell
php artisan kraft:make theme "My theme" --id=my-theme
php artisan kraft:make theme "My panel" --id=my-panel --target=admin
```

The package is created under `extensions/installed/themes/`. Install it and select it for its target in the panel.

| Directory or file | Contents |
| --- | --- |
| `manifest.json` | Identity, target, requirements and assets |
| `resources/views/default/` | Public views for a `site` theme |
| `resources/views/admin/` | Panel views for an `admin` theme |
| `resources/scss/` | Style sources |
| `public/` | Distributed CSS, JavaScript, images and fonts |
| `lang/fr/messages.php`, `lang/en/messages.php` | Translations with matching keys |
| `src/` | Optional PHP classes, organised like a plugin |

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

The target stays fixed during updates. The generator provides the target layout and npm files for Sass. Keep their lockfiles. [Dependencies and libraries](extensions-publication.md#libraries-and-assets) belong to the theme.

## Overriding views

An override keeps the original view’s path:

| Original view | Theme file |
| --- | --- |
| `default.home.index` | `resources/views/default/home/index.blade.php` |
| `default.layouts.layout` | `resources/views/default/layouts/layout.blade.php` |
| `admin.layouts.layout` | `resources/views/admin/layouts/layout.blade.php` |
| `wiki::default.documents.show` | `resources/views/plugins/wiki/default/documents/show.blade.php` |

Only supplied views are replaced. Remove the generated layout to create a CSS skin of the native appearance, or adapt it for a theme-specific structure. Declare optional plugin compatibility in `integrations`.

Keep forms and their protections, `<x-extensions.slot>` slots, `<x-widgets.zone>` areas, and `@stack('head')` and `@stack('scripts')`. Public layouts retain `default.layouts.partials.metadata` for the title and SEO tags.

Generic components use `<x-…>` and panel components use `<x-admin::…>`. Reusable fragments go in their resource or layout’s `partials/`. Active theme translations use `theme::messages.*`. Configuration uses the theme identifier, such as `my-theme::messages.settings.accent`.

### Errors, pagination and email

| Output | Override |
| --- | --- |
| HTTP error | `resources/views/errors/404.blade.php`, then `4xx.blade.php` as fallback |
| Maintenance | `resources/views/errors/maintenance.blade.php` |
| Pagination | `resources/views/partials/pagination.blade.php` |
| Account email | `resources/views/emails/account/notification.blade.php` |
| Plugin email | `resources/views/plugins/<plugin>/<path>.blade.php` |
| Laravel email | `resources/views/vendor/notifications/email.blade.php` |
| Markdown components | `resources/views/vendor/mail/html/` and `text/` |

Simple pagination uses the same view without totals or `$elements`. [Interactive tables](tables.md) keep their attributes and shared JavaScript. Emails use the site theme and must retain variables, action links and text versions.

## Context and assets

Public views receive `$publicSite`, `$appearance`, `$capabilities` and filtered links `$headerLinks`, `$footerLinks`, `$extensionHeaderLinks` and `$extensionFooterLinks`. Check destinations with `$capabilities->extension($id)` and `routeAvailable($routeName)`.

For another view namespace, provide context from a view composer with `app(App\Kraft\Site\PublicViewContext::class)->data(request())`. Native availability properties are defined in `App\Kraft\Site\ViewCapabilities`.

Declare CSS in `assets.styles`, scripts in `assets.scripts` and fonts in `assets.fonts`, using paths relative to `public/`. The CMS loads them automatically, placing theme CSS after core CSS. From the theme directory, run `npm ci` and `npm run build` when a script is defined. Otherwise, publication tooling handles the manifest build declaration.

Keep fonts locally under `public/fonts/`, retain their licences and use relative CSS URLs. A native skin can target `.theme-native .site-header`.

```json
"capabilities": {
    "appearance": ["light", "dark", "auto"]
}
```

Advertise only supported palettes. `auto` requires `light` and `dark`. Layouts receive `data-bs-theme="light"` or `"dark"`. Custom public layouts can reuse `default.layouts.partials.appearance-head` and `appearance-menu`.

## Theme settings

The CMS can generate a form from `configuration.schema`:

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

Types are `text`, `textarea`, `richtext`, `url`, `color`, `number`, `boolean`, `select`, `multiselect`, `media`, `menu` and `repeater`. Use `help`, `default`, `required`, `min` and `max` as appropriate. `options` maps values to translation keys and `mime` restricts media types. A `repeater` contains simple fields without nesting.

Views receive values in `$themeSettings`. To render the fields from the preceding schema:

```blade
<h1>{{ $themeSettings['hero_title'] }}</h1>

@foreach ($themeSettings['sections'] as $section)
    @if ($section['enabled'])
        <section>
            <h2>{{ $section['title'] }}</h2>
            {!! $section['body'] !!}
        </section>
    @endif
@endforeach
```

Text fields stay escaped with `{{ }}`. Only the cleaned `richtext` field uses `{!! !!}` here. Resolve media identifiers through CMS services.

For custom configuration, declare a route:

```json
"configuration": {
    "route": "themes.my-theme.admin.configuration.index",
    "routes": "routes/admin.php",
    "permission": "settings.manage"
}
```

The file stays under `routes/`. Routes follow `themes.<id>.admin.*` under `/admin/themes/<id>/`. The CMS adds panel access checks. Your code handles validation and saving. A route can supplement the schema through **Advanced configuration**.

Settings remain accessible for an installed inactive theme. Preview lets the current account try values without saving them on the active theme.

## Page templates and menus

Declare variants for a view:

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

Blade files are local to the theme. `default` can select an initial choice. The form offers selections per view. For `default.content.show`, an administrator with `content.manage` can also choose a template per page or news item.

A public theme can add menu locations:

```json
"navigation_locations": {
    "mobile": "my-theme::messages.menus.mobile",
    "footer_resources": "my-theme::messages.menus.resources"
}
```

Filtered trees are available in `$themeMenus['mobile']`, using the same format as `$headerLinks`. Links survive theme changes. For blocks the owner can move, use [widgets](plugin-widgets.md).
