# Manage Minecraft Java skins and capes

On a site configured for Minecraft, install **Skins** from **Plugins**. Members with the **Manage personal skins and capes** permission can open **Skins and capes** after linking a verified Minecraft Java profile.

In the admin panel, open **Extensions → Skins and capes** to allow capes and public sharing. Both options start enabled. Disabling capes hides the files and stops synchronization of signed textures that include a cape. Disabling public sharing closes access to published files. Both settings preserve files and members' sharing choices.

## Store images on the site

Upload a 64 × 64 or 64 × 32 pixel PNG skin and choose the classic or slim model. For a cape, upload a 64 × 32 or 22 × 17 pixel PNG. Each image can be up to 32 KiB.

Files are private by default. Turn on **Publish the uploaded files** to allow anyone with the URL to view them. Clear the option to close access again. You can remove either file separately.

## Synchronize with the game

Install [KraftLink](kraftlink.md) and SkinsRestorer on a compatible Bukkit server, then link the server to the site. Once the server appears under **In-game textures**, choose an action and join it with your verified Java profile. Requests remain queued until processed or expire after 24 hours.

- **Read the current in-game texture** saves the signed property from the server. It can include a cape.
- **Apply the uploaded skin** sends your PNG through KraftLink. SkinsRestorer uses its generation service to obtain a signed Minecraft skin. The wait depends on that service.
- **Apply the saved signed textures** applies the last saved signed property, including its cape if present.
- **Restore the default in-game texture** clears the selection managed by KraftLink and lets SkinsRestorer resolve the player profile.

An uploaded PNG cape stays on the site. Minecraft can show a cape already present in a signed property. This setting does not change Microsoft account cape ownership.
