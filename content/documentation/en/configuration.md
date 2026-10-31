# Configure your site

After installation, these settings let the CMS communicate with your hosting and external services. Manage content, menus, roles and visual options directly in the panel.

## Domain, HTTPS and proxy

Set up the domain and its certificate with your host before saving the public URL in the site settings. Use the full address, for example `https://community.example`. This setting does not create a domain or certificate.

The **Network** plugin, bundled and enabled with KraftInk, handles connections passing through a proxy. Open **Plugins**, then **Configure** on Network to choose the mode matching your hosting:

- **Direct connection** when visitors connect directly to the web server.
- **Cloudflare** when requests pass through Cloudflare. Its network list is included in the plugin and maintained through CMS updates. No download or manual refresh is needed.
- **Custom proxy** when your host uses another relay. Ask for its IP addresses or CIDR ranges and add only those.

When Network is disabled, the CMS uses direct connections and ignores information forwarded by proxies. In Cloudflare mode, a connection outside Cloudflare’s networks also keeps the connection’s IP address.

An incorrect setup can affect visitor addresses or HTTPS detection. Behind another proxy that is not trusted, the detected address belongs to the relay. Do not mark every network as trusted to work around a problem.

When changing domains, also update the callback URLs for [external sign-in](oauth.md), payment services and other affected integrations. Set up a redirect from the old domain with your host.

## Send email

Prepare credentials for an SMTP service, separate from your administrator account. In **Email and operation**, enter the host, port, connection mode and credentials supplied by the provider, then a sender address it allows. You can use Sendmail when your host provides it.

Save, send a test email and check its arrival, including the spam folder. If the provider requires SPF or DKIM DNS records, add its exact values with your domain’s DNS provider.

SMTP accepting a message does not guarantee delivery to the recipient’s inbox. If delivery fails, check the credentials, outbound ports allowed by your host and the provider’s logs. Leaving a password field empty preserves its saved secret.

Regular email is sent immediately by default. For deferred messages and automatic tasks, configure the [scheduler](operations.md#scheduler).

## Language and time

The website, installer and administration panel are available in **French, English, Spanish, German and Portuguese**. Choose the primary language in the site settings. You can also allow visitors and members to choose their language.

Choose the site language and time zone in the settings, for example `Europe/Paris`. Scheduled content uses this time zone. Changing it adjusts the display without moving deadlines already saved.

The interface language does not translate your content. When language choice is enabled, the relevant forms offer optional translations for titles, descriptions, labels and presentation text. You do not need to fill in all five languages. Member messages and comments are not translated automatically. After an import, also check dates and text in each language you use.

## Before opening

Test registration and password recovery, then check public and private content with a member account. Enable two-factor authentication for your administrator accounts and keep their recovery codes outside the site.

Install the [extensions you need](extensions-catalogue.md), configure your [game](games.md) and, if needed, [KraftLink](kraftlink.md). Finally, check that you have an [external backup](operations.md#backups).
