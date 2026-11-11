import type { GameCopy } from '../../lib/translations';

export default {
    highlightsTitle: 'At a glance',
    setupTitle: 'Connect your server',
    guideLink: 'Read the connection guide',
    installationLink: 'Install KraftInk',
    backLink: 'All supported games',
    pluginsTitle: 'Add to your site',
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
            title: 'Build a website for your Minecraft Java server',
            description:
                'Build a Minecraft Java server website and store. Link player accounts and deliver rewards to the right server with KraftLink.',
            intro: 'Open a store for your Minecraft Java server and offer supporter ranks on the site. When a Skyblock season starts, publish the server address and schedule, then use KraftLink to deliver rewards to the right server.',
            highlights: [
                'A store with order tracking',
                'Account verification for Java and Bedrock players',
                'Rewards delivered to the server you choose',
            ],
            features: [
                {
                    title: 'Get players ready for launch',
                    description:
                        'Publish the launch date, required game version and season rules. Show how many players are online so newcomers can see if the server is open before starting the game.',
                },
                {
                    title: 'Find the right player account',
                    description:
                        'Java players can prove they own an account by linking it through Microsoft. If your network welcomes Bedrock players through Geyser and Floodgate, let them confirm their identity in game with KraftLink.',
                },
                {
                    title: 'Send rewards to the right server',
                    description:
                        'Choose which server runs each delivery command. On a Velocity network, a Skyblock reward can be delivered on the corresponding Paper server when the player joins it.',
                },
            ],
            setup: 'Choose Minecraft in Games and identities. Add a server in Ping mode to show its status, or connect each compatible instance through KraftLink for commands and player presence. If you use RCON, test a console command first.',
            plugins: [
                {
                    slug: 'shop',
                    description:
                        'Offer a supporter rank on your site and track orders. For an in-game reward, choose a delivery command that your connected server supports.',
                },
                {
                    slug: 'vote',
                    description:
                        'Connect your Minecraft-MP listing or another supported directory. Verify votes and reward players when they reach milestones you set.',
                },
                {
                    slug: 'skins',
                    description:
                        'Let members with a verified Java account customize their skin and cape on the site. Sync skins in game on compatible servers running SkinsRestorer and KraftLink.',
                },
            ],
        },
        minecraftbedrock: {
            title: 'Build a website for your Minecraft Bedrock server',
            description:
                'Share your Minecraft Bedrock server address, port and status. Verify Xbox gamertags on Cloudburst Nukkit with KraftLink.',
            intro: 'On Nukkit, members can link the Xbox gamertag they use in game to their profile. Give players a page where they can find the address and port, and add a store if you want to offer supporter ranks on the site.',
            highlights: [
                'An address and port that are easy to find',
                'Public server status and player count',
                'Xbox gamertag verification on Nukkit',
            ],
            features: [
                {
                    title: 'Help players join your world',
                    description:
                        'Show players the server name, address and port to enter in game. Use Bedrock ping to display the server status and player count from Bedrock Dedicated Server.',
                },
                {
                    title: 'Link the gamertag used in game',
                    description:
                        'On Cloudburst Nukkit with KraftLink and Xbox authentication enabled, a member enters a one-time code in game, then confirms the detected gamertag on the site.',
                },
                {
                    title: 'Deliver a reward when a player returns',
                    description:
                        'On Nukkit, set up a command to run the next time a player joins. KraftLink can use their gamertag even if it contains spaces.',
                },
            ],
            setup: 'Choose Minecraft Bedrock in Games and identities. For Bedrock Dedicated Server, add the host and UDP game port in Ping mode. For Cloudburst Nukkit, install KraftLink and enable Xbox authentication if you want to verify players in game.',
            plugins: [
                {
                    slug: 'forum',
                    description:
                        'Let players vote on the next neighborhood theme or map. Keep their suggestions and replies in the poll thread.',
                },
                {
                    slug: 'shop',
                    description:
                        'Let players support your world by buying a rank on the site. On Nukkit, you can also configure a delivery command with KraftLink.',
                },
            ],
        },
        hytale: {
            title: 'Bring your Hytale server community together',
            description:
                'Plan your Hytale server launch, publish guides to help players join and show whether the server is online with KraftLink.',
            intro: 'Keep in touch with players between Hytale playtests. Publish the next dates and collect feedback on your forum. With KraftLink, players can see whether the server is open before they launch the game.',
            highlights: [
                'Opening dates and getting started guides',
                'Server status players can check before joining',
                'Hytale player profiles on your site',
            ],
            features: [
                {
                    title: 'Prepare for your first sessions',
                    description:
                        'Announce play times and anything players need for your world. Keep the instructions for joining on a page you can update whenever the server opens.',
                },
                {
                    title: 'Connect website members with their game profiles',
                    description:
                        'Members can enter their Hytale profile on the site. Enable the optional PlayerDB lookup to find public profiles by username or UUID.',
                },
                {
                    title: 'See who joins your sessions',
                    description:
                        'KraftLink reports whether the server is responding and which players are online. Use the admin panel to send commands you allow in the connector settings.',
                },
            ],
            setup: 'Choose Hytale in Games and identities. Install the compatible KraftLink build in your server’s mods folder, then enter your site URL and connection token.',
            plugins: [
                {
                    slug: 'wiki',
                    description:
                        'Publish a guide to joining for the first time and rules for your world. New players can find an article without scrolling through announcements.',
                },
                {
                    slug: 'vote',
                    description:
                        'Connect your Hytale Servers listing to verify votes and reward members who help others discover your world.',
                },
                {
                    slug: 'forum',
                    description:
                        'Open a feedback thread after a playtest. Keep suggestions, screenshots and staff replies together.',
                },
            ],
        },
        garrysmod: {
            title: 'A CMS for your Garry’s Mod community',
            description:
                'Help players join your GMod server. Publish DarkRP rules and your Workshop collection, then link Steam accounts to member profiles.',
            intro: 'Link Steam accounts so staff can identify the right player when they respond to a request. If you run DarkRP, publish your Workshop collection, job rules and server address to help newcomers get ready to join.',
            highlights: [
                'Workshop collection and DarkRP rules',
                'Steam accounts linked to member profiles',
                'Available server slots visible on the site',
            ],
            features: [
                {
                    title: 'Make the first connection easier',
                    description:
                        'Show players which addons to install, which maps you run and where to read the rules for each job. Display player counts and open slots before they launch GMod.',
                },
                {
                    title: 'Find a member after they change their name',
                    description:
                        'Players link their Steam accounts through OpenID. Your staff can use the Steam ID linked to a KraftInk profile to follow up on a request or find the right member.',
                },
                {
                    title: 'Keep track of discussions that need moderation',
                    description:
                        'Give players a place to suggest jobs and discuss rules. With Forum, staff can review reports and lock a thread when needed.',
                },
            ],
            setup: 'Choose Garry’s Mod in Games and identities and enable Steam under external logins. Add the A2S query port for public server status. To send commands supported by your addons, configure Source RCON separately under Manage connection.',
            plugins: [
                {
                    slug: 'forum',
                    description:
                        'Run a poll on the next map or proposed job changes. Players can make their case and vote in the same thread.',
                },
                {
                    slug: 'support',
                    description:
                        'Handle appeals and missing content reports in private. Assign each ticket to the staff member following it up.',
                },
                {
                    slug: 'vote',
                    description:
                        'Connect your Garry’s Mod Servers listing, verify votes and reward the members who support your server.',
                },
            ],
        },
        rust: {
            title: 'A website to bring players back after Rust wipes',
            description:
                'Announce Rust wipes, show player counts and track server activity. Let players link their Steam accounts to profiles on your site.',
            intro: 'Use Statistics to see how many players are online for each wipe and when activity drops off. Plan the next wipe from those numbers, then announce the date, map and team rules on your site.',
            highlights: [
                'Wipe dates and rules for each server',
                'Server population visible on your site',
                'Steam accounts linked to member profiles',
            ],
            features: [
                {
                    title: 'Tell players when to come back',
                    description:
                        'Announce whether the wipe also resets blueprints. If you run several servers, publish the address, schedule and team rules for each one.',
                },
                {
                    title: 'See when your server is busiest',
                    description:
                        'Show the player count reported by the server. With Statistics and the scheduler, compare wipe day activity with the following days to help plan the next one.',
                },
                {
                    title: 'Give regulars a shared voting goal',
                    description:
                        'Set a voting goal for the month. With Vote, members who contribute can earn a reward on your site when the community reaches that goal.',
                },
            ],
            setup: 'Add the A2S query port for Rust server status. To send commands, enable rcon.web 1 and set up access under Manage connection. You can use a separate host and enable TLS if the console supports encrypted connections.',
            plugins: [
                {
                    slug: 'stats',
                    description:
                        'Compare peak player counts across wipes and export the daily records for the server you select.',
                },
                {
                    slug: 'vote',
                    description:
                        'Connect your Rust Servers listing to encourage votes. Give members the reward you set after their vote is confirmed.',
                },
            ],
        },
        fivem: {
            title: 'Manage applications for your FiveM RP server',
            description:
                'Welcome players to your FiveM RP server. Explain how to apply for the whitelist, show server status and link Cfx.re or Steam accounts.',
            intro: 'Assign whitelist questions to staff through private Support tickets. Players can link their Cfx.re or Steam account, find the application instructions and check whether the city is open.',
            highlights: [
                'City rules and application instructions',
                'Cfx.re or Steam linked to member profiles',
                'Server status players can check before opening FiveM',
            ],
            features: [
                {
                    title: 'Explain how to join your city',
                    description:
                        'Publish the application requirements, first session instructions and where to get help. Keep city announcements and rule changes in the same place.',
                },
                {
                    title: 'Use the identity your server recognizes',
                    description:
                        'Link player profiles to Cfx.re accounts by default. Choose Steam in the game settings if staff use Steam IDs to look up players.',
                },
                {
                    title: 'Show when the server is available',
                    description:
                        'Display the status and player count reported by FXServer. Publish a notice ahead of maintenance or when the city is about to reopen.',
                },
            ],
            setup: 'Choose FiveM in Games and identities, then enable Cfx.re or Steam login. Cfx.re requires HTTPS. Add the FXServer address for status via dynamic.json and configure RCON if your staff use console commands.',
            plugins: [
                {
                    slug: 'support',
                    description:
                        'Take whitelist questions in private tickets. Assign each request to a staff member and keep follow-up notes visible only to the team.',
                },
                {
                    slug: 'wiki',
                    description:
                        'Organize the rules by topic and publish a guide to your first session in the city. Players can search for a rule when they need it.',
                },
                {
                    slug: 'forum',
                    description: 'Discuss community proposals and ask residents to vote on future city events.',
                },
            ],
        },
        dayz: {
            title: 'A CMS for DayZ server communities',
            description:
                'Handle reports on your DayZ server with Steam-linked profiles and help new players find your community through verified TrackyServer votes.',
            intro: 'When you review a ban appeal, find the member’s profile, linked Steam account and ticket history together. Give your DayZ players a way to help others find the server by voting for its listing.',
            highlights: ['Report and appeal tracking', 'Linked Steam accounts', 'Verified TrackyServer votes'],
            features: [
                {
                    title: 'Handle reports as a team',
                    description:
                        'Use separate ticket categories for reports and ban appeals. Staff can pick up a request, see what the member has already shared and reply in the same ticket.',
                },
                {
                    title: 'Bring players back after an update',
                    description:
                        'Post the updated Workshop collection and reopening time. Players can check the main server’s status to see if they can already join.',
                },
            ],
            setup: 'Select DayZ in Games and identities and enable Steam sign-in. Add the A2S query port for status. For console commands, enter the BattlEye RCON UDP port and password in Manage connection.',
            plugins: [
                {
                    slug: 'wiki',
                    description: 'Use your mod guide’s revision history to explain what changed after an update.',
                },
                {
                    slug: 'support',
                    description: 'Assign tickets to staff and keep a record of their replies.',
                },
                {
                    slug: 'vote',
                    description: 'Reward verified votes for your TrackyServer listing on your website.',
                },
            ],
        },
        ark: {
            title: 'Manage your ARK: Survival Evolved cluster from one site',
            description:
                'A CMS for your ARK: Survival Evolved cluster. Track transfer requests, link Steam accounts and send console commands to the right server.',
            intro: 'When a transfer stalls between maps, your team can find the tribe’s request in a ticket and send a command to the right server. KraftInk brings both tools to your ARK: Survival Evolved cluster’s website.',
            highlights: ['Transfer ticket tracking', 'Console access by map', 'Main server status'],
            features: [
                {
                    title: 'Follow up on transfer requests',
                    description:
                        'Ask for the source map, the destination and details of the transfer in the ticket. If the member has linked their Steam account, staff can find it through their site profile.',
                },
                {
                    title: 'Send commands to the right map',
                    description:
                        'Connect each server’s console separately. When your team needs to act on one map, it can select that server and send a command from the admin panel.',
                },
            ],
            setup: 'Select ARK: Survival Evolved in Games and identities and enable Steam sign-in. Add the A2S query port to show the main server’s status and player count. Enter the Source RCON TCP port and password for each console you want to connect.',
            plugins: [
                {
                    slug: 'wiki',
                    description: 'Keep a page per map with its rates, required mods and allowed transfers.',
                },
                {
                    slug: 'support',
                    description:
                        'Create a transfer category and assign tickets to the people who look after the maps involved.',
                },
                {
                    slug: 'vote',
                    description: 'Connect your ARK Servers listing and set up site rewards for verified votes.',
                },
            ],
        },
        sevendaystodie: {
            title: 'A website and shop for your 7 Days to Die server',
            description:
                'Bring players back after a 7 Days to Die wipe, sell supporter ranks on your site and reward votes verified by your server directory.',
            intro: 'Give players a site they can return to from one world to the next. With KraftInk they can check if the server is up, vote to help others find it and buy a supporter rank on the site.',
            highlights: ['Shop for supporter ranks', 'Verified directory votes', 'Server status before joining'],
            features: [
                {
                    title: 'Bring players back after a wipe',
                    description:
                        'Post the reopening date, the new map and any mods to reinstall. Regulars keep their website accounts and can check the server status before launching the game again.',
                },
                {
                    title: 'Help more players find your server',
                    description:
                        'Connect your 7 Days to Die Servers listing. Votes from your players can move your server up the directory rankings. In KraftInk, set a shared goal and reward everyone who contributes when you reach it.',
                },
            ],
            setup: 'Select 7 Days to Die in Games and identities and enable Steam sign-in. Add the A2S query port for status. For commands, connect the password-protected Telnet console over a trusted network or tunnel.',
            plugins: [
                {
                    slug: 'shop',
                    description: 'Sell a supporter rank granted on the site after payment to help cover hosting costs.',
                },
                {
                    slug: 'vote',
                    description:
                        'Verify votes from 7 Days to Die Servers and grant a site rank at the milestone you choose.',
                },
                {
                    slug: 'forum',
                    description:
                        'Ask regulars to vote on settings for the next world, such as how often Blood Moons occur.',
                },
            ],
        },
        counterstrike2: {
            title: 'A website for your Counter-Strike 2 community servers',
            description:
                'Help players find your CS2 servers and community matches. Show player counts, link Steam accounts and use Stats to pick times for your matches.',
            intro: 'Give players the right address for retakes or practice. For your main server, KraftInk shows how many people are already playing before they launch Counter-Strike 2.',
            highlights: ['Player count before joining', 'Linked Steam accounts', 'Player activity to plan matches'],
            features: [
                {
                    title: 'Send players to the right server',
                    description:
                        'List server addresses by game mode, along with the rules and maps. For a community match, post the chosen server, the time and a link to the sign-up thread.',
                },
                {
                    title: 'Recognize players from one match to the next',
                    description:
                        'Members can link their Steam account to their site profile. Ask them to reply to the match thread with that profile so you know who plans to join.',
                },
            ],
            setup: 'Select Counter-Strike 2 in Games and identities and enable Steam sign-in. Add the A2S query port for status. If your team needs console access, enter the Source RCON TCP port and password.',
            plugins: [
                {
                    slug: 'stats',
                    description: 'See when the server is busiest to pick a time for a community match.',
                },
                {
                    slug: 'forum',
                    description: 'Open a thread for each event to take sign-ups and tell participants if plans change.',
                },
                {
                    slug: 'vote',
                    description:
                        'Connect your Counter-Strike Servers listing to verify votes and reward members on the site.',
                },
            ],
        },
        teamfortress2: {
            title: 'A website for the regulars on your Team Fortress 2 server',
            description:
                'Plan Team Fortress 2 events with map polls, download links and server status. Let members link their Steam account to their community profile.',
            intro: 'Plan your next Payload night with the regulars. Let them pick maps, post the final rotation and give them a place to see whether people are already playing.',
            highlights: ['Polls for map rotations', 'Links to custom maps', 'Current player count'],
            features: [
                {
                    title: 'Get players ready for custom maps',
                    description:
                        'Post the download links, the server address and the start time together. Players can see what they need to install and check the main server’s player count before joining.',
                },
                {
                    title: 'Keep the discussion going between games',
                    description:
                        'Members can link their Steam account and use their site profile to suggest a map or share feedback after an event. Your team can refer back to the thread when planning the next rotation.',
                },
            ],
            setup: 'Select Team Fortress 2 in Games and identities and enable Steam sign-in. Enter the A2S query port. To send commands from the admin panel, add the Source RCON TCP port and password.',
            plugins: [
                {
                    slug: 'forum',
                    description: 'Run a poll with a shortlist of maps, then post the selection in the thread.',
                },
                {
                    slug: 'wiki',
                    description:
                        'Keep installation instructions for the custom maps you put back into rotation regularly.',
                },
                {
                    slug: 'vote',
                    description:
                        'Connect your Team Fortress 2 Servers listing to verify votes and set a shared vote goal on your site.',
                },
            ],
        },
        unturned: {
            title: 'A website for your Unturned roleplay or survival server',
            description:
                'A CMS for your Unturned roleplay or survival server. Track tickets and Steam profiles, and offer a site rank for supporters who help pay for hosting.',
            intro: 'When an incident happens in a roleplay or PvP area, your team can review the ticket history and find the member’s profile. Players can read the rules and support the server on the same site.',
            highlights: ['Tickets for reports', 'Linked Steam accounts', 'Supporter ranks on the site'],
            features: [
                {
                    title: 'Show new players the rules for their map',
                    description:
                        'Put the Workshop collection, safe zones and PvP rules on the site. If you change maps, post the date and the new mods players need in the same place.',
                },
                {
                    title: 'Keep reports together',
                    description:
                        'Members can link their Steam account and open a ticket with the location, time and a screenshot of an incident. Moderators can review the ticket history when they pick it up.',
                },
            ],
            setup: 'Select Unturned in Games and identities and enable Steam sign-in. Add the A2S query port for status. To send commands, first install a component on the game server that supports Source RCON.',
            plugins: [
                {
                    slug: 'support',
                    description:
                        'Use separate ticket categories for roleplay reports, PvP disputes and connection problems.',
                },
                {
                    slug: 'shop',
                    description: 'Offer a site rank to members who want to help cover the cost of hosting.',
                },
                {
                    slug: 'vote',
                    description: 'Send members to your Unturned Servers listing and reward verified votes on the site.',
                },
            ],
        },
        projectzomboid: {
            title: 'Build a website for your Project Zomboid server',
            description:
                'Create a Project Zomboid server website with a recruitment forum, support tickets for mod issues and Steam account linking.',
            intro: 'Recruit new survivors between seasons and keep groups in touch when the world resets. Players can find their crew on the forum and ask for help if the new mod collection keeps them from joining.',
            highlights: ['Survivor group recruitment', 'Linked Steam accounts', 'Private tickets for mod issues'],
            features: [
                {
                    title: 'Bring survivor groups back after a reset',
                    description:
                        'Open recruitment on the forum before the map changes. In the season announcement, give players the restart date, tell them what carries over and link the Workshop collection to install.',
                },
                {
                    title: 'Tell downtime from a mod problem',
                    description:
                        'Players can check whether the server responds after a restart. If the game still won’t load, they can send the mod name and game version in a private ticket.',
                },
            ],
            setup: 'Select Project Zomboid in Games and identities. Enable Steam under external sign-in and add the A2S query port for status. Configure Source RCON if you want to send console commands.',
            plugins: [
                {
                    slug: 'forum',
                    description: 'Reserve categories for members and pin the season’s recruitment thread.',
                },
                {
                    slug: 'support',
                    description:
                        'Create a category for connection problems and ask players to attach a screenshot to their ticket.',
                },
                {
                    slug: 'vote',
                    description:
                        'Connect a supported server listing and award a website rank when members reach a verified vote milestone.',
                },
            ],
        },
        redm: {
            title: 'Build a recruitment website for your RedM roleplay server',
            description:
                'Introduce your RedM roleplay server, publish its rules and handle character applications privately with KraftInk.',
            intro: 'Handle RedM applications privately. Players submit their character profiles, staff divide up the applications and new recruits can find the instructions for their first session.',
            highlights: [
                'Private application tickets',
                'Roleplay rules before joining',
                'FXServer status on your site',
            ],
            features: [
                {
                    title: 'Collect complete character applications',
                    description:
                        'With Support, add questions for character applications. Ask for the character’s name and motivation, then assign the ticket to a staff member.',
                },
                {
                    title: 'Keep joining instructions within reach',
                    description:
                        'Explain how to join after acceptance and display the status from FXServer. Members can enter the Rockstar license or Cfx ID your server uses in their profiles.',
                },
            ],
            setup: 'Select RedM in Games and identities. Enter the FXServer address to show status through dynamic.json. Configure RCON if you want to run supported server commands from KraftInk.',
            plugins: [
                {
                    slug: 'support',
                    description:
                        'Give applications and roleplay reports separate private categories with their own questions.',
                },
                {
                    slug: 'wiki',
                    description:
                        'Publish character creation rules and available roles. Keep moderation procedures in a section reserved for staff.',
                },
            ],
        },
        arkascended: {
            title: 'One website for your ARK: Survival Ascended cluster',
            description:
                'Manage your ARK: Survival Ascended cluster in KraftInk. Publish transfer rules and compare player counts across maps in the admin panel.',
            intro: 'Give tribes one place to plan transfers between maps. Your staff can track player counts across the cluster and queue a reward until its recipient joins the chosen map.',
            highlights: [
                'Maps and transfer rules',
                'Player counts by map in the admin panel',
                'Player presence by EOS ID',
            ],
            features: [
                {
                    title: 'Help players find the right map',
                    description:
                        'Explain which maps support crossplay and what can transfer. Choose the main server whose status and player count you want to show on the site.',
                },
                {
                    title: 'Wait for the player before delivering a reward',
                    description:
                        'Members enter their EOS ID on the site. With a compatible command, delivery can wait until KraftInk detects that ID on the destination server.',
                },
            ],
            setup: 'Enable RCON in GameUserSettings.ini with RCONEnabled, RCONPort and ServerAdminPassword. Select ARK: Survival Ascended in KraftInk, add each server and configure its RCON connection.',
            plugins: [
                {
                    slug: 'stats',
                    description: 'Check when the selected map is busiest before scheduling an event or maintenance.',
                },
                {
                    slug: 'shop',
                    description:
                        'Offer a supporter rank to help cover cluster costs and give supporters access to a members-only section on the site.',
                },
            ],
        },
        palworld: {
            title: 'Build a website for your Palworld server',
            description:
                'Show your Palworld server status, help guilds recruit and announce maintenance in game from KraftInk.',
            intro: 'Warn players in game and save the world from the admin panel before maintenance. On your site, new players can find a guild and see when the server is responding again.',
            highlights: [
                'Server status and player count',
                'In-game announcements and world saves',
                'Discussion space for guilds',
            ],
            features: [
                {
                    title: 'Warn players before maintenance',
                    description:
                        'Connect the dedicated server to send an in-game announcement and save the world from the admin panel. Players can check the server status on your site afterward.',
                },
                {
                    title: 'Moderate by Palworld user ID',
                    description:
                        'Members can enter their Palworld user ID in their profiles. With the right permissions, staff can use that ID to kick, ban or unban a player from the admin panel.',
                },
            ],
            setup: 'Turn on RESTAPIEnabled on the dedicated server. Select Palworld in KraftInk, then enter the REST port and administrator password. Enable TLS if your API is available over HTTPS.',
            plugins: [
                {
                    slug: 'forum',
                    description:
                        'Open a recruitment board and let each guild start a thread for its upcoming expeditions.',
                },
                {
                    slug: 'stats',
                    description: 'Check the player count history to find a quieter time for a restart.',
                },
            ],
        },
        satisfactory: {
            title: 'A website for your Satisfactory server and its builds',
            description:
                'Keep factory plans, team decisions and the status of your dedicated Satisfactory server together with KraftInk.',
            intro: 'Hand off a build even when you play at different times. Teammates can find the plan you agreed on, see which production line needs work and check the server before launching the game.',
            highlights: [
                'Plans and notes for the next session',
                'Polls for upcoming builds',
                'Dedicated server status',
            ],
            features: [
                {
                    title: 'Pick up a build with clear instructions',
                    description:
                        'Give the team a private planning space. For each factory, record what’s already done, which plan to follow and what to build next.',
                },
                {
                    title: 'Check the server before maintenance',
                    description:
                        'The admin panel shows dedicated server status and player counts through the HTTPS API. Administrators can also run the commands the server supports.',
                },
            ],
            setup: 'Select Satisfactory in Games and identities. Generate a token with server.GenerateAPIToken in the dedicated console, then add the HTTPS address, port and token in KraftInk. Members can enter their Steam or Epic ID.',
            plugins: [
                {
                    slug: 'wiki',
                    description:
                        'Publish rail plans and naming conventions. Use the revision history if the team needs to check the previous route.',
                },
                {
                    slug: 'forum',
                    description:
                        'Poll the group on two factory locations and keep the reasons for the decision in the thread.',
                },
            ],
        },
        conanexiles: {
            title: 'A website for the clans on your Conan Exiles server',
            description:
                'Publish raid hours and rules for your Conan Exiles server. Handle clan reports and show server status with KraftInk.',
            intro: 'Give clans a place to check the rules before a raid and report incidents afterward. Staff can review each dispute privately with the time and screenshots attached to the ticket.',
            highlights: [
                'Raid calendar and rules',
                'Private reports with attachments',
                'Server status and console access',
            ],
            features: [
                {
                    title: 'Announce rule changes before the next raid',
                    description:
                        'Post new raid hours and the date they take effect. Keep the rules and mod list at the same address so recruits can find them.',
                },
                {
                    title: 'Give moderators what they need to act',
                    description:
                        'Assign the ticket to a moderator so the team keeps the conversation together. If staff need to act in game, they can send commands that the server and its mods support from the admin panel.',
                },
            ],
            setup: 'Select Conan Exiles in Games and identities and enter its query port for status. Turn on RconEnabled in the RconPlugin section of Game.ini for commands and set RconPort and RconPassword. Members can enter their platform ID.',
            plugins: [
                {
                    slug: 'support',
                    description:
                        'Create a raid reporting category with its own questions and add notes that only moderators can see.',
                },
                {
                    slug: 'shop',
                    description: 'Offer a website supporter rank for members who want to help cover server costs.',
                },
            ],
        },
    },
} satisfies GameCopy;
