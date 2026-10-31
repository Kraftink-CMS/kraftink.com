# Install plugins and themes

KraftInk works with its native presentation. Add the extensions your community needs from **Plugins**, **Themes** or **Games and identities**.

## Install a package

1. Choose an extension in the catalogue or upload the ZIP supplied by its author.
2. Check compatibility with your KraftInk version and any required dependencies.
3. Confirm installation and wait for the operation to finish.
4. Open the plugin settings, or choose to use the installed theme or game module.

A new plugin is enabled automatically after a successful installation. Installing a theme or game module makes it available without changing the site’s current theme or game.

Files present on disk do not mean a package is installed. The panel prepares its data and checks that it can start. GitHub “Source code” archives do not necessarily contain a package ready to install.

Paid offers can be installed from the catalogue when your key grants access to their download. If an offer directs you to an external distributor, obtain the archive there before returning to the panel. Only install code from an author you trust.

## Choose a theme

The public website and administration panel each have their own theme. Check the package’s target, then choose **Use**. **Default** restores the native presentation separately for each interface. Switching themes preserves accounts and content.

**Configure**, when available, opens the theme’s settings. Afterwards, check your important pages on desktop and mobile.

## Update or repair

Back up the site and read the author’s changes before updating. The catalogue or a new archive prepares the operation. The CMS checks requirements, creates a backup and preserves the package’s enabled or disabled state.

If an extension is suspended, read the reason before enabling it again. Fix compatibility or restore its files, then use **Repair installation** when offered. Changing a state file or copying arbitrary files does not repair its data.

Modules bundled with KraftInk follow [CMS updates](updates.md). They cannot be replaced with a third-party archive. For an interrupted operation, follow the [recovery guide](operations.md).

The bundled **Network** plugin is enabled by default. Its **Configure** button lets you choose Cloudflare, a custom proxy or a direct connection. Disabling it restores direct connections. Its Cloudflare networks are maintained with the CMS, without a manual refresh. Read the [network configuration guide](configuration.md#domain-https-and-proxy) before changing this setting.

## Remove an extension

Disabling a plugin or selecting another theme preserves its data. **Uninstall** permanently deletes its data and settings after confirmation. Its files remain available. **Delete files** applies to a package that is not installed. Check the consequences shown and keep a backup before deleting anything.

For an older extension listed under **Retired extensions**, restore its copy there before reusing it. A package required by another extension must remain available while that dependency exists.

## Add a catalogue

The official catalogue is already configured. Your hosting administrator can declare another source in `config/market.php`, with its name, URL and whether it supports site keys. Choose a trusted distributor. A catalogue address does not guarantee the quality of its extensions.

## Configure Market access

Under **Administration → Market**, every configured catalogue has its own card. In the relevant catalogue’s card, enter the **Site key** supplied by its distributor if it accepts keys. Save, then refresh the catalogue. The key is stored encrypted and only its status appears after saving. Use **Replace** to enter a new key or **Remove** to delete it after confirmation. A public source without key support does not show this field.

The public catalogue works without a key. A source may reserve offers for the linked account’s purchases or restrict private access to certain IP addresses. When access or a download is denied, the panel shows a reason translated by the CMS into your language. An unknown code produces a generic reason. Remote error text is not displayed. Correct the key or the indicated permissions before refreshing.

Listings retain their own languages for names, descriptions and images. These contents come from each package and remain separate from interface messages.

Downloads and updates can come directly from the distributor’s website without a Git repository. The key and permissions are checked during download, then the CMS checks the archive before preparing installation.

Each source has its own access. Its key is sent neither to other catalogues nor to external distribution domains. To supply a catalogue, read the [Market contract](market-contract.md).

To create your own packages, see the [plugin](developpement-plugins.md) and [theme](developpement-themes.md) guides.

## Connect KraftInk purchases

The KraftInk catalogue is configured by default and combines community resources with offers sold on the website. Resources sold on KraftInk link to their purchase page. External offers keep the purchase or contact link supplied by their author.

In your KraftInk account, open **My CMS**, create a site key and enter the public IP address used by your web server. Copy the key into the CMS under **Administration → Market**, then refresh the catalogue. An accessible resource displays **Purchased**. An incorrect key or IP keeps public listings visible without revealing the account’s purchases.

One IP address is allowed by default. A KraftInk administrator can increase your account’s address limit or grant an exemption for a dynamic IP. The address list can be changed once every three days. Replacing the key does not reset this waiting period. Resources purchased on KraftInk are installed from the CMS, without ZIP downloads in the website’s buyer area.
