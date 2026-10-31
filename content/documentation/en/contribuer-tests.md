# Regression tests

Test observable behavior that could break when another part of KraftInk changes: authorization, data preservation, validation, money calculations, imports, extension compatibility, signed updates and recovery.

Use a realistic input and assert the result or persisted state. Reuse an existing scenario when it already covers the risk. Keep fixtures isolated from installed sites, external services and real credentials.

Avoid snapshots of current wording, CSS classes, menu placement, tab counts, private helper shapes or migration file counts. Interface checks are useful when they protect access, escaped content, sensitive values or a usable error flow. A layout or copy edit should not require rewriting unrelated tests.

For example, test that a cyclic category change is rejected without altering existing data. Do not require a particular select element or the current arrangement of its options.

Run the standalone core and script suites from the CMS repository:

```shell
php artisan test --compact --exclude-group=bundled-extensions
node --test tests/Frontend/*.test.mjs tests/Release/*.test.mjs
```

The `bundled-extensions` group covers integration with external plugin and theme sources. Its default package roots point to the workspace `plugins/` and `themes/` directories, so integration fixtures cannot silently mix source classes with installed views. Run `php artisan test --compact` in the complete development workspace to include it. Frontend integration tests skip explicitly when their external package source is absent. Core PR checks do not require those separate projects.

An integration fixture that registers a provider directly must also point the extension root to its source and record an active installation receipt after migrating its isolated database. Default extension permissions are available only for active packages. Refresh the extension and permission catalogue instances when the fixture changes installation state. Keep the normal authorization middleware in place and use the permissions required by the scenario.
