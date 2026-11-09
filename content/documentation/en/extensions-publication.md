# Distributing an extension

Ship a ZIP installable from the panel, with dependencies and assets already prepared. The site owner should not need to compile your package.

Point users to the catalogue in their KraftInk admin panel when your extension is listed. For manual installation, direct them to the ready-to-install ZIP attached to the release. [Installing extensions](extensions-catalogue.md)

## Archive contents

Place `manifest.json`, `src/`, routes, views, translations, migrations and required assets at the root or in a single top-level directory. Include licences for distributed libraries and fonts. Exclude secrets, local data, `node_modules` and development tools.

Set a stable version and CMS/PHP requirements in the manifest. Install the ZIP on a copy of KraftInk without your development repository, then check updating a previous version with its data.

A distributed version is immutable. Publish another version to correct its contents.

## Libraries and assets

| File | Purpose |
| --- | --- |
| `manifest.json` | Identity, compatibility and KraftInk contributions |
| `composer.json`, `composer.lock` | Package PHP libraries and locked versions |
| `package.json`, `package-lock.json` | Frontend dependencies and compilation |

These files are optional when the package does not need them. Do not modify core dependencies to install your own.

KraftInk publication prepares production PHP libraries with PHP-Scoper in a private `vendor/` and generates `manifest.libraries`. The CMS loads this index, so your provider must not include `vendor/autoload.php`. `App`, `Illuminate` and `Laravel` remain supplied by the CMS.

The Composer file can declare requirements, metadata and PSR-4 mapping of the namespace to `src/`. Custom repositories, scripts and active configuration are rejected. Test dynamic class references after preparation. A `scoper.inc.php` can add `patchers` if needed.

For the frontend, declare a `build` script producing files under `public/`. Publication uses `npm ci` and this script without installation hooks, `prebuild` or `postbuild`. A theme can use `build.scss` with locked Sass dependencies when no `build` script is defined.

## Market presentation

`market.name` is the listing title. Keep `market.description` short for the catalogue cards and put details in the listing’s Markdown. When omitted, publication uses `name` and `description` from the manifest root. Validation requires a description.

For plugins, the Market reads the required [game declaration](developpement-plugins.md#manifest-and-provider) from `games` in the manifest. Each listing shows compatibility and extra features for its latest version.

To add a public support contact to your Market listing, set `market.support.discord` to an HTTPS invite on `discord.gg` or `discord.com/invite`, or set `market.support.email` to a simple email address. You can provide both. The listing links to the KraftInk Discord when no contact is provided.

Choose one of these three formats for the name and summary.

### Reusing package translations

A key references text in your language files. Use this format to keep translations in the package’s PHP catalogues:

```json
"market": {
    "name": "my-theme::messages.market.name",
    "description": "my-theme::messages.market.description",
    "image": "preview.jpg"
}
```

In `lang/fr/messages.php`:

```php
<?php

return [
    'market' => [
        'name' => 'Mon thème',
        'description' => 'Un thème pour votre communauté.',
    ],
];
```

In `lang/en/messages.php`:

```php
<?php

return [
    'market' => [
        'name' => 'My theme',
        'description' => 'A theme for your community.',
    ],
];
```

`my-theme` must match the manifest `id`. `messages` identifies the PHP file and `market.description` its nested array keys. Publication collects the languages you have filled in. A key without any translated value fails validation.

### Writing shared text

For the same presentation in every language, use literal text:

```json
"market": {
    "name": "My theme",
    "description": "A theme for your community."
}
```

This text is displayed as written without automatic translation.

### Providing languages in the manifest

A dictionary also lets you supply text directly per language:

```json
"market": {
    "name": {"fr": "Mon thème", "en": "My theme"},
    "description": {
        "fr": "Un thème pour votre communauté.",
        "en": "A theme for your community."
    },
    "image": {"fr": "preview-fr.jpg", "en": "preview-en.jpg"}
}
```

Dictionary values are literal text. You can mix formats between fields, such as a shared name and a description from a translation key. Not every language is required.

Optional `author.name`, `author.url`, `commercial.kind`, `commercial.url`, `commercial.price` and `manual_only` also belong in `market`. For example, a price uses `{"amount": "9.99", "currency": "EUR"}`.

### Writing the listing in Markdown

Add `MARKET.md` at the package root to display one shared write-up. To provide translations, put a `market.md` file in each language directory under `lang/` and declare the paths in `market.readme`.

```json
"market": {
    "description": "A forum for your gaming community.",
    "readme": {
        "en": "lang/en/market.md",
        "fr": "lang/fr/market.md"
    }
}
```

The Market shows the current language when available, then English, then the first language you provided. Write UTF-8 Markdown, with up to 32 KiB per file, eight languages and 128 KiB total. Use Markdown for formatting and links. The listing renderer skips raw HTML, and direct ZIP uploads reject it.

### Adding icons and images

- Set `market.icon` to a Bootstrap Icons name in kebab case, such as `chat-square-text`, or point it to an image in `resources/market/`. [Bootstrap Icons](https://icons.getbootstrap.com/)
- Set `market.image` to a cover. A single path such as `preview.jpg` uses the same cover in every language. Use a language dictionary for localized covers. For a theme preview, a 1440 × 900 image (8:5) keeps the layout and key content in view on the card.
- To illustrate a feature in the Markdown, save the image in `resources/market/` and reference it with Markdown image syntax.

```markdown
![Forum categories](resources/market/categories.webp)
```

A direct public HTTPS URL also works for a cover, an image icon or an image in the Markdown. Covers published from GitHub can also use GIF and AVIF. For files bundled in a ZIP uploaded to the Market, use PNG, JPEG or WebP, up to 2 MiB per image. Image icons and Markdown images share a limit of eight distinct files and 6 MiB total.

## Release notes

For a registered GitHub repository, the Market reads each version’s notes from GitHub Releases.

For a ZIP uploaded to the Market, add an optional `CHANGELOG.md` at the package root with the notes for that ZIP’s version. For translations, put a `changelog.md` file in each language directory and declare the paths in `market.changelog`. The Market uses the same language order as the listing description.

```json
"market": {
    "changelog": {
        "en": "lang/en/changelog.md",
        "fr": "lang/fr/changelog.md"
    }
}
```

Write up to 8 KiB per file in up to eight languages. Release notes can include Markdown links and direct public HTTPS images. Images bundled in the ZIP can appear in the listing description. A version without notes still appears in the changelog.

## Publishing a version

If your repository is managed by Kraftink-CMS automation:

1. Push the content to `dev`.
2. Open **Actions → Release → Run workflow**.
3. Choose `auto`, `patch`, `minor` or `major`.
4. Resolve failing checks and follow the proposed PR through merging.

The workflow builds the ZIP and its metadata. To validate a package locally after installing the [publication tools](https://github.com/Kraftink-CMS/automation), run from the package root:

```shell
node /absolute/path/automation/scripts/releases/build.mjs check
```

For an independent repository, your own build must produce the same ready-to-install package. To offer it in the KraftInk catalogue, send its repository and release to the Market manager.
