# Distribute an extension

This guide is for plugin, theme and game-module authors. Packages must install independently of their development repository.

## Prepare the archive

The ZIP contains the package’s `manifest.json`, sources, translations, migrations, views, compiled assets and licenses. Place these at its root or inside a single top-level directory. Exclude secrets, local data, `node_modules` and private test files.

Declare PHP libraries in the extension’s `composer.json` and commit `composer.lock`. The workflow installs and isolates them with PHP-Scoper. It distributes this private `vendor/`, its licenses, validated index and Composer files. Do not use your development `vendor/` or change the core Composer project.

Libraries follow package files when uninstalling, archiving or permanently deleting them. The [extension lifecycle](architecture-extensions.md#libraries-and-frontend-builds) explains these operations and configuration files.

For frontend builds, declare dependencies and `scripts.build` in `package.json`, then commit `package-lock.json`. The workflow installs and compiles in a temporary copy of the commit. Only `public/` output enters the ZIP, without `node_modules`, tools or npm configuration. User sites need neither Composer nor Node.js to install the package.

Set the manifest version and accurate CMS/PHP requirements. For themes, check that declared CSS outputs and fonts are present. Install the ZIP on a test site, then try upgrading an earlier version with existing data.

Published archives are immutable. Corrections require a new version. Do not replace files attached to distributed tags.

## Publication in Kraftink-CMS

Public `Plugin-*`, `Theme-*` and `Game-*` repositories use the tools in [Kraftink-CMS/automation](https://github.com/Kraftink-CMS/automation). The controller automatically installs and maintains the small **Release** workflow on `master` and `dev` when initializing the repository. Authors do not need to configure an App, copy YAML, create tokens or configure a release policy.

The workflow is installed directly on GitHub, including in future matching repositories. Local sources and extensions created by the CMS generator do not include this file.

A first commit containing only a README on `master` is enough to initialize the repository. The controller can then install the button and create `dev` from the configured `master`. Add sources and the manifest to `dev` before publishing. Central exclusions and profiles also apply to future repositories. Button installation may wait for the next bootstrap pass and the repository’s merge requirements.

Independent game modules have a [source template](game-release-template/README.md). Games bundled with the CMS follow its distribution and are not published separately. The CMS keeps its own workflows, channels and signed archives. [KraftLink](developpement-kraftlink.md#distribute-the-connector) uses the same button with its local Maven build.

This automation targets repositories in the Kraftink-CMS organization. For an extension hosted elsewhere, build an archive locally or use your own publication workflow.

PRs targeting `dev` reuse the release validations: manifest, PHP syntax, dependencies and asset compilation. They publish nothing and retain no distribution artifact. The required **checks / Validate changes** result must pass before merging. GitHub **Maintain** and **Admin** roles can bypass this rule and push directly to `dev`. The release never merges or publishes when its validations fail. Automatic version commits receive metadata-only validation, without approving a release.

## Validate locally

Install the `automation` npm dependencies and Composer tooling as described in the [tools README](https://github.com/Kraftink-CMS/automation). From the package root, run:

```shell
node /absolute/path/automation/scripts/releases/build.mjs check
```

Scripts are not copied into the package repository. Run the generic suite with `npm test` from `automation`. Also run the package’s own tests. The central build uses PHP 8.5.

To run your tests in PRs and releases, commit an optional composite action at `.github/actions/test/action.yml`. Shared validation runs it before the build with a read-only token. This action sets its steps' working directory to the project root (`${{ github.action_path }}/../../..`), sets up its environment and runs your commands (`npm test`, PHPUnit, etc.), without imposing a framework. A failure blocks validation. Projects without tests need no extra file. The KraftLink Maven build already runs any tests it contains.

## Publish a version

1. Push the contents to publish to `dev`.
2. In the extension repository, open **Actions → Release → Run workflow**.
3. Select `master` or `dev`, then choose `auto`, `patch`, `minor` or `major` for `bump`.
4. Run the workflow. It records the current `dev` commit and requested version level.

Write access to the extension repository is enough to run **Release**. The workflow checks this permission again when rerunning jobs. No write access to the central repository or personal token is required.

The same **Release** run writes the stable manifest version on `dev` in a commit limited to that change, then opens the `dev → master` PR before the build. A read-only job checks and builds this source without an App key or publication secret. The workflow waits for required checks and the PR’s authorized merge, then verifies the proofs and hashes before publishing the built files in GitHub Releases. After verified publication, it prepares the next development patch on `dev`.

A build failure or an additional check may leave the PR open. A new **Run workflow** request is then refused and provides the PR’s link. Complete the requirements within the current publication. Scheduled passes are reserved for installing the button, maintaining its protections and refreshing the Market. Publication stays in the same run in the extension repository.

New `dev` commits are never silently added to an existing build. Before merging, push fixes to `dev`, then select **Re-run all jobs** in the same **Release** run to prepare the corrected source and rebuild everything while keeping the chosen version. To change the target, close the PR and start a new **Release**. Keep the generated blocks in the PR description. An ordinary push or PR does not publish a version.

Without a custom policy, the first version comes from the manifest without its development suffix. For example, `0.0.1-dev` produces `0.0.1`. For later releases:

- `auto` follows tags and Conventional Commits, with a patch as the default.
- `patch`, `minor` or `major` explicitly applies the chosen level to the latest stable.

The `.github/release-policy.json` file is optional. It can customize `initial_version`, `default_bump` and `next_version`. With `auto`, a planned `next_version` is used when applicable. An explicit level takes precedence.

`master` carries the published stable version. After verified publication, automation pushes a version commit to `dev` for the next patch, for example `1.0.1-dev` after `1.0.0`, preserving higher targets and newer code changes. Run `git pull` before continuing development. This commit does not start another release.

A release contains:

- `<slug>-<version>.zip`.
- its SHA-256 checksum.
- `kraftink-extension.json`, containing the `resource` listing and available versions.

The tag keeps the tested commit integrated into `master` through the PR. An already-tagged commit retains its version. Published files are never replaced with different content.

For a temporary error on the same SHA, open the affected **Release** run and use **Re-run failed jobs**. This retry keeps the same context and prepared files. A code change before merging requires **Re-run all jobs** in that same run. If the PR is already merged, finish this interrupted publication before requesting another one. Transfer artifacts expire after seven days, including for KraftLink. Final files remain in GitHub Releases. If artifacts expired after merging, an administrator must resolve the unfinished publication before the next version.

## Release notes

The **Release** form provides the same options for plugins, themes, games and custom builds such as KraftLink:

| `notes_mode` | Published contents |
| --- | --- |
| `auto` | The generated commit list. This is the default and `notes` must stay empty |
| `append` | The Markdown message from `notes`, followed by the generated list |
| `replace` | Only the Markdown message from `notes` |

`notes` is optional with the defaults. It becomes required with `append` or `replace` and accepts up to 8 KiB of UTF-8 text. This input is a string. To supply Markdown spanning several lines, you can send that string through GitHub’s `workflow_dispatch` API together with `notes_mode`.

The list uses real commits between the previous stable version and the selected source. A first release uses that source’s history. Subjects link to individual commits, rather than showing only the automatic `dev → master` PR. Bot authors or committers, merge commits and exact technical workflow messages, such as version changes and button setup, are excluded. Other human commits, including migrations and product-related `chore` commits, remain included.

The list contains at most 100 commits and may be shortened to fit the notes size limit. A truncation notice and a comparison or history link provide access to the rest. With `append`, your message always comes before the list.

Notes belong to the prepared context. **Re-run failed jobs** keeps that context. A retry does not replace the notes of an already published version.

## Present the package in the Market

The manifest supplies `name` and `description` as text or package translation keys. Optional `market.name` and `market.description` select a catalogue-specific presentation and also accept translation dictionaries. The workflow resolves every translation actually present in the published commit, independently for each field. It does not create missing translations. Plain text remains a string without an assigned language. Missing or unresolved descriptions fail validation.

Place package presentation images in `resources/market/` at the root of its repository. Optional `market.image` accepts a filename such as `preview.jpg`, a subpath such as `fr/preview.jpg` or the full repository-relative path `resources/market/fr/preview.jpg`. Supported formats are PNG, JPG, JPEG, WebP, GIF and AVIF. Paths must stay inside that directory, without traversal, symbolic links or absolute paths.

The field can also provide different images by language. Language codes can include `fr`, `en`, `pt-BR` or `zh-Hant-TW`. Publication checks each file and replaces its path with a raw GitHub URL pinned to the `v<version>` tag. The catalogue therefore contains directly usable HTTPS URLs without requiring clients to know the repository layout. Direct public HTTPS URLs remain accepted without credentials, custom ports, query parameters or fragments.

```json
{
    "market": {
        "name": "My theme",
        "description": {
            "fr": "Un thème pour votre communauté.",
            "en": "A theme for your community."
        },
        "image": {
            "fr": "preview-fr.jpg",
            "en": "preview-en.jpg"
        }
    }
}
```

This example uses `resources/market/preview-fr.jpg` and `resources/market/preview-en.jpg`. Declare a shared image for every language with `"image": "preview.jpg"`.

The website displays catalogue listings directly. For each field, it looks for the visitor’s language, then its base language, then English, then the first available language. A French-only listing therefore remains readable on the English website. Plain strings are displayed as supplied. There is no separate website selection or second set of listing texts to maintain.

`manifest.market` can also declare `author.name`, `author.url`, `commercial.kind`, `commercial.url`, `commercial.price` and `manual_only`. Prices use an object such as `{"amount": "9.99", "currency": "EUR"}`. Paid-package acquisition takes place with its author.

The registry maintainer adds the repository to `resources.json` on the Market’s `dev` branch:

```json
{
    "schema_version": 1,
    "repositories": [{ "repository": "community/Plugin-Example", "auto_update": true }],
    "resources": []
}
```

The `resources.json` file stays on `dev`. The **Market validation** workflow checks changes and PRs targeting that branch. Central automation builds `catalogue.json` from release metadata without executing extension PHP. It publishes the catalogue on `master`, which contains only `README.md` and `catalogue.json`. Sites read this catalogue and download the archive for the chosen version.

An entry with `auto_update: true` allows the offer to be imported on the next automatic pass, even if its first release already exists. Removing the repository from the list removes its offer. With `auto_update: false`, automatic updates are paused and the existing published listing is retained. The value must be a boolean. The `resources` list remains available for manual offers.

The central [Refresh Market](https://github.com/Kraftink-CMS/automation/actions/workflows/refresh-market.yml) workflow on `master` offers three manual scopes: `automatic` refreshes active repositories, `repository` imports or refreshes the registered repository named in that field, and `all` processes every registered repository. The `repository` and `all` modes include paused offers without changing `auto_update`.

## Refresh the registry

After publication, the central **Refresh Market** workflow updates the catalogue on an automatic pass or a manual run. A version appears once GitHub has processed the update and site caches have refreshed. No extra Market configuration is needed in the extension repository.

Distributed checksums verify expected bytes and are not author signatures. See the [catalogue contract](market-contract.md) to host your own feed or publish manual offers.
