# SEO and sharing

In the admin panel, open **Appearance → Search engine optimisation** to customise the titles, descriptions and images used when your pages appear in search results or are shared.

## Automatic values

The initial `{title} - {website_name}` pattern combines the page title and site name. Descriptions use the summary, then a content excerpt if it is empty, then the site description. Sharing images use the public cover, general image or logo.

For pages and news, the editor preview follows your input without saving the draft.

## Customising patterns

Under **General**, set the default title structure, description pattern and sharing image. To customise the home page, a listing or a specific page, open **Pages**, choose a site page and click **Show**.

| Setting | Example for a site named “Eden” |
| --- | --- |
| Base title `The shop`, inherited structure | `The shop - Eden` |
| Custom structure `{title}` | `The shop` |
| Custom structure `{website_name}: {title}` | `Eden: The shop` |

An empty structure field inherits the general pattern. These settings change the title sent to search engines without changing the visible page heading.

Patterns accept `{title}`, `{description}`, `{website_name}`, `{site_description}`, `{url}`, `{path}`, `{locale}`, `{year}` and `{page}`. Page and news details also offer `{summary}` and `{excerpt}`. Plugins may provide additional variables shown in the panel.

A custom description follows its pattern without automatic fallback. With `{summary}`, an empty summary produces an empty description. Clear the override to restore automatic behaviour.

## Indexing

`index,follow` allows indexing. `noindex,follow` or `noindex,nofollow` requests exclusion and removes the page from the sitemap. Administration, account pages and native private content remain excluded.

The sitemap is at `/sitemap.xml` and crawler instructions at `/robots.txt`. An SEO rule does not protect access to private content. Search engines pick up changes during later crawls.
