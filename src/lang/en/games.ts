import type { GameCopy } from '../../lib/translations';

export default {
    highlightsTitle: 'Server integration',
    setupTitle: 'Connect your server',
    guideLink: 'Read the connection guide',
    installationLink: 'Install KraftInk',
    backLink: 'All supported games',
    pluginsTitle: 'Official plugins',
    pluginNames: {
        shop: 'Shop',
        vote: 'Vote',
        forum: 'Forum',
        wiki: 'Wiki',
        support: 'Support',
        stats: 'Statistics',
        skins: 'Skins and capes',
    },
    pages: {
        minecraft: {
            title: 'CMS for Minecraft Java servers',
            description:
                'Connect your Minecraft Java website to Paper, Velocity or a modded server. Link Minecraft accounts and deliver in-game rewards through KraftLink.',
            intro: 'Give your survival group, minigame network or modded server one address where players can find the rules, announcements and connection details.',
            highlights: ['Microsoft account linking', 'Geyser and Floodgate support', 'KraftLink, ping and RCON'],
            features: [
                {
                    title: 'Verify Java and Bedrock accounts',
                    description:
                        'Java players link their Microsoft account. Players who join through Geyser can confirm their identity in game on a compatible server with Floodgate and KraftLink.',
                },
                {
                    title: 'Connect a proxy and its servers',
                    description:
                        'Create one connection for Velocity and one for each server that uses KraftLink. A command intended for Paper then reaches the right instance.',
                },
                {
                    title: 'Deliver a reward when a player joins',
                    description:
                        'With a compatible extension, choose which server gets the reward command. KraftLink can wait for the player to join that server before running it.',
                },
            ],
            setup: 'Select Minecraft in Games and identities. Choose the game ping for public status, RCON for console commands or KraftLink for commands and player presence.',
            plugins: [
                {
                    slug: 'shop',
                    description:
                        'Sell an in-game rank and deliver it through KraftLink when your server provides the command to grant it.',
                },
                {
                    slug: 'vote',
                    description:
                        'Verify votes on supported Minecraft server lists and reward players when they reach a milestone.',
                },
                {
                    slug: 'skins',
                    description:
                        'Players who verify their Java account can customize their skin and cape from their profile.',
                },
            ],
        },
        minecraftbedrock: {
            title: 'CMS for Minecraft Bedrock servers',
            description:
                'Display your Minecraft Bedrock server status on your site. On Cloudburst Nukkit, KraftLink verifies Xbox gamertags and sends in-game commands.',
            intro: 'Show players the address and port for your Bedrock world. On a Nukkit server connected with KraftLink, they can also link their Xbox gamertag in game.',
            highlights: ['Bedrock UDP ping', 'Cloudburst Nukkit connector', 'Xbox gamertag verification'],
            features: [
                {
                    title: 'Show Bedrock Dedicated Server status',
                    description:
                        'The native UDP ping shows the server status and player count. Enter the game port from your Bedrock Dedicated Server configuration.',
                },
                {
                    title: 'Verify a gamertag on Nukkit',
                    description:
                        'Enable Xbox authentication on Cloudburst Nukkit and connect it with KraftLink. Players enter a verification code in game and confirm the detected gamertag on your site.',
                },
                {
                    title: 'Send a command to a Nukkit player',
                    description:
                        'KraftLink can wait for a player to join and use their gamertag in the command, even when it contains spaces.',
                },
            ],
            setup: 'Choose Minecraft Bedrock in Games and identities. Use Ping mode for a Bedrock Dedicated Server or create a KraftLink connection for Cloudburst Nukkit.',
            plugins: [
                {
                    slug: 'shop',
                    description:
                        'Offer a supporter rank on the site for members who want to contribute to your Bedrock server.',
                },
                {
                    slug: 'forum',
                    description: 'Run a poll to decide what your group should build next in your Bedrock world.',
                },
            ],
        },
        hytale: {
            title: 'CMS for Hytale servers',
            description:
                'Introduce your Hytale world and display server status through KraftLink. Members can enter their Hytale profile, with optional PlayerDB lookup by username or UUID.',
            intro: 'Show newcomers what you’re building in Hytale. Publish a page with joining instructions, then use announcements to share the opening date and updates to your world.',
            highlights: ['Hytale player profiles', 'Optional public profile lookup', 'KraftLink connector'],
            features: [
                {
                    title: 'Find Hytale profiles',
                    description:
                        'Members enter their Hytale identity on your site. If you enable PlayerDB, the public lookup can find a profile by username or UUID.',
                },
                {
                    title: 'Connect your Hytale server',
                    description:
                        'KraftLink reports server status and player presence. You can also send commands from the panel when your connector configuration allows them.',
                },
            ],
            setup: 'Select Hytale in Games and identities, then create a KraftLink server connection. Install the compatible connector in your server’s mods directory and configure it with the site URL and connection token.',
            plugins: [
                {
                    slug: 'vote',
                    description:
                        'Connect your Hytale Servers listing to verify votes and reward members who support your server.',
                },
                {
                    slug: 'wiki',
                    description: 'Publish getting-started guides and rules for each world on pages players can search.',
                },
            ],
        },
        garrysmod: {
            title: 'CMS for Garry’s Mod (GMod) servers',
            description:
                'Publish your DarkRP rules and Workshop collection on your GMod server website. Link Steam accounts and connect Garry’s Mod through A2S or Source RCON.',
            intro: 'Show players what to download before they join your GMod server. If you run DarkRP, give them a place to read the rules, see the available jobs and learn how to apply for staff.',
            highlights: ['Steam OpenID', 'A2S status and player count', 'Source RCON commands'],
            features: [
                {
                    title: 'Prepare players for their first connection',
                    description:
                        'Put the server address, maps and Workshop collection on one page so players know which addons to install before launching Garry’s Mod.',
                },
                {
                    title: 'Identify members by their Steam accounts',
                    description:
                        'Enable Steam OpenID so players can link a verified Steam account to their KraftInk profile.',
                },
                {
                    title: 'Show player counts and connect the console',
                    description:
                        'A2S reports whether the server responds and how many players are connected. Source RCON sends commands supported by your server and addons.',
                },
            ],
            setup: 'Select Garry’s Mod in Games and identities. Enter the A2S query port to show your server status. For commands, choose RCON and configure its TCP port and password in Manage connection.',
            plugins: [
                {
                    slug: 'vote',
                    description: 'Verify votes from Garry’s Mod Servers and reward members with website credit.',
                },
                {
                    slug: 'forum',
                    description: 'Poll players about DarkRP job changes and discuss the proposals in the same thread.',
                },
            ],
        },
        rust: {
            title: 'CMS for Rust servers',
            description:
                'Publish your Rust wipe schedule with KraftInk. Members can link their Steam accounts, and the site connects to your server through A2S and WebRCON.',
            intro: 'Players coming back for wipe want the date, map and team size. Publish those details on your Rust server website so everyone knows what to expect.',
            highlights: ['Steam OpenID', 'A2S status', 'WebRCON with optional TLS'],
            features: [
                {
                    title: 'Announce the next wipe',
                    description:
                        'Say whether the reset includes blueprints. If you run several servers, post the schedule and rules for each one.',
                },
                {
                    title: 'Give WebRCON its own address',
                    description:
                        'Your site queries the game server through A2S. If WebRCON runs at a separate address, enter it in the connection settings and enable TLS when the server or its proxy provides an encrypted endpoint.',
                },
            ],
            setup: 'Enable WebRCON with rcon.web 1 on your server. Enter the A2S query port on the server record, then set the RCON port, password and encryption mode in Manage connection.',
            plugins: [
                {
                    slug: 'stats',
                    description: 'Compare player counts and peak activity around two successive wipes.',
                },
                {
                    slug: 'vote',
                    description: 'Connect your Rust Servers listing and reward members once their votes are verified.',
                },
            ],
        },
        fivem: {
            title: 'CMS for FiveM servers',
            description:
                'Publish the rules and joining process for your FiveM RP server. KraftInk links Cfx.re or Steam accounts and displays FXServer status.',
            intro: 'New players need to know where to read the rules and how to get whitelisted before they can join your city. Explain those steps on your FiveM server website.',
            highlights: ['Cfx.re or Steam identity', 'FXServer status', 'FXServer RCON commands'],
            features: [
                {
                    title: 'Help newcomers get into the city',
                    description:
                        'Explain the application process, the available roles and the rules for a first session. Share city announcements from the same site.',
                },
                {
                    title: 'Choose between Cfx.re and Steam',
                    description:
                        'Cfx.re is the default and requires an HTTPS site. Choose Steam in the game settings if your server uses it to identify players.',
                },
                {
                    title: 'Display FXServer activity',
                    description:
                        'KraftInk reads status and player count from dynamic.json. Enable RCON on the server to send commands your setup supports.',
                },
            ],
            setup: 'After selecting FiveM in Games and identities, enable the Cfx.re or Steam connection. Enter the FXServer address and configure RCON in Manage connection if you use commands.',
            plugins: [
                {
                    slug: 'support',
                    description: 'Handle whitelist questions in private tickets your team can assign to staff.',
                },
                {
                    slug: 'shop',
                    description: 'Offer a supporter rank that unlocks a members-only area on your city’s website.',
                },
            ],
        },
        dayz: {
            title: 'CMS for DayZ servers',
            description:
                'Publish your DayZ server’s map, required mods and restart schedule. KraftInk links Steam accounts and supports A2S and BattlEye RCON.',
            intro: 'Before heading out on your DayZ server, players need the right mods, the restart schedule and the rules they’ll play by. Give them one place to check all three.',
            highlights: ['Steam OpenID', 'A2S status', 'BattlEye RCON'],
            features: [
                {
                    title: 'Keep your mod list current',
                    description:
                        'Post the map name and the required collection. When you change mods, share the update date and the steps to take before reconnecting.',
                },
                {
                    title: 'Connect the BattlEye console',
                    description:
                        'The site displays server status through A2S. To administer your server from KraftInk, configure the BattlEye RCON console with its UDP port and password.',
                },
            ],
            setup: 'Choose DayZ in Games and identities, then add the A2S query port to the server record. Enter the BattlEye details in Manage connection.',
            plugins: [
                {
                    slug: 'wiki',
                    description:
                        'Keep a revision history for your mod installation guide so your team can track what changed between updates.',
                },
                {
                    slug: 'vote',
                    description: 'Verify votes from your TrackyServer listing and reward members after confirmation.',
                },
            ],
        },
        ark: {
            title: 'CMS for ARK: Survival Evolved servers',
            description:
                'Publish map and transfer rules for your ARK: Survival Evolved cluster. Link Steam accounts and connect your servers through A2S and Source RCON.',
            intro: 'A new player on your ARK: Survival Evolved cluster has to choose a map and learn what they can transfer. Give them one place to check the rules for each map.',
            highlights: ['Steam OpenID', 'A2S status', 'Source RCON commands'],
            features: [
                {
                    title: 'Guide players through your cluster',
                    description:
                        'List the open maps, required mods and transfer rules. Include harvest or breeding rates to help players decide where to start.',
                },
                {
                    title: 'Send commands to the right map',
                    description:
                        'Use A2S to display status for the main server. With a separate Source RCON connection for each server, you can send commands to the map you intend.',
                },
            ],
            setup: 'Select ARK: Survival Evolved in Games and identities. Enter the A2S query port for status and configure Source RCON with its own TCP port and password for commands.',
            plugins: [
                {
                    slug: 'wiki',
                    description: 'Give each map in your cluster its own page with rates and transfer rules.',
                },
                {
                    slug: 'vote',
                    description: 'Verify votes from ARK Servers and reward members who place in the monthly rankings.',
                },
            ],
        },
        sevendaystodie: {
            title: 'CMS for 7 Days to Die servers',
            description:
                'Publish the rules and mod list for your 7 Days to Die server. KraftInk supports Steam accounts, A2S status and the dedicated server’s Telnet console.',
            intro: 'Your players are preparing for the next Blood Moon. Give them a place to check the world settings, the rules for bases and the mod pack they’ll need.',
            highlights: ['Steam OpenID', 'A2S status', 'Telnet console'],
            features: [
                {
                    title: 'Explain how your world plays',
                    description:
                        'List the Blood Moon frequency, building rules and loot settings. Post world resets early enough for players to make plans.',
                },
                {
                    title: 'Send commands through Telnet',
                    description:
                        'KraftInk can send commands once the dedicated server’s Telnet console is enabled and protected by a password. Use a trusted network or tunnel.',
                },
            ],
            setup: 'Enter the A2S query port to display status. To send commands, enter the Telnet console’s port and password in Manage connection.',
            plugins: [
                {
                    slug: 'forum',
                    description: 'Poll players about the next challenge or the settings for a new world.',
                },
                {
                    slug: 'vote',
                    description:
                        'Verify votes from 7 Days to Die Servers and set up a reward after members reach a vote milestone.',
                },
            ],
        },
        counterstrike2: {
            title: 'CMS for Counter-Strike 2 servers',
            description:
                'Publish map rotations and community matches for your CS2 server. KraftInk displays player counts through A2S and supports Steam and Source RCON.',
            intro: 'Retakes, practice and community matches each come with their own rules. Show your Counter-Strike 2 players where to connect and how to take part.',
            highlights: ['Steam OpenID', 'A2S status and player count', 'Source RCON commands'],
            features: [
                {
                    title: 'Get players the details before a match',
                    description:
                        'Publish the map rotation and joining instructions for each mode. For a community match, include the start time and how to sign up.',
                },
                {
                    title: 'Check the player count before joining',
                    description:
                        'A2S displays status and player count. Steam OpenID lets members link the Steam account they use in your community.',
                },
            ],
            setup: 'Select Counter-Strike 2 in Games and identities. Configure the server’s A2S query port and add its Source RCON TCP port and password if you need console commands.',
            plugins: [
                {
                    slug: 'stats',
                    description: 'Check hourly player counts to pick a time for a community match.',
                },
                {
                    slug: 'vote',
                    description: 'Connect your Counter-Strike Servers listing to verify votes and reward members.',
                },
            ],
        },
        teamfortress2: {
            title: 'CMS for Team Fortress 2 servers',
            description:
                'Build a TF2 server website for custom maps and community nights. KraftInk links Steam accounts and supports A2S status and Source RCON.',
            intro: 'Share the date of your next Payload night, the custom maps in rotation and the server to join. Give your regulars a place to check the details between rounds of Team Fortress 2.',
            highlights: ['Steam OpenID', 'A2S status and player count', 'Source RCON commands'],
            features: [
                {
                    title: 'Publish the maps for game night',
                    description:
                        'Tell players which modes and maps are scheduled and whether any require a download. Give each event a page with the rules players need before they join.',
                },
                {
                    title: 'Show how busy your TF2 server is',
                    description:
                        'The A2S counter shows how many players are connected. Use Source RCON for commands provided by the server or its plugins.',
                },
            ],
            setup: 'Select Team Fortress 2 in Games and identities. Enter your A2S query port and configure the Source RCON TCP port and password for server commands.',
            plugins: [
                {
                    slug: 'forum',
                    description:
                        'Let members pick the next Payload map and collect their suggestions in the discussion.',
                },
                {
                    slug: 'vote',
                    description:
                        'Connect your Team Fortress 2 Servers listing and set a community goal for verified votes.',
                },
            ],
        },
        unturned: {
            title: 'CMS for Unturned servers',
            description:
                'Publish your Unturned server’s address, map and Workshop mods. KraftInk supports Steam accounts, A2S status and compatible RCON components.',
            intro: 'When your Unturned map or mods change, update one page. Players can find the connection address and the Workshop collection they need there.',
            highlights: ['Steam OpenID', 'A2S status', 'Compatible Source RCON component'],
            features: [
                {
                    title: 'Explain the rules for your map',
                    description:
                        'List the safe zones, PvP rules and required mods. If your server combines survival and roleplay, say where each set of rules applies.',
                },
                {
                    title: 'Add console access to your setup',
                    description:
                        'KraftInk reads status through A2S. Sending commands to Unturned requires a server component that implements Source RCON.',
                },
            ],
            setup: 'Select Unturned in Games and identities and enter the A2S query port. For commands, install and configure a compatible Source RCON component on the game server first.',
            plugins: [
                {
                    slug: 'wiki',
                    description: 'Document safe zones and PvP rules by map so new players can find them easily.',
                },
                {
                    slug: 'vote',
                    description:
                        'Connect your Unturned Servers listing to verify votes and grant a website rank when members reach a milestone.',
                },
            ],
        },
        projectzomboid: {
            title: 'CMS for Project Zomboid servers',
            description:
                'Publish sandbox settings and your Workshop collection for Project Zomboid. KraftInk supports Steam accounts, A2S status and Source RCON.',
            intro: 'Returning survivors need the right Workshop collection and a heads-up about what’s changing at the next restart. Keep both on your Project Zomboid server website.',
            highlights: ['Steam OpenID', 'A2S status', 'Source RCON commands'],
            features: [
                {
                    title: 'Keep the survivor handbook current',
                    description:
                        'Explain character creation rules and sandbox settings such as PvP or safehouse protection. When a new season starts, tell players what carries over.',
                },
                {
                    title: 'Show when your server is ready',
                    description:
                        'A2S lets players check whether the server is responding after a restart. Members can link their Steam account through OpenID.',
                },
            ],
            setup: 'Select Project Zomboid in Games and identities. Configure its A2S query port for status and its Source RCON TCP port and password for console commands.',
            plugins: [
                {
                    slug: 'forum',
                    description:
                        'Organize survivor groups and plan the next season in discussions reserved for members.',
                },
                {
                    slug: 'support',
                    description: 'Help players who get stuck loading a Workshop mod through a private ticket.',
                },
            ],
        },
        redm: {
            title: 'CMS for RedM servers',
            description:
                'Introduce your RedM roleplay server and explain character applications. Members enter their Rockstar or Cfx ID, and KraftInk displays FXServer status.',
            intro: 'Introduce your setting before players create a character. Describe your RedM world, the roles open to newcomers and how to join a first session.',
            highlights: ['Declared Rockstar or Cfx identity', 'FXServer status', 'FXServer RCON commands'],
            features: [
                {
                    title: 'Guide new character applications',
                    description:
                        'Explain your roleplay rules and what a character application needs to cover. Give newcomers a starting point for exploring your towns and groups.',
                },
                {
                    title: 'Record the IDs your server uses',
                    description:
                        'Members enter the Rockstar license or Cfx ID your server uses. KraftInk stores it with their site profile.',
                },
                {
                    title: 'Send commands from your roleplay framework',
                    description:
                        'FXServer provides the server status. Character rewards can go through RCON when your roleplay framework supplies the right command.',
                },
            ],
            setup: 'Choose RedM in Games and identities, then enter the FXServer address for the dynamic.json status endpoint. Configure RCON if you use commands.',
            plugins: [
                {
                    slug: 'wiki',
                    description:
                        'Document character creation rules and available roles so applicants can prepare before they join.',
                },
                {
                    slug: 'support',
                    description: 'Let players ask about their character application in a private ticket.',
                },
            ],
        },
        arkascended: {
            title: 'CMS for ARK: Survival Ascended servers',
            description:
                'Publish map and crossplay details for your ARK: Survival Ascended cluster. KraftInk uses RCON for status and can check player presence by EOS ID.',
            intro: 'Which maps can players join from each platform? Where can they transfer a character? Put your ARK: Survival Ascended cluster rules in one place.',
            highlights: ['Declared EOS identity', 'Authenticated RCON status', 'Player presence through ListPlayers'],
            features: [
                {
                    title: 'Count players with ListPlayers',
                    description:
                        'KraftInk uses authenticated RCON to check presence and get the player count. The public status keeps player names and identifiers private.',
                },
                {
                    title: 'Wait for the right player before delivery',
                    description:
                        'Members enter their EOS ID. With a compatible command, a reward can wait until KraftInk detects that ID on the server.',
                },
            ],
            setup: 'Set RCONEnabled, RCONPort and ServerAdminPassword in GameUserSettings.ini. Select ARK: Survival Ascended in KraftInk and enter the RCON connection details.',
            plugins: [
                {
                    slug: 'stats',
                    description:
                        'Track peak player counts for each cluster server using the counts reported through RCON.',
                },
                {
                    slug: 'shop',
                    description:
                        'Offer a supporter rank on the cluster website that grants access to restricted pages.',
                },
            ],
        },
        palworld: {
            title: 'CMS for Palworld servers',
            description:
                'Publish the rules for your Palworld server. KraftInk uses the dedicated server’s REST API to read status, check player presence and send announcements.',
            intro: 'Tell members of your Palworld server where they can build a base and how to join a guild. Put the rules and dates for upcoming expeditions on your site.',
            highlights: ['Declared Palworld user ID', 'Official REST API', 'Authenticated player presence'],
            features: [
                {
                    title: 'Check your dedicated server status',
                    description:
                        'The REST API provides the player count and can check presence by Palworld user ID. Enable TLS if your API is available over HTTPS.',
                },
                {
                    title: 'Announce maintenance from KraftInk',
                    description:
                        'Use the REST integration to send an in-game announcement, save the world or run supported moderation actions. Item rewards require a separate integration.',
                },
            ],
            setup: 'Enable RESTAPIEnabled on the dedicated server and set the REST port and admin password. Select Palworld in KraftInk, then enter the API credentials and choose the encryption mode.',
            plugins: [
                {
                    slug: 'wiki',
                    description:
                        'Publish a searchable guide for each guild with its building rules and plans for upcoming expeditions.',
                },
                {
                    slug: 'stats',
                    description: 'Track when your world is busiest with player counts from the REST API.',
                },
            ],
        },
        satisfactory: {
            title: 'CMS for Satisfactory servers',
            description:
                'Share factory plans and announcements on your Satisfactory server website. KraftInk connects to the dedicated server’s HTTPS API with a token.',
            intro: 'Building a new railway or taking over an unfinished factory? Give your Satisfactory group a place to check the plans and priorities before the next session.',
            highlights: ['Declared Steam or Epic ID', 'Dedicated server HTTPS API', 'API token authentication'],
            features: [
                {
                    title: 'Share progress on your factory',
                    description:
                        'Post build locations, naming conventions and jobs players can pick up next time. Keep the connection details on the same page.',
                },
                {
                    title: 'Read server status through HTTPS',
                    description:
                        'The dedicated server API provides player counts and accepts commands the server supports. If your API uses a private certificate authority, configure its certificate in KraftInk.',
                },
            ],
            setup: 'Generate a token with server.GenerateAPIToken in the dedicated server console. Select Satisfactory in KraftInk and add the HTTPS API address, port and token.',
            plugins: [
                {
                    slug: 'wiki',
                    description:
                        'Document your rail network and naming conventions, then check the revision history when plans change.',
                },
                {
                    slug: 'forum',
                    description:
                        'Poll the group on the next build and collect suggestions for its location in the thread.',
                },
            ],
        },
        conanexiles: {
            title: 'CMS for Conan Exiles servers',
            description:
                'Publish raid hours and clan rules for your Conan Exiles server. Connect the query port and RCON console to KraftInk for status and commands.',
            intro: 'Your clans need to know when raids are open and where they can build. Post those rules alongside your Conan Exiles server map and mod list.',
            highlights: ['Declared platform ID', 'Server query and status', 'Source RCON commands'],
            features: [
                {
                    title: 'Give clans time to prepare for rule changes',
                    description:
                        'List raid hours, protected zones and server rates. Announce changes before they take effect.',
                },
                {
                    title: 'Connect the Conan Exiles console',
                    description:
                        'The query port provides the server status. Source RCON sends supported commands, including ones provided by your mods. For rewards, use a command that accepts the player’s declared platform ID.',
                },
            ],
            setup: 'In the RconPlugin section of Game.ini, enable RconEnabled and set RconPort and RconPassword. Enter the query and console ports in KraftInk.',
            plugins: [
                {
                    slug: 'support',
                    description: 'Handle raid reports in private tickets where players can attach screenshots.',
                },
                {
                    slug: 'shop',
                    description: 'Sell a supporter rank on the site for players who want to help cover server costs.',
                },
            ],
        },
    },
} satisfies GameCopy;
