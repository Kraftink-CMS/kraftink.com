# Importing an existing site

**Administration → Imports** reads supported data from KraftInk, Azuriom or historical MineWeb. The installer report lists available conversions and data that will only be archived.

## Preparing and running the import

1. Back up the old site’s database and files. Test on a copy before the final transfer.
2. Prepare read-only access to its database or SQLite file, separate from the destination. Restore a `.sql` export into a separate database first.
3. Start analysis. The wizard can install available, compatible KraftInk equivalents of the source extensions.
4. Check counts, account matches and data that cannot be converted before confirming.

**Add to existing content** keeps the destination. **Replace convertible content** backs up and replaces the selected domains. Local accounts and installation settings are kept. Shop and Vote merge their histories.

For the final transfer, put the old site into maintenance to stop registrations, purchases and messages during copying. Repeat analysis if the source has changed.

## MineWeb and Azuriom data

Reference formats are MineWeb **1.15.2** and Azuriom **1.2.13** with their official plugins. Forks, third-party extensions and NewMinewebCMS may need a suitable converter.

| Domain | Planned conversion |
| --- | --- |
| Accounts | Names, emails, ranks, identities, dates, representable balances and bcrypt or Argon2 passwords |
| Site | Compatible public settings, pages, news, menus and social links |
| Wiki, FAQ and Staff | Categories, content, order and compatible restrictions. Staff applies to MineWeb |
| Support | Tickets, messages, categories, assignments and compatible states |
| Forum | Categories, topics, posts and representable access rules, Azuriom polls. MineWeb private messages stay archived |
| Vote | Representable directories, votes, rewards and rankings without new distribution |
| Shop | Catalogue, coupons, gift cards and supported financial history. Subscriptions require reconciliation with the provider |

Content arrives as drafts, hidden or disabled for review. Ranks do not automatically receive the old administration privileges. Data without an equivalent stays in the private archive.

## Files and access to restore

Reading the database does not transfer files. In particular, keep:

| Source | Usual directories |
| --- | --- |
| MineWeb | `app/webroot/img/uploads/`, `app/webroot/files/` and any skin or cape directories in use |
| Azuriom | `storage/app/public/` and `storage/app/shop/packages/` for sold files |

Include external or custom storage. Upload public images to the media library and restricted files to their private area, then attach them to content. Copying an old directory does not recreate these associations.

Reconfigure SMTP, OAuth, payment and game connection secrets. Some members will need to reset their passwords. Protected or locked accounts require verification before reopening.

## Checking the result

Open **View report** to find outstanding items and download the JSON report. Check accounts, permissions, amounts, links and images before publishing content. Old commands, rewards and payments are not replayed.

An interrupted import can resume from the panel. Keep `.env` and the private archives in `storage/app/private/imports/` until the transfer is approved.
