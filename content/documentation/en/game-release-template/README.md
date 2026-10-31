# Game release template

This template supplies the sources of an independent game module. Build and publication tooling is maintained in `Kraftink-CMS/automation`. Games bundled with the CMS follow its distribution and do not use this template.

## Prepare the repository

Create a public Kraftink-CMS `Game-*` repository with an initial README on `master`. Once `dev` exists, add sources and a manifest such as:

```json
{
    "id": "example-game",
    "name": "Example Game",
    "description": "example-game::messages.description",
    "market": {
        "description": "example-game::messages.description"
    },
    "type": "game",
    "version": "1.0.0-dev",
    "namespace": "Community\\Games\\ExampleGame\\",
    "provider": "Community\\Games\\ExampleGame\\Providers\\GameServiceProvider",
    "requires": { "cms": ">=0.0.1", "php": "^8.4.1" }
}
```

The module must not declare `builtin: true` or replace a core-reserved identifier. Supply description translations in `lang/fr/messages.php` and `lang/en/messages.php`.

The manifest’s `name`, `type` and `version` identify the module. Public presentation uses `market.name` when provided, otherwise `name`, and the translated description in `market.description`. The generator reuses the module’s `messages.description` key, whose texts are defined once in `lang/fr/messages.php` and `lang/en/messages.php`. Replace the initial description with your game module’s actual features. Additional translations remain optional.

ZIP previews read translations as data without executing PHP files. Language files must return arrays of literal texts. A public presentation that differs from the internal summary can use a dedicated key, for example `example-game::market.description` in `lang/en/market.php`, without copying its texts into the manifest. A public name can use the same approach with `market.name`.

Images are optional. If you supply a real image, place it in `resources/market/` and declare, for example, `"image": "preview.png"` inside `market`, or a language dictionary. Supported formats are PNG, JPG, JPEG, WebP, GIF and AVIF. The file must exist in the package, without directory traversal or symbolic links. A public HTTPS URL without credentials, port, query parameters or fragment is also accepted. Do not declare an image path when the file is absent. SVG files are not Market presentation images.

The [central controller](https://github.com/Kraftink-CMS/automation) automatically installs and maintains the small **Release** workflow on `master` and `dev` when initializing the repository. It creates `dev` if needed after configuring `master`. The module needs no manually configured YAML, token or release-policy file. Installation may wait for the next bootstrap pass or repository merge requirements.

The workflow is installed directly on GitHub. This template and the CMS game generator provide the module’s sources without a `.github/workflows/release.yml` file or copies of generic tooling.

## Validate and publish

Install the `automation` project’s dependencies, then run `node /absolute/path/automation/scripts/releases/build.mjs check` from the module root. Run generic tests with `npm test` from `automation`. Keep and run the module’s own tests. Then install an archive on a test site. If `build.scss` is declared, supply npm dependencies and a lockfile for style compilation.

Versioning, publication with **Release**, failure recovery and Market registration are described in [Distribute an extension](../extensions-publication.md).
