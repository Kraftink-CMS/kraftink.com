# Manage Minecraft Java skins and capes

On a site configured for Minecraft, install **Skins** from **Plugins**. Members need a verified Minecraft Java profile and the **Manage personal skins and capes** permission. Uploading also requires **Upload skins and capes**.

## Configure the website

Open **Extensions → Skins and capes** in the admin panel. Each section saves separately.

- In **Website textures**, **Allow custom skins** and **Allow custom capes** start enabled. Turn off a type to suspend uploads, previews and access to those files on the website and in launchers. Existing files stay saved, and their owners can remove them from their profile.
- **Publish new uploads** makes future PNGs available to anyone with the link. Files are private by default. Turning publication on keeps existing private files private. Turning it off also pauses public access to previously published files.
- **Default website skin** lets you upload a PNG, choose its model and turn on the fallback. This skin stays available when custom skins are disabled. It is reserved for previews, website avatars and compatible launchers. To remove its PNG, turn off the fallback and select **Remove the stored skin** before saving.
- **In-game application** starts enabled. Turn it off to pause synchronization and retain skins already applied on the servers. While synchronization is active, turning off custom skins suspends new applications. KraftLink then clears the skin it manages the next time it checks in while the player is online.

PHP GD is required to generate face and body images. With GD available, choose **Published skin face** (`skins`) under **Settings → Avatars** to use the face of a public skin. The configured default can supply the face when no public skin is available.

## Configure a game server

1. Enable the Minecraft server in KraftInk and choose **KraftLink** as its connection. Generate a token and enter it with the website URL in the server plugin. [Set up KraftLink](kraftlink.md)
2. Install KraftLink for Bukkit and SkinsRestorer on the same Bukkit-compatible server and restart it.
3. Open **Server compatibility** in the Skins settings. Follow the next step listed for the server. **Waiting for SkinsRestorer** means Bukkit reported but the integration has yet to check in. **Integration confirmed** appears after the integration contacts the site.
4. Allow **Automatic application** for the servers you choose. Each server starts without this permission. The connection status remains visible when automatic application is turned off.

SkinsRestorer sends skin PNGs to MineSkin for signing. Set `api.mineskinSecretSkins: true` in SkinsRestorer to keep generated skins out of the MineSkin gallery. Signed texture URLs remain accessible. [MineSkin settings](https://skinsrestorer.net/docs/integrations/mineskin)

## Save and apply textures

Open the **Skins and capes** section of your **Profile**. Upload a PNG skin of 64 × 64 or 64 × 32 pixels and choose the classic or slim model. For a cape, upload a PNG of 64 × 32 or 22 × 17 pixels. Each file can be up to 32 KiB. Use the preview to check the texture before saving.

Under each saved file of an allowed type, the profile shows its status and provides a link if the file is publicly accessible. The note at the bottom of the form explains the site's privacy settings. You can remove the skin and cape separately.

When you save a new skin or change its model, it applies automatically if custom skins are allowed and the server participates in synchronization. Join with your verified Java profile. Cape PNGs are for the website and compatible launchers.

Remove the saved skin to return to the appearance SkinsRestorer provides on the server. When you are online, KraftLink clears its own skin selection if it is still active. Server settings are managed in the admin panel.

## Read published textures

Use the player’s Java UUID, Minecraft username or `id-<CMS user ID>` as `{player}`. For example, use `id-42` for CMS user 42.

| Request | Response |
| --- | --- |
| `GET /api/skins/profiles/{player}` | JSON with `skin` and `cape` metadata. Available skin metadata includes the model and a `default` flag. |
| `GET /api/skins/profiles/{player}/textures/{kind}.png` | PNG for `skin` or `cape`. |
| `GET /api/skins/profiles/{player}/renders/{view}.png` | Rendered PNG for `face`, `body` or `combo`. Requires PHP GD. |

Public requests use shared files of allowed types. When a skin is private, missing or disabled, the API can return the configured default skin. The image URL for an unavailable cape returns 404. The profile request returns 404 when neither texture is available.

## Connect a launcher

Enable **Application connections** in KraftInk and use an up-to-date CMS. Send a member’s `Authorization: Bearer <token>` header with these requests. [Authenticate an application](auth-api.md)

| Request | Required scopes | Response |
| --- | --- | --- |
| `GET /api/skins/me/profile` | `skins:read` | Verified Java UUID and the member’s texture metadata, including private files. |
| `GET /api/skins/me/textures/{kind}.png` | `skins:read` | The member’s `skin` or `cape` PNG. |
| `POST /api/skins/me/textures/{kind}` | `skins:write` | Stores the PNG and returns 204. |
| `GET /api/auth/me` | `profile:read` and `skins:read` | Includes Skins metadata in `data.user.extensions.skins` for members with a verified Java profile and permission to use Skins. |

Send uploads as `multipart/form-data`. Use the `skin` field for `/textures/skin` or `cape` for `/textures/cape`. When uploading a skin, you can also send `variant` as `classic` or `slim`. The same dimensions, file limits and publication setting apply as on the website. For a disabled type, uploads return 404 and personal reads hide the member's file. A skin request can return the fallback skin.
