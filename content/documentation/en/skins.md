# Manage Minecraft Java skins and capes

On a site configured for Minecraft, install **Skins** from **Plugins**. Members need a verified Minecraft Java profile and the **Manage personal skins and capes** permission. Uploading also requires **Upload skins and capes**.

## Configure the website

Open **Extensions → Skins and capes** in the admin panel. Each section saves separately.

- **Website textures** controls capes and publication of new PNGs. Capes start enabled and new files start private. Enable publication when a launcher or external website needs to read PNGs without signing in. Only files uploaded while the option is active are published. Turning publication off blocks public access to those files while the option remains off.
- **Default website skin** lets you upload a PNG, choose its model and turn on the fallback. Public requests for a missing or private skin then use this default. To remove the stored PNG, turn off the fallback and select **Remove the stored skin** before saving.
- **In-game application** controls synchronization separately. It starts enabled. Turning it off pauses synchronization while members can still manage their website files. Servers retain textures already applied.

PHP GD is required to generate face and body images. With GD available, choose **Published skin face** (`skins`) under **Settings → Avatars** to use the face of a public skin. The configured default can supply the face when no public skin is available.

## Configure a game server

1. Enable the Minecraft server in KraftInk and choose **KraftLink** as its connection. Generate a token and enter it with the website URL in the server plugin. [Set up KraftLink](kraftlink.md)
2. Install KraftLink for Bukkit and SkinsRestorer on the same Bukkit-compatible server and restart it.
3. Open **Server compatibility** in the Skins settings. Follow the next step listed for the server. **Waiting for SkinsRestorer** means Bukkit reported but the integration has yet to check in. **Integration confirmed** appears after the integration contacts the site.
4. Allow **Automatic application** for the servers you choose. Each server starts without this permission. The connection status remains visible when automatic application is turned off.

SkinsRestorer sends skin PNGs to MineSkin for signing. Set `api.mineskinSecretSkins: true` in SkinsRestorer to keep generated skins out of the MineSkin gallery. Signed texture URLs remain accessible. [MineSkin settings](https://skinsrestorer.net/docs/integrations/mineskin)

## Save and apply textures

Open the **Skins and capes** section of your **Profile**. Upload a PNG skin of 64 × 64 or 64 × 32 pixels and choose the classic or slim model. For a cape, upload a PNG of 64 × 32 or 22 × 17 pixels. Each file can be up to 32 KiB. Use the preview to check the texture before saving.

The form explains whether new files stay private or are published under the site's settings. Under each saved file, the profile shows its status and gives you its link if the file is public. Anyone with that link can open the image. Each file can be removed separately.

When you save a new skin or change its model, it applies automatically on servers allowed by an administrator. Join with your verified Java profile. Cape PNGs are for the website and compatible launchers.

Remove the saved skin to return to the appearance SkinsRestorer provides on the server. When you are online, KraftLink clears its own skin selection if it is still active. Server settings are managed in the admin panel.

## Read published textures

Use the player’s Java UUID, Minecraft username or `id-<CMS user ID>` as `{player}`. For example, use `id-42` for CMS user 42.

| Request | Response |
| --- | --- |
| `GET /api/skins/profiles/{player}` | JSON with `skin` and `cape` metadata. Available skin metadata includes the model and a `default` flag. |
| `GET /api/skins/profiles/{player}/textures/{kind}.png` | PNG for `skin` or `cape`. |
| `GET /api/skins/profiles/{player}/renders/{view}.png` | Rendered PNG for `face`, `body` or `combo`. Requires PHP GD. |

Public requests use shared files. When a skin is private or absent, the API can return the configured default skin. A missing cape returns 404 at its image URL. The profile request returns 404 when neither texture is available.

## Connect a launcher

Enable **Application connections** in KraftInk and use an up-to-date CMS. Send a member’s `Authorization: Bearer <token>` header with these requests. [Authenticate an application](auth-api.md)

| Request | Required scopes | Response |
| --- | --- | --- |
| `GET /api/skins/me/profile` | `skins:read` | Verified Java UUID and the member’s texture metadata, including private files. |
| `GET /api/skins/me/textures/{kind}.png` | `skins:read` | The member’s `skin` or `cape` PNG. |
| `POST /api/skins/me/textures/{kind}` | `skins:write` | Stores the PNG and returns 204. |
| `GET /api/auth/me` | `profile:read` and `skins:read` | Includes Skins metadata in `data.user.extensions.skins` for members with a verified Java profile and permission to use Skins. |

Send uploads as `multipart/form-data`. Use the `skin` field for `/textures/skin` or `cape` for `/textures/cape`. When uploading a skin, you can also send `variant` as `classic` or `slim`. The same dimensions, file limits and publication setting apply as on the website.
