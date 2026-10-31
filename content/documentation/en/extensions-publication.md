# Distributing an extension

Ship a ZIP installable from the panel, with dependencies and assets already prepared. The site owner should not need to compile your package.

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

The manifest supplies `name` and `description` as text or package translation keys. `market.name` and `market.description` allow a dedicated presentation. Validation requires a description.

```json
"market": {
    "name": "My theme",
    "description": {
        "fr": "Un thème pour votre communauté.",
        "en": "A theme for your community."
    },
    "image": {"fr": "preview-fr.jpg", "en": "preview-en.jpg"}
}
```

Place images in `resources/market/`. Supported formats are PNG, JPG, JPEG, WebP, GIF and AVIF. A shared image uses `"image": "preview.jpg"`. Available translations are used without requiring every language.

Optional `author.name`, `author.url`, `commercial.kind`, `commercial.url`, `commercial.price` and `manual_only` also belong in `market`. For example, a price uses `{"amount": "9.99", "currency": "EUR"}`.

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
