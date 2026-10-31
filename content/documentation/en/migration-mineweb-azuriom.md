# Migrate MineWeb or Azuriom

The [import workflow](migration.md) converts recognized data from historical MineWeb and Azuriom into KraftInk domains. Verified reference schemas are MineWeb 1.15.2 and Azuriom 1.2.13 with their official plugins. Forks, third-party plugins and other versions may need adaptation. The NewMinewebCMS rewrite uses a different format.

## Converted data

| Domain | Conversion and limitations |
| --- | --- |
| Accounts | Usernames, emails, roles, game identities, dates, representable balances and bcrypt or Argon2 hashes. Other hashes require a password reset. Active bans and 2FA protections keep accounts locked even when their tables are not selected for conversion. Preserved local accounts retain access, balances and profiles. |
| Site | Name, description, language, timezone and compatible public settings. Terms, menus and submenus, social links and slider text are converted when stored in the database. MineWeb SEO is associated with recognized pages. Slider files, logos and covers need to be attached separately. |
| Wiki and FAQ | Categories, hierarchy, pages, questions, answers and ordering. Azuriom Wiki category restrictions use the converted roles. Unrecognized restrictions stay closed for review. |
| Staff | MineWeb entries become KraftInk directory members with representable ranks, ordering and social links. No official Azuriom Staff plugin exists within the verified scope. Third-party plugins require their own converter. |
| Support | Categories, tickets, messages, open or closed states, assignees and compatible fields. Ordinary MineWeb replies remain visible to the ticket member. Azuriom Markdown is rendered. Unsupported fields and attachments are reported. |
| Forum | Categories and subforums, discussions, posts, Markdown or BBCode, representable access rules, MineWeb groups, profiles, tags, positive reactions and reports. Azuriom polls and votes are converted. MineWeb private messages, sanctions and features without an equivalent domain remain archived. |
| Vote | Sites, delays, compatible public options, member votes and MineWeb guest votes, representable rewards and monthly rankings. Historical claims stay processed or cancelled without issuing another reward. Server choices and delivery modes without an exact equivalent are reported. |
| Shop | Categories, sections, hierarchy, products, prices, currencies, compatible variables, commands and roles. Coupons, scopes, historical usage, gift cards and reliable financial history are converted. Purchases without an actual paid amount stay archived. Subscriptions require reconciliation with their provider. |

Plugin settings belong to their converters. An option without an active equivalent is reported with its source reference. Original data from converted tables also remains in the private archive.

## Review before enabling

Content starts as drafts. Menus, social links, products, coupons, gift cards, voting sites and rewards stay disabled pending review. Forums and posts stay hidden for review. Roles do not automatically receive the old CMS administrative privileges. Check their permissions in KraftInk.

Compatible access rules are preserved without widening private access. An unselected or unrecognized role relationship stays restrictive. Also check with an account that must not have access.

Historical payments keep known currencies and amounts without triggering charges, refunds, wallet credits or deliveries. MineWeb points and Azuriom site money do not automatically represent real currency. Check units before enabling purchases or rewards. A purchase without evidence of the paid amount is not reconstructed using current catalogue prices.

OAuth, SMTP, callback, payment provider and game bridge secrets are not activated from the source. Compatible public SMTP parameters may be prepared on a destination without an existing mail configuration, with sending disabled. Reconnect and test services from the destination. KraftInk installation connections, keys and URLs remain those of the destination.

## Install available equivalents

The assistant detects plugins from their tables and package import declarations. It can install or enable compatible local packages and free catalogue equivalents. Purchases, packages requiring manual acquisition, incompatible versions and ambiguous matches are not installed automatically. Unavailable items are listed.

A source theme can be replaced by its available KraftInk equivalent. Installing a theme does not translate the old theme’s PHP, CSS files or arbitrary settings. Recreate options without an equivalent in its KraftInk configuration. Unknown plugin data stays archived and does not become active merely because a package has a similar name.

## Back up and attach files

| Source | Common locations to back up |
| --- | --- |
| Historical MineWeb | `app/webroot/img/uploads/`, including `slider/` and `favicons/`. Retain `app/webroot/files/` if used. Skins and capes may be in `app/webroot/skins/` and `app/webroot/skins/capes/` or custom directories. Wiki thumbnails and shop images may point to external hosting. |
| Azuriom | All of `storage/app/public/`, including plugin images and attachments. `public/storage` is normally a link to this directory. Shop downloads are stored separately, by default in `storage/app/shop/packages/`, and must remain private. |

These locations follow the official [MineWeb](https://github.com/MineWeb/MineWebCMS/tree/95e801819672475c4b7d7aa4cde818489ea5fe92/app/webroot), [Azuriom](https://github.com/Azuriom/Azuriom/blob/v1.2.13/config/filesystems.php) and [Azuriom Shop](https://github.com/Azuriom/Plugin-Shop/blob/master/src/Models/Concerns/ManageFiles.php) sources. With S3, remote or custom storage, back up the actual files from the configured disk. Also retain third-party extension directories.

The report lists file references in recognized data. It is not an inventory of the source disk. Upload public images through the media library, confidential images through the relevant content editor and attachments through their private areas. Reassociate covers, avatars, products and content through their forms.

Copying a directory to the same path does not create KraftInk relationships or access protection. Old local references are neutralized to avoid pointing to unrelated destination resource IDs. Preserved external links may still depend on the old hosting. Check internal links, redirects and files before closing the old site.
