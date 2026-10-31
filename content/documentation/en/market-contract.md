# Supply a Market catalogue

This reference is for catalogue publishers. To distribute an extension using existing workflows, start with [Publish a package](extensions-publication.md).

## Source and identity

The CMS reads HTTPS URLs declared in `config/market.php`, without discovering additional repositories or sources. Feed URLs reject credentials, query parameters, fragments and custom ports. Feeds return JSON with HTTP 200 and no redirects.

A source can be a public JSON file or an API that applies account permissions. Replacing its URL with an endpoint following this contract requires no CMS update. The endpoint supplies the complete catalogue within the limits below, rather than a Market HTML page.

Each source has a name, URL and authentication capability declared in `config/market.php`:

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

Each `sources` entry is an object with `name`, `url` and `supports_site_key`. With `supports_site_key: false`, the panel offers no key field and the CMS never sends an authentication header to that source. Setting it to `true` enables optional key configuration for that source.

An offer is identified by `(source, resource.id)`. `id` uses `author/slug`. `slug` matches the manifest identifier and installed directory. Offers from different sources remain distinct, but two packages cannot occupy the same local directory.

## Site keys and requests

Under **Administration → Market**, every configured catalogue has its own card. The owner configures a key in the relevant catalogue’s card if it accepts one. The CMS stores the key encrypted and never displays it again. A saved key is represented only by its status. **Replace** opens a field for a new key. **Remove** asks for confirmation before deleting the saved access for that source. Source URLs remain configured in `config/market.php`.

The CMS sends these headers to the catalogue and its source’s downloads:

```http
KraftInk-Market-Protocol: 1
KraftInk-Version: 0.0.1
KraftInk-Site-Url: https://community.example
Accept-Language: en
Authorization: Bearer <site-key>
```

`Authorization` is absent without a key or when the source does not support keys. It is only sent to the configured source’s HTTPS origin. The key is never sent to GitHub or another distribution domain during a redirect. Catalogue links do not contain the key.

A key belongs to the exact source URL. Changing endpoints requires configuring a key for the new source. The service resolves the account, purchases and restrictions from this token. The CMS does not purchase licenses.

A key contains 16–512 characters from ASCII letters, digits and `._~-`. The service treats it as an opaque token instead of resolving the account from an identifier declared by the CMS.

`KraftInk-Site-Url` describes the configured site address without proving domain ownership. To restrict access by IP, the service uses the actual address observed after applying its own trusted proxy rules. It must not accept an IP address declared by the CMS as proof of authorization.

## Minimal response

Replace the example URLs and checksum with those of a real archive:

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

## Fields and limits

| Field | Contract |
| --- | --- |
| `type` | `plugin`, `theme` or `game` |
| Author and slug | 2–50 lowercase letters, digits or hyphens, starting with a letter |
| `name` / `description` | Plain strings or language dictionaries with at least one translation, limited to 120 / 1,000 characters per value |
| `image` | Optional public HTTPS URL string or language dictionary of URLs, with at most 2,048 characters per URL |
| `author.id` | Author portion of `id` |
| `versions` | 1–100 distinct Semver versions |
| `requirements` | Flat object matching the manifest’s `requires`, including required `cms` and `php` keys, followed by `plugin:id`, `theme:id` or `game:id` references, each mapped to a Composer constraint |
| `download` | Explicit URL and ZIP SHA-256 for an automatically installable offer |
| Resource `access` | Optional object with boolean `allowed` and optional `code` to explain a refusal |

`name` and `description` also accept a plain string without an assigned language. A dictionary contains only the translations actually provided, independently for each field, with at most 100 languages and 35 characters per language code. For example, `"name": "Example"`, `"description": {"fr": "Un exemple."}` and `"image": "https://example.com/image.jpg"` are valid. Image URLs require HTTPS and reject credentials, custom ports, query parameters and fragments.

The website and CMS display each text in the requested language, then its base language, then English, then the first available language. A plain string is displayed as supplied. The website uses the same fallback for images and directly displays every offer from its configured sources.

Feeds accept 0–1,000 resources and 2 MiB. Duplicate identities within a source and unknown schemas are rejected. `repository` is optional and informational and does not imply an archive location.

Extension dependencies use a prefix matching the manifest’s type. For example, `"requirements": {"cms": ">=0.0.1", "php": "^8.4.1", "plugin:shop": ">=0.0.1"}` requires a compatible Shop plugin. Declare PHP libraries in the extension’s `composer.json` so its ZIP can include prepared private libraries. Frontend libraries belong in its `package.json`. Neither becomes a requirement on the CMS Composer project. The catalogue keeps its `author/slug` identities to distinguish offers and their sources.

For paid offers, `commercial.kind` is `paid`, with an HTTPS acquisition link in `commercial.url`. `commercial.price` can contain decimal-string `amount` and three-letter ISO `currency`. `manual_only` then defaults to `true`, and `download` may be absent. The CMS does not purchase licenses.

## Public access, private access and refusals

A public catalogue may omit the `access` field. An API may add a root `access` object:

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

`scope` is `public` or `private`. `code` is optional. The returned catalogue is authoritative. A public response contains neither restricted offers nor private download URLs.

