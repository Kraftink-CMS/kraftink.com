# Handle personal data

An extension retaining personal data must participate in account export and anonymization, including while disabled.

## Declare the handler

In `manifest.json`:

```json
"privacy": "Vendor\\Package\\Services\\Privacy"
```

The service lives in `src/Services/Privacy.php`, under the package's namespace. It implements `App\Kraft\Extensions\Contracts\PrivacyHandler`:

```php
public function export(\App\Events\ExportingPersonalData $event): void;
public function anonymize(\App\Events\AccountDeleting $event): void;
```

The CMS loads only this class without booting the provider, routes or migrations. The manifest is the entry point. Do not register a second provider listener. If your tables were never installed, the handler does nothing.

## Export

Add data under the package identifier key in `$event->data`. Select only the member’s own data and apply their current permissions to private content. Do not replace core keys.

Lazy collections are supported. The CMS prepares exports before sending them and aborts on cursor errors or limits from `config/privacy.php`. Do not expose secrets, storage paths, internal notes or other members’ data.

## Anonymization

The handler runs inside the global account transaction: errors roll back all database writes. Defer physical file deletion until commit. Preserve files still referenced and records needed for history while removing their personal content.

Handle previous revisions as well: they must not restore data erased for privacy. For [private editor images](ui-contributions.md#editeurs-et-images-privees), call `anonymizeUser($id)`.

Failure to load an affected package interrupts the request. It must not be interpreted as absence of data.

## Verify behavior

Test exports with restricted permissions, references to other accounts, missing tables, a disabled extension and complete rollback after an error. Fixtures use isolated accounts and files.
