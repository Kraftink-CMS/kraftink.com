# Import an existing site

The assistant under **Administration → Imports** can read a KraftInk, Azuriom or historical MineWeb source. Its report shows what your site can actually import. A CMS or plugin name does not guarantee a complete transfer.

See [Migrate MineWeb or Azuriom](migration-mineweb-azuriom.md) for plugin coverage and source file locations.

## Prepare the transfer

1. Back up the old site’s database **and files**. Run a first trial on a copy.
2. Prepare read-only access to its MySQL/MariaDB or PostgreSQL database, or its SQLite file. The source must be separate from KraftInk’s database.
3. If you only have a `.sql` export, restore it into a separate source database. The panel does not accept SQL dumps directly.
4. Let the assistant install and enable available matching KraftInk extensions, or install them beforehand. Free catalogue equivalents use the standard compatibility and integrity checks. A matching theme can also be selected. Unavailable extensions are listed.
5. Put the old site into maintenance for the final transfer to avoid new purchases, messages or registrations during the copy.

## Read the report before confirming

Analysis does not convert data yet. When automatic installation is selected, it also prepares matching extensions. Check the counts, dependencies between data and items that cannot be converted. If the source changes after analysis, run it again.

After conversion, open **View the report** in recent imports. It separates converted rows from items kept only in the archive and lists files or rules to restore with their source table and identifier. You can download the JSON report. An available converter does not guarantee an equivalent for every column.

**Add to existing content** keeps destination content and adds converted items. **Replace convertible content** backs up and replaces only the areas selected in the preview. Replacement preserves local accounts and installation settings. Shop’s financial history and Vote data are always merged.

For accounts already present, check matches by email or game identity and choose to preserve their local access. Resolve ambiguous matches before continuing.

## Transfer missing items

Reading the database does not copy files. Keep images, avatars, downloadable products and attachments from the old hosting. Upload them to KraftInk and attach them to the appropriate content, using private storage for restricted files.

Secrets, external sign-in connections and two-factor protections do not automatically become usable. Some imported accounts will need to reset their passwords. Verify the owner of a protected or locked account before unlocking it.

Old rewards and deliveries are not replayed. Handle payment services, subscriptions, pending deliveries and settings that cannot be converted separately.

## Check and open

Compare accounts, amounts and counts with the original site. Test links, images, sign-in and permissions as a visitor and then as a member. Reconfigure access to private areas before publishing them.

Resume an interrupted import from the panel. Keep `.env`, its key and the private archives in `storage/app/private/imports/` until the result is verified. They may contain personal data and must not be made public. Keep a complete backup of the original site even after a successful import.