A code matches `^[a-z][a-z0-9_]{0,79}$`.

HTTP 200 with `scope: public` keeps the public catalogue accessible while explaining why private access was denied. To reject the entire request, the service returns an error status and this JSON body:

```json
{
    "error": {
        "code": "ip_not_allowed"
    }
}
```

| Status | Usage |
| --- | --- |
| `401` | Missing, invalid or revoked key when authentication is required |
| `403` | Recognized key but disallowed IP, domain or permissions |
| `404` | Unavailable resource or version |
| `429` | Request limit reached |
| `5xx` | Temporarily unavailable service |

This example uses HTTP `403`. The same codes work in `error.code`, the root `access.code` and a resource’s `access.code`.

### Reason codes and translation

The service sends only a code. The CMS chooses its own translated text in the administration language. It ignores every remote `message` field in HTTP errors, catalogue access and resource access, regardless of its type or language.

| Code | Reason |
| --- | --- |
| `site_key_required` | Site key required |
| `site_key_invalid` | Unrecognized key |
| `site_key_expired` | Expired key |
| `site_key_revoked` | Revoked key |
| `site_access_invalid` | Check the configured site key or IP, without publicly distinguishing them |
| `ip_not_allowed` | Disallowed IP address |
| `domain_not_allowed` | Disallowed domain |
| `purchase_required` | Purchase required |
| `resource_not_found` | Unavailable resource |
| `version_not_found` | Unavailable version |
| `rate_limited` | Request limit reached |
| `service_unavailable` | Temporarily unavailable service |
| `resource_denied` | Resource download denied |

An unknown code produces a generic reason translated by the CMS. Without a code, the CMS uses `http_<status>` and chooses its local text from the HTTP status. HTML errors and invalid bodies follow the same rule without showing the server’s raw response.

This rule only applies to access reasons and errors. Names, descriptions and images retain each resource’s own languages. They come from its manifest or package translations and are not replaced with CMS interface translations.

## Paid resources and download permissions

The service may keep an offer visible while refusing installation using `access.allowed: false` and a reason:

```json
{
    "access": {
        "allowed": false,
        "code": "purchase_required"
    }
}
```

The offer retains its acquisition link. Its installation button is blocked and the reason is displayed. Never include a private URL in a denied offer.

To authorize a purchased resource, return `commercial.kind: paid`, `manual_only: false`, `access.allowed: true` and `download.url` and `download.sha256` for each available version. A private download uses an HTTPS URL on the source’s origin. Its endpoint checks the key, permissions and restrictions again before sending the ZIP. Refusals use the same JSON error format as the catalogue.

The distributor can host the entire resource without a Git repository. `repository` remains optional. Installations and updates use each version’s URL returned by the catalogue, with the same key and SHA-256 checks. Publishing a newer compatible version is enough to make it available in the CMS.

For example, the catalogue can supply these fields for a version:

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

The endpoint returns the ZIP from its own storage. It can also proxy its private storage. An initial URL pointing at an arbitrary CDN with a token in query parameters does not follow this contract.

`manual_only: true` remains available for external distribution and manual installation. A key controls access to files and updates. This contract does not guarantee that a previously downloaded copy cannot be redistributed.

## Installation validation

Before downloading, the CMS checks requirements. Afterwards, it checks the ZIP’s SHA-256, structure and actual manifest. Identifier, type, version and requirements must match the catalogue. After boot verification, a first installation enables a plugin automatically. Installed themes and games require an explicit selection before use.

Archive URLs must use GitHub or the selected source’s domain, with only allowed distribution redirects. Initial URLs containing credentials or query parameters are rejected.

The selection retains its source throughout the operation. Failure must not trigger fallback to another catalogue carrying the same identifier.

## Cache and availability

The CMS cache is fresh for 60 seconds and uses `ETag`/`Last-Modified` when available. It separates sources, keys, language, CMS version and site URL. Adding, replacing or removing a key invalidates the cache context and Market notifications.

During a network outage or `5xx` error, a previously valid response can remain visible for 24 hours after verification. An HTTP `4xx` refusal, invalid catalogue response or unknown protocol removes the previous response for that source instead of retaining its private offers on screen. A refusal is cached for 60 seconds to avoid immediately repeating the request. Installation requires fresh or revalidated data. Other sources’ offers remain available.

Personalized responses must remain private in intermediary caches. If the service uses `ETag` or `Last-Modified`, its validators account for permissions, restrictions and language. It returns `304` only after checking that the same response is still authorized for this request.

The supplied GitHub registry uses central automation to build the catalogue from `kraftink-extension.json`. The `resources.json` file stays on `dev`, where the **Market validation** workflow checks changes and PRs targeting that branch. Its `repositories` list contains objects such as `{"repository": "author/Plugin-Example", "auto_update": true}`. The `resources` list remains available for manual offers.

The `auto_update` boolean can pause automatic updates while retaining an existing published listing. Refresh Market offers manual scopes: `automatic` for active repositories, `repository` for one registered repository, and `all` for every registered repository. The latter two include paused offers without changing `auto_update`. The `master` branch contains only `README.md` and `catalogue.json`. See [Distribution](extensions-publication.md).
