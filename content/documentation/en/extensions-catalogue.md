# Plugins and themes

Install extensions from the catalogue or an author’s ZIP in **Plugins**, **Themes** or **Games and identities**. KraftInk also works without an added theme.

## Installing and using an extension

Choose the package, check its displayed requirements and confirm installation. A plugin is enabled after validation. A theme or game module becomes available without changing the current selection.

The public site and panel each have their own theme. **Use** selects a theme for its target. **Default** restores the native appearance of that target. Changing themes keeps settings and content.

For manual installation, use a ready-to-install archive. GitHub “Source code” archives do not always contain the required dependencies and compiled assets.

## Accessing your purchases in the Market

The public KraftInk catalogue works without a key. To install your purchases:

1. Open **My CMS** in your account on the KraftInk website.
2. Create a site key and enter the public IP address your web hosting uses to contact the Market.
3. In the CMS, open **Administration → Market** and save the key in the KraftInk card.
4. Refresh the catalogue. Accessible offers show **Purchased** and can be installed from the CMS.

One IP address is allowed by default. You can change the list every three days. If your host uses several addresses or a dynamic IP, contact KraftInk administration. Replacing the key does not shorten this delay.

For another catalogue that accepts keys, enter its distributor’s key in its own card. If an offer links to an external purchase, follow the author’s link and obtain its archive. Access errors indicate which key or authorisation to check.

The official catalogue is already configured. Adding another source requires your hosting manager to edit `config/market.php`.

## Updating or removing

A catalogue or ZIP update keeps data and activation state. Bundled extensions follow [CMS updates](updates.md).

| Action | Effect |
| --- | --- |
| Disable | Suspends the plugin and keeps its data |
| Uninstall | Deletes the package’s data and settings after confirmation, but keeps its files |
| Delete files | Removes the files of a package that is not installed |

If an extension is suspended, resolve the stated cause, then use **Repair installation** when offered. Copying files alone does not repair installation. Archived packages can be restored from **Removed extensions**.
