# Configurable widgets

A widget is a block the owner places and configures in **Presentation → Widgets**. The native home page offers the `home` zone. Multiple instances of one widget can have different settings.

## Defining a widget

From the provider’s `boot()` method:

```php
app(\App\Kraft\Widgets\WidgetRegistry::class)->register(
    owner: 'example',
    id: 'latest-documents',
    label: 'example::widgets.latest_documents',
    render: function (array $context, array $config) {
        $documents = app(PublicDocuments::class)
            ->visibleTo($context['user'])
            ->forLocale($context['locale'])
            ->latest('published_at')
            ->limit($config['limit'])
            ->get();

        return view('example::widgets.latest-documents', compact('documents'));
    },
    fields: [
        'limit' => [
            'type' => 'integer',
            'label' => 'example::widgets.limit',
            'min' => 1,
            'max' => 20,
            'default' => 5,
        ],
    ],
    permission: 'example.view',
    zones: ['home'],
);
```

`owner` is the package identifier and the public key becomes `example:latest-documents`. `render` accepts a view or callback returning a view, HTML or an empty string. Registration performs no SQL queries, data is read at render time.

Context provides `user`, `locale` and `instance`. The callback filters content by publication, language and access. Other context values are not proof of authorisation.

## Configuration fields

The registry accepts up to twenty scalar fields with stable identifiers and translated `label` values. `help` is an optional help key.

| Type | Options |
| --- | --- |
| `integer` | `min`, `max`, `default`. Initial bounds are 1 to 100 |
| `text` | `max`, `default`. 255 characters by default, up to 1,000 |
| `boolean` | `default`, initially false |
| `choice` | `options` mapping values to translation keys, `default` |

The `defaults` argument can override initial field values. Old configurations are also validated before rendering. Keep compatible defaults when changing your definition.

## Adding a zone

Declare the zone before registering widgets for it:

```php
app(\App\Kraft\Widgets\WidgetRegistry::class)->zone(
    'community.sidebar',
    'my-theme::messages.sidebar',
);
```

Then render it in the view:

```blade
<x-widgets.zone name="community.sidebar" :context="['entry' => $entry]" />
```

The component produces a Bootstrap grid with the selected widths. Use [slots](ui-contributions.md#menus-and-blocks) for fixed contributions that owners should not move.

An unavailable widget does not run and keeps its configuration. A failed render does not stop other blocks. Widgets stay read-only, actions use their routes and permissions.
