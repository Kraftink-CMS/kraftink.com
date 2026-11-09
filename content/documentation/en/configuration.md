# Configuring your site

After installation, check the site address, email delivery and language settings before inviting members.

## Domain and proxy

Configure the domain and its HTTPS certificate with your host, then save the full address in the site settings, such as `https://community.example`.

If you use Cloudflare or another proxy, open **Plugins → Network → Configure**:

| Mode | Use |
| --- | --- |
| Direct connection | Visitors reach the web server directly |
| Cloudflare | The domain uses Cloudflare. Its networks are already included |
| Custom proxy | Add only the IP addresses or CIDR networks provided by your host |

Network is bundled and enabled by default. Disabling it restores direct connections. An incorrect proxy setup can affect visitor addresses and HTTPS detection.

When changing domains, also update the callback addresses for [external sign-in](oauth.md) and [payments](shop-administration.md).

## Sign-in and registration

In **Security and access → Sign-in and registration → General settings**, choose the sign-in mode, password rules, whether to allow new accounts, and how to display the forms. By default, forms open on separate pages and passkeys are allowed.

**Require an email address** is on by default. It reveals **Require a verified email address**, which asks members to confirm their address before accessing the site. When email is optional, members can add an address later under **My account**.

Under **External accounts**, **Allow setting a password** is on by default. It reveals **Require a password at registration**, which is off by default. Turn on the second option to have new members choose a KraftInk password when they sign up with a provider.

When forms open in modal dialogs, password recovery and two-factor authentication can continue there. Links from an email and returns from a sign-in provider open a page. Manage providers and account recovery in the [External connections](oauth.md) tab.

When Minecraft is the active game, its sign-in settings carry a **Minecraft** badge. **In-game sign-in** is disabled by default. Install and link KraftLink on the selected server. On a Velocity network, installing it on the proxy covers the servers on that network. Number confirmation and any remaining registration fields stay on the page or in the dialog already open. [In-game sign-in](games.md#in-game-sign-in)

The **AuthMe integration** is disabled by default. Select the server running both AuthMe and KraftLink. When a player registers in the game with an AuthMe password, KraftInk creates their account with the same username and password. If the site requires an email address, players provide it on their first visit. Subsequent password changes are managed separately.

## Game connection address

In **Game servers**, add the server to show on your website, then use its **Set as primary server** button in the list. The homepage and themes use its address and player count. On a network, this will usually be the proxy that knows the total number of connected players.

The first server added becomes the primary server automatically. Use the **Primary** column to choose another one. Imported servers keep only an explicit primary selection from the source site.

Enter the address without a port, then enter the port in its separate field. Check **Show the port in the connection address** to display, for example, `play.example.org:25566`. Uncheck it to show only `play.example.org`. A standard port is still displayed when the box is checked.

The counter comes only from the primary server through its connection mode. Without a recent measurement, it stays unavailable. Other servers can receive rewards without being displayed or added to the counter. Changing the primary server does not change reward destinations.

Uncheck **Show the online player count** to keep the address without a public player counter. With a status-only mode such as Minecraft Ping, this also stops polling. With RCON or KraftLink, communication and commands remain active.

## Email

In **Email and operation**, enter your provider’s SMTP settings and an authorised sender address. Sendmail is also available when supported by the host.

Save, send a test email and check that it arrives, including in spam. Add any SPF or DKIM DNS records requested by the provider. Leaving a password blank keeps its saved value.

If the test fails, check the credentials, allowed outbound ports and provider logs. For scheduled sends or retries after a failure, configure the [scheduler](operations.md#scheduler).

## Language and times

Choose the site time zone, such as `Europe/Paris`. Publication times are entered in this zone. Changing it changes their display without moving deadlines already saved.

When visitors can choose a language, forms offer optional translations for your content. A missing field falls back to English, then the site language and finally its main value. Disabling the language choice keeps saved translations.

The [SEO guide](seo.md) explains automatic page titles and descriptions and how to customise them.

## Images and media library

In **Content → Media library**, choose **Upload image** to reuse it in pages and news posts. The media library accepts JPEG, PNG, WebP, GIF and AVIF files up to 8 MB by default. Add alternative text describing the image for people who cannot see it.

Media library images are public, even when inserted into restricted content. To limit access, add the image from the content editor and choose the private upload option where available.

KraftInk automatically uses ExifTool or the Imagick PHP extension when available to remove metadata such as camera location from uploaded images. If neither tool can process an image, KraftInk keeps the original file.
