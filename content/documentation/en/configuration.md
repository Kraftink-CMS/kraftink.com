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

## Email

In **Email and operation**, enter your provider’s SMTP settings and an authorised sender address. Sendmail is also available when supported by the host.

Save, send a test email and check that it arrives, including in spam. Add any SPF or DKIM DNS records requested by the provider. Leaving a password blank keeps its saved value.

If the test fails, check the credentials, allowed outbound ports and provider logs. For scheduled sends or retries after a failure, configure the [scheduler](operations.md#scheduler).

## Language and times

Choose the site time zone, such as `Europe/Paris`. Publication times are entered in this zone. Changing it changes their display without moving deadlines already saved.

When visitors can choose a language, forms offer optional translations for your content. A missing field falls back to English, then the site language and finally its main value. Disabling the language choice keeps saved translations.

The [SEO guide](seo.md) explains automatic page titles and descriptions and how to customise them.
