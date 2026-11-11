import type { GameCopy } from '../../lib/translations';

export default {
    highlightsTitle: 'En un coup d’œil',
    setupTitle: 'Relier votre serveur',
    guideLink: 'Lire le guide de connexion',
    installationLink: 'Installer KraftInk',
    backLink: 'Tous les jeux compatibles',
    pluginsTitle: 'À ajouter à votre site',
    pluginNames: {
        shop: 'Boutique',
        vote: 'Vote',
        forum: 'Forum',
        wiki: 'Wiki',
        support: 'Assistance',
        stats: 'Statistiques',
        skins: 'Skins et capes',
    },
    pages: {
        minecraft: {
            title: 'Créez le site de votre serveur Minecraft Java',
            description:
                'Créez le site et la boutique de votre serveur Minecraft Java. Associez les comptes des joueurs et livrez vos récompenses avec KraftLink.',
            intro: 'Ouvrez une boutique pour votre serveur Minecraft Java et proposez des grades de soutien sur le site. Quand vous lancez une saison Skyblock, publiez l’adresse et le programme, puis utilisez KraftLink pour livrer les récompenses sur le bon serveur.',
            highlights: [
                'Boutique et suivi des commandes',
                'Comptes Java et Bedrock vérifiables',
                'Récompenses livrées sur le serveur choisi',
            ],
            features: [
                {
                    title: 'Préparez la prochaine ouverture',
                    description:
                        'Publiez la date de lancement, la version à utiliser et les règles de la saison. Affichez les joueurs connectés pour que les nouveaux venus sachent si le serveur est ouvert avant de lancer le jeu.',
                },
                {
                    title: 'Retrouvez le bon compte de jeu',
                    description:
                        'Les joueurs Java peuvent prouver que le compte leur appartient en le liant avec Microsoft. Si votre réseau accueille des joueurs Bedrock via Geyser et Floodgate, proposez-leur une confirmation en jeu avec KraftLink.',
                },
                {
                    title: 'Livrez une récompense au bon endroit',
                    description:
                        'Choisissez l’instance qui doit exécuter la commande de livraison. Sur un réseau Velocity, une récompense prévue pour le Skyblock peut ainsi être livrée sur le serveur Paper correspondant quand le joueur le rejoint.',
                },
            ],
            setup: 'Choisissez Minecraft dans Jeux et identités. Ajoutez votre serveur en mode Ping pour afficher son état, ou reliez chaque instance compatible avec KraftLink pour les commandes et la présence des joueurs. Si vous utilisez RCON, testez d’abord une commande de console.',
            plugins: [
                {
                    slug: 'shop',
                    description:
                        'Proposez un grade de soutien sur le site et suivez les commandes. Pour un avantage en jeu, choisissez une commande prise en charge par le serveur relié.',
                },
                {
                    slug: 'vote',
                    description:
                        'Reliez votre fiche Minecraft-MP ou un autre annuaire compatible. Vérifiez les votes et récompensez les joueurs à chaque palier choisi.',
                },
                {
                    slug: 'skins',
                    description:
                        'Les membres dont le compte Java est vérifié peuvent personnaliser leur skin et leur cape sur le site. Synchronisez les skins en jeu sur les serveurs compatibles équipés de SkinsRestorer et KraftLink.',
                },
            ],
        },
        minecraftbedrock: {
            title: 'Créez le site de votre serveur Minecraft Bedrock',
            description:
                'Donnez aux joueurs l’adresse, le port et l’état de votre serveur Minecraft Bedrock. Vérifiez les gamertags sur Nukkit avec KraftLink.',
            intro: 'Sur Nukkit, les membres peuvent associer le gamertag Xbox qu’ils utilisent en jeu à leur profil. Donnez à vos joueurs une page pour retrouver l’adresse et le port, puis ajoutez une boutique si vous souhaitez proposer un grade de soutien sur le site.',
            highlights: [
                'Adresse et port à retrouver facilement',
                'État public du serveur et nombre de joueurs',
                'Gamertags Xbox vérifiables sur Nukkit',
            ],
            features: [
                {
                    title: 'Aidez les joueurs à rejoindre votre monde',
                    description:
                        'Indiquez le nom à donner au serveur dans le jeu, son adresse et son port. Le ping Bedrock affiche l’état et le nombre de joueurs sur un Bedrock Dedicated Server.',
                },
                {
                    title: 'Associez le gamertag utilisé en jeu',
                    description:
                        'Sur Cloudburst Nukkit avec KraftLink et l’authentification Xbox, le membre saisit un code à usage unique en jeu puis confirme le gamertag détecté sur le site.',
                },
                {
                    title: 'Remettez une récompense au retour du joueur',
                    description:
                        'Sur Nukkit, configurez une commande à exécuter à la prochaine connexion du joueur. KraftLink sait utiliser son gamertag, y compris s’il contient des espaces.',
                },
            ],
            setup: 'Choisissez Minecraft Bedrock dans Jeux et identités. Pour Bedrock Dedicated Server, ajoutez l’hôte et le port UDP du jeu en mode Ping. Pour Cloudburst Nukkit, installez KraftLink et activez l’authentification Xbox si vous souhaitez vérifier les profils en jeu.',
            plugins: [
                {
                    slug: 'forum',
                    description:
                        'Mettez aux voix le thème du prochain quartier ou le choix de la prochaine carte. Gardez les propositions et les réponses dans le fil du sondage.',
                },
                {
                    slug: 'shop',
                    description:
                        'Donnez aux joueurs un moyen de soutenir le monde avec un grade sur le site. Sur Nukkit, vous pouvez aussi configurer une commande de livraison avec KraftLink.',
                },
            ],
        },
        hytale: {
            title: 'Réunissez les joueurs de votre serveur Hytale',
            description:
                'Préparez l’ouverture de votre serveur Hytale, publiez les guides pour le rejoindre et affichez son état grâce au connecteur KraftLink.',
            intro: 'Gardez le contact avec les joueurs entre deux sessions de test de votre monde Hytale. Publiez les prochaines dates et recueillez leurs retours dans le Forum. Avec KraftLink, les joueurs peuvent vérifier si le serveur est ouvert avant de lancer le jeu.',
            highlights: [
                'Infos d’ouverture et guides de départ',
                'État du serveur visible avant de jouer',
                'Profils de jeu sur le site',
            ],
            features: [
                {
                    title: 'Préparez vos premières sessions',
                    description:
                        'Annoncez les créneaux de jeu et les prérequis propres à votre monde. Regroupez les informations de connexion sur une page que vous pourrez mettre à jour à chaque ouverture.',
                },
                {
                    title: 'Rattachez les profils Hytale aux comptes du site',
                    description:
                        'Les membres peuvent déclarer leur profil Hytale sur le site. La recherche facultative via PlayerDB retrouve les profils publics par pseudo ou UUID.',
                },
                {
                    title: 'Suivez l’activité pendant vos sessions',
                    description:
                        'KraftLink indique si le serveur répond et quels joueurs sont présents. Depuis le panneau, envoyez les commandes que vous avez autorisées dans la configuration du connecteur.',
                },
            ],
            setup: 'Choisissez Hytale dans Jeux et identités. Installez la version compatible de KraftLink dans le dossier mods du serveur, puis renseignez l’URL du site et le jeton de liaison.',
            plugins: [
                {
                    slug: 'wiki',
                    description:
                        'Publiez un guide de première connexion et les règles propres à votre monde. Les nouveaux joueurs peuvent retrouver un article sans repasser par les annonces.',
                },
                {
                    slug: 'vote',
                    description:
                        'Reliez votre fiche Hytale Servers pour confirmer les votes et récompenser les membres qui font connaître votre monde.',
                },
                {
                    slug: 'forum',
                    description:
                        'Ouvrez un fil de retours après une session de test. Gardez les suggestions, captures et réponses de l’équipe au même endroit.',
                },
            ],
        },
        garrysmod: {
            title: 'Un CMS pour gérer votre communauté Garry’s Mod',
            description:
                'Préparez l’arrivée des joueurs sur votre serveur GMod. Publiez vos règles DarkRP et votre collection Workshop, puis associez les comptes Steam.',
            intro: 'Reliez les comptes Steam pour que l’équipe puisse identifier le bon joueur quand elle répond à une demande. Sur un DarkRP, publiez la collection Workshop, les règles par métier et l’adresse de jeu pour aider les nouveaux à préparer leur première connexion.',
            highlights: [
                'Collection Workshop et règles DarkRP',
                'Comptes Steam associés aux profils',
                'Places disponibles visibles sur le site',
            ],
            features: [
                {
                    title: 'Préparez la première connexion',
                    description:
                        'Indiquez quels addons installer, à quelles cartes s’attendre et où lire les règles par métier. Affichez le nombre de joueurs et les places disponibles avant que les visiteurs ne lancent GMod.',
                },
                {
                    title: 'Identifiez un membre malgré un changement de pseudo',
                    description:
                        'Le joueur associe son compte Steam via OpenID. Votre équipe dispose ainsi d’un identifiant Steam lié au profil KraftInk pour traiter une demande ou retrouver le bon membre.',
                },
                {
                    title: 'Regroupez les discussions à modérer',
                    description:
                        'Donnez un espace aux suggestions de métiers et aux retours sur les règles. Avec le Forum, l’équipe peut traiter les signalements et verrouiller un fil si nécessaire.',
                },
            ],
            setup: 'Choisissez Garry’s Mod dans Jeux et identités et activez Steam dans les connexions externes. Ajoutez le port de requête A2S pour l’état public. Pour envoyer les commandes de vos addons, configurez séparément Source RCON dans Gérer la liaison.',
            plugins: [
                {
                    slug: 'forum',
                    description:
                        'Organisez un sondage sur la prochaine carte ou les changements de métiers. Les joueurs peuvent argumenter et voter dans le même fil.',
                },
                {
                    slug: 'support',
                    description:
                        'Traitez en privé les demandes de recours ou les problèmes de contenu manquant. Assignez le ticket au membre de l’équipe qui le suit.',
                },
                {
                    slug: 'vote',
                    description:
                        'Reliez votre fiche Garry’s Mod Servers, vérifiez les votes et récompensez les membres qui soutiennent votre serveur.',
                },
            ],
        },
        rust: {
            title: 'Un site pour faire revenir les joueurs après vos wipes Rust',
            description:
                'Annoncez vos wipes Rust, affichez le nombre de joueurs et suivez la fréquentation. Vos membres peuvent associer leur compte Steam.',
            intro: 'Voyez avec Statistiques combien de joueurs sont présents à chaque wipe et quand l’activité baisse. Utilisez ces relevés pour préparer le suivant, puis annoncez la date, la carte et les règles d’équipe sur le site.',
            highlights: [
                'Dates de wipe et règles par serveur',
                'Population du serveur visible sur le site',
                'Comptes Steam associés aux profils',
            ],
            features: [
                {
                    title: 'Donnez une date de retour à vos joueurs',
                    description:
                        'Annoncez à l’avance si le wipe réinitialise aussi les plans. Si vous gérez plusieurs serveurs, publiez une adresse, un calendrier et les règles d’équipe pour chacun.',
                },
                {
                    title: 'Repérez les périodes de forte affluence',
                    description:
                        'Affichez le nombre de joueurs relevé sur le serveur. Avec Statistiques et le planificateur, comparez l’activité les jours de wipe et les jours suivants pour choisir vos prochains créneaux.',
                },
                {
                    title: 'Mobilisez les habitués autour des votes',
                    description:
                        'Fixez un objectif de votes pour le mois. Avec Vote, les membres qui participent peuvent recevoir une récompense sur votre site lorsque la communauté atteint cet objectif.',
                },
            ],
            setup: 'Ajoutez le port de requête A2S pour l’état du serveur Rust. Pour les commandes, activez rcon.web 1 et configurez l’accès dans Gérer la liaison. Vous pouvez définir un hôte distinct et activer TLS si la console propose un accès chiffré.',
            plugins: [
                {
                    slug: 'stats',
                    description:
                        'Comparez les pics de fréquentation d’un wipe à l’autre et exportez les relevés quotidiens du serveur sélectionné.',
                },
                {
                    slug: 'vote',
                    description:
                        'Reliez votre fiche Rust Servers pour encourager les votes. Accordez la récompense prévue après confirmation du vote.',
                },
            ],
        },
        fivem: {
            title: 'Gérez les candidatures de votre serveur FiveM RP',
            description:
                'Accueillez les joueurs de votre serveur FiveM RP. Expliquez la whitelist, affichez l’état de la ville et associez les comptes Cfx.re ou Steam.',
            intro: 'Répartissez les questions sur la whitelist entre les membres du staff grâce aux tickets privés d’Assistance. Les joueurs peuvent associer leur compte Cfx.re ou Steam, retrouver les étapes de candidature et vérifier si la ville est ouverte.',
            highlights: [
                'Règlement et étapes de candidature',
                'Identité Cfx.re ou Steam associée au profil',
                'État de la ville avant de lancer FiveM',
            ],
            features: [
                {
                    title: 'Expliquez comment rejoindre la ville',
                    description:
                        'Publiez les critères de candidature, les consignes pour la première session et le canal où obtenir une réponse. Mettez les annonces et les changements de règlement au même endroit.',
                },
                {
                    title: 'Utilisez l’identité que votre serveur reconnaît',
                    description:
                        'Reliez les profils au compte Cfx.re, proposé par défaut. Choisissez Steam dans les réglages si votre ville utilise cet identifiant pour retrouver les joueurs.',
                },
                {
                    title: 'Indiquez quand le serveur est disponible',
                    description:
                        'Le site affiche l’état et le nombre de joueurs renvoyés par FXServer. Publiez une annonce pour prévenir les habitants avant une maintenance ou une réouverture.',
                },
            ],
            setup: 'Choisissez FiveM dans Jeux et identités, puis activez la connexion Cfx.re ou Steam. Cfx.re exige un site en HTTPS. Ajoutez l’adresse de FXServer pour l’état via dynamic.json et configurez RCON seulement si votre équipe utilise les commandes de console.',
            plugins: [
                {
                    slug: 'support',
                    description:
                        'Recevez les questions sur la whitelist dans des tickets privés. Attribuez la demande à un membre du staff et gardez les notes de suivi réservées à l’équipe.',
                },
                {
                    slug: 'wiki',
                    description:
                        'Organisez le règlement par thème et publiez un guide des premiers pas en ville. Les joueurs peuvent retrouver une règle par recherche.',
                },
                {
                    slug: 'forum',
                    description:
                        'Discutez des propositions de la communauté et sondez les joueurs sur les futurs événements de la ville.',
                },
            ],
        },
        dayz: {
            title: 'CMS pour gérer votre communauté DayZ',
            description:
                'Traitez les signalements de votre serveur DayZ avec des profils liés à Steam et faites connaître votre communauté grâce aux votes vérifiés de TrackyServer.',
            intro: 'Pour réexaminer une sanction, retrouvez le profil du membre, son compte Steam associé et les échanges du ticket. Votre site sert aussi à faire connaître le serveur DayZ en invitant les joueurs à voter sur sa fiche.',
            highlights: ['Suivi des signalements', 'Comptes Steam associés', 'Votes vérifiés sur TrackyServer'],
            features: [
                {
                    title: 'Traiter les signalements en équipe',
                    description:
                        'Recevez les signalements et les contestations de sanctions dans des catégories de tickets distinctes. L’équipe retrouve les informations déjà transmises et peut répondre au membre depuis le même dossier.',
                },
                {
                    title: 'Ramener les joueurs après une mise à jour',
                    description:
                        'Publiez la collection Workshop à jour et l’heure de réouverture. Le statut du serveur principal indique aux joueurs s’ils peuvent déjà rejoindre la partie.',
                },
            ],
            setup: 'Sélectionnez DayZ dans Jeux et identités et activez la connexion Steam. Ajoutez le port de requête A2S pour afficher l’état. Pour les commandes, renseignez le port UDP et le mot de passe de BattlEye RCON dans Gérer la liaison.',
            plugins: [
                {
                    slug: 'wiki',
                    description:
                        'Retrouvez les versions précédentes du guide de mods pour expliquer ce qui a changé lors d’une mise à jour.',
                },
                {
                    slug: 'support',
                    description: 'Attribuez les tickets à votre équipe et conservez l’historique des réponses.',
                },
                {
                    slug: 'vote',
                    description: 'Récompensez sur le site les votes confirmés par TrackyServer pour votre fiche.',
                },
            ],
        },
        ark: {
            title: 'Gérez votre cluster ARK: Survival Evolved depuis un seul site',
            description:
                'Un CMS pour votre cluster ARK: Survival Evolved. Suivez les demandes des tribus, reliez les comptes Steam et envoyez les commandes à la bonne carte.',
            intro: 'Quand un transfert bloque entre deux cartes, votre équipe retrouve la demande de la tribu dans un ticket et peut envoyer une commande à la bonne instance. KraftInk réunit ces outils sur le site de votre cluster ARK: Survival Evolved.',
            highlights: ['Suivi des demandes de transfert', 'Console par carte', 'État du serveur principal'],
            features: [
                {
                    title: 'Traiter les demandes de transfert',
                    description:
                        'Demandez la carte de départ, celle de destination et les détails du transfert dans le ticket. Si le membre a associé son compte Steam, votre équipe peut le retrouver depuis son profil.',
                },
                {
                    title: 'Intervenir sur la carte concernée',
                    description:
                        'Créez une liaison de console pour chaque serveur du cluster. Quand votre équipe doit intervenir sur une carte, elle peut envoyer une commande à cette instance depuis le panneau.',
                },
            ],
            setup: 'Sélectionnez ARK: Survival Evolved dans Jeux et identités et activez Steam. Ajoutez le port de requête A2S pour afficher l’état et le nombre de joueurs du serveur principal. Renseignez le port TCP et le mot de passe de Source RCON pour chaque console à relier.',
            plugins: [
                {
                    slug: 'wiki',
                    description: 'Gardez une page par carte avec les taux, les mods et les transferts possibles.',
                },
                {
                    slug: 'support',
                    description:
                        'Créez une catégorie pour les transferts et attribuez les demandes aux personnes qui gèrent les cartes concernées.',
                },
                {
                    slug: 'vote',
                    description:
                        'Reliez votre fiche ARK Servers et configurez des récompenses sur le site pour les votes vérifiés.',
                },
            ],
        },
        sevendaystodie: {
            title: 'Site et boutique pour serveur 7 Days to Die',
            description:
                'Faites revenir vos joueurs après un wipe sur 7 Days to Die, vendez des grades de soutien sur le site et récompensez les votes confirmés par votre annuaire.',
            intro: 'Donnez à vos joueurs une adresse qu’ils retrouveront d’une partie à l’autre. Avec KraftInk, ils peuvent vérifier si le serveur est ouvert, voter pour le faire connaître et acheter un grade de soutien sur le site.',
            highlights: [
                'Boutique de grades de soutien',
                'Votes vérifiés sur votre annuaire',
                'État du serveur avant de rejoindre',
            ],
            features: [
                {
                    title: 'Faire revenir les joueurs après un wipe',
                    description:
                        'Annoncez la date de réouverture, la nouvelle carte et les mods à réinstaller. Les habitués gardent leur compte sur le site et peuvent vérifier l’état du serveur avant de relancer le jeu.',
                },
                {
                    title: 'Faire connaître votre serveur avec les votes',
                    description:
                        'Reliez votre fiche 7 Days to Die Servers. Les votes de vos joueurs aident le serveur à remonter dans le classement de l’annuaire. Sur KraftInk, fixez un objectif commun et récompensez les participants quand il est atteint.',
                },
            ],
            setup: 'Sélectionnez 7 Days to Die dans Jeux et identités et activez Steam. Ajoutez le port de requête A2S pour l’état. Pour les commandes, renseignez le port et le mot de passe de la console Telnet sur un réseau de confiance ou via un tunnel.',
            plugins: [
                {
                    slug: 'shop',
                    description:
                        'Vendez un grade de soutien attribué sur le site après paiement pour aider à couvrir les frais d’hébergement.',
                },
                {
                    slug: 'vote',
                    description:
                        'Confirmez les votes de 7 Days to Die Servers et attribuez un grade sur le site au palier que vous avez choisi.',
                },
                {
                    slug: 'forum',
                    description:
                        'Faites choisir le réglage de la prochaine partie à vos habitués, par exemple la fréquence des lunes de sang.',
                },
            ],
        },
        counterstrike2: {
            title: 'Un site pour vos serveurs communautaires Counter-Strike 2',
            description:
                'Faites trouver vos serveurs CS2 et vos matchs communautaires. Affichez le nombre de joueurs, associez les comptes Steam et choisissez vos créneaux avec Stats.',
            intro: 'Donnez à vos joueurs l’adresse du bon serveur pour un retake ou un entraînement. Pour votre serveur principal, KraftInk indique combien de joueurs sont déjà connectés avant qu’ils lancent Counter-Strike 2.',
            highlights: [
                'Nombre de joueurs avant de rejoindre',
                'Comptes Steam associés au site',
                'Affluence pour préparer les matchs',
            ],
            features: [
                {
                    title: 'Orienter les joueurs vers le bon serveur',
                    description:
                        'Listez les adresses par mode de jeu avec les règles et les cartes jouées. Lors d’une soirée communautaire, indiquez le serveur prévu, l’horaire et la discussion d’inscription.',
                },
                {
                    title: 'Retrouver les participants d’un match à l’autre',
                    description:
                        'Les membres associent leur compte Steam à leur profil sur le site. Demandez-leur de répondre à la discussion du match avec ce profil pour savoir qui prévoit de participer.',
                },
            ],
            setup: 'Sélectionnez Counter-Strike 2 dans Jeux et identités et activez Steam. Ajoutez le port de requête A2S pour l’état, puis le port TCP et le mot de passe de Source RCON si votre équipe doit envoyer des commandes.',
            plugins: [
                {
                    slug: 'stats',
                    description:
                        'Repérez les heures où votre serveur accueille le plus de joueurs pour choisir un créneau de match communautaire.',
                },
                {
                    slug: 'forum',
                    description:
                        'Ouvrez une discussion par soirée pour recueillir les inscriptions et prévenir les participants en cas de changement.',
                },
                {
                    slug: 'vote',
                    description:
                        'Connectez votre fiche Counter-Strike Servers pour vérifier les votes et récompenser les membres sur le site.',
                },
            ],
        },
        teamfortress2: {
            title: 'Un site pour réunir les habitués de votre serveur Team Fortress 2',
            description:
                'Préparez vos soirées Team Fortress 2 avec des sondages de cartes, les liens de téléchargement et l’état du serveur. Les membres peuvent associer leur compte Steam.',
            intro: 'Préparez votre prochaine soirée Payload avec les habitués. Faites-leur choisir des cartes, annoncez la rotation retenue et donnez-leur une adresse où voir si la partie a déjà commencé.',
            highlights: [
                'Sondages pour vos rotations',
                'Accès aux cartes personnalisées',
                'Nombre de joueurs connectés',
            ],
            features: [
                {
                    title: 'Préparer une soirée de cartes personnalisées',
                    description:
                        'Rassemblez les liens de téléchargement, l’adresse du serveur et l’heure de début. Les joueurs retrouvent ce qu’ils doivent installer et consultent le compteur du serveur principal avant de rejoindre.',
                },
                {
                    title: 'Garder les discussions entre deux parties',
                    description:
                        'Vos membres peuvent associer leur compte Steam et utiliser leur profil pour proposer une carte ou faire un retour après la soirée. Les discussions restent consultables pour préparer la prochaine rotation.',
                },
            ],
            setup: 'Sélectionnez Team Fortress 2 dans Jeux et identités et activez Steam. Renseignez le port de requête A2S. Pour envoyer des commandes depuis le panneau, ajoutez le port TCP et le mot de passe de Source RCON.',
            plugins: [
                {
                    slug: 'forum',
                    description:
                        'Soumettez plusieurs cartes à un sondage, puis annoncez la sélection dans la discussion.',
                },
                {
                    slug: 'wiki',
                    description:
                        'Gardez un guide d’installation pour les cartes que vous remettez régulièrement dans la rotation.',
                },
                {
                    slug: 'vote',
                    description:
                        'Reliez votre fiche Team Fortress 2 Servers pour suivre les votes vérifiés et leur fixer un objectif collectif sur le site.',
                },
            ],
        },
        unturned: {
            title: 'Un site pour gérer votre serveur Unturned RP ou survie',
            description:
                'Un CMS pour votre serveur Unturned RP ou survie. Gérez les tickets et les profils Steam, et proposez un grade de soutien pour contribuer à l’hébergement.',
            intro: 'Quand un incident survient dans une zone RP ou PvP, votre équipe retrouve l’historique de la demande et le profil du membre. Les joueurs consultent le règlement et peuvent soutenir le serveur depuis le même site.',
            highlights: ['Tickets pour les signalements', 'Comptes Steam associés', 'Grades de soutien sur le site'],
            features: [
                {
                    title: 'Donner les bonnes règles dès l’arrivée',
                    description:
                        'Regroupez la collection Workshop, les zones sûres et les règles de PvP sur le site. Si vous changez de carte, annoncez la date et les nouveaux mods à installer au même endroit.',
                },
                {
                    title: 'Garder les signalements au même endroit',
                    description:
                        'Les membres peuvent associer leur compte Steam et envoyer un ticket avec la zone, l’heure et une capture de l’incident. Les modérateurs retrouvent l’historique de la demande quand ils reprennent le dossier.',
                },
            ],
            setup: 'Sélectionnez Unturned dans Jeux et identités et activez Steam. Ajoutez le port de requête A2S pour afficher l’état. Pour envoyer des commandes, installez d’abord un composant compatible Source RCON sur le serveur de jeu.',
            plugins: [
                {
                    slug: 'support',
                    description:
                        'Séparez les signalements RP, les litiges PvP et les problèmes de connexion dans des catégories de tickets.',
                },
                {
                    slug: 'shop',
                    description:
                        'Proposez un grade de soutien sur le site aux membres qui souhaitent contribuer à l’hébergement.',
                },
                {
                    slug: 'vote',
                    description:
                        'Renvoyez les membres vers votre fiche Unturned Servers et récompensez les votes vérifiés sur le site.',
                },
            ],
        },
        projectzomboid: {
            title: 'Créez le site de votre serveur Project Zomboid',
            description:
                'Créez un site pour votre serveur Project Zomboid avec un forum de recrutement, des tickets pour les problèmes de mods et la liaison des comptes Steam.',
            intro: 'Recrutez de nouveaux survivants entre deux saisons et gardez les groupes en contact quand le monde repart à zéro. Ils retrouvent leur équipe sur le forum et peuvent demander de l’aide si la nouvelle collection de mods bloque leur arrivée.',
            highlights: [
                'Recrutement des groupes de survivants',
                'Comptes Steam associés',
                'Tickets privés pour les problèmes de mods',
            ],
            features: [
                {
                    title: 'Reformer les groupes après une remise à zéro',
                    description:
                        'Ouvrez les recrutements sur le forum avant le changement de carte. Dans votre annonce, donnez la date de reprise, ce que les joueurs conservent et le lien vers la collection Workshop à installer.',
                },
                {
                    title: 'Distinguer une panne d’un problème de mods',
                    description:
                        'Après un redémarrage, les joueurs peuvent vérifier si le serveur répond. Si le chargement bloque encore, ils peuvent envoyer le nom du mod et la version du jeu dans un ticket privé.',
                },
            ],
            setup: 'Sélectionnez Project Zomboid dans Jeux et identités. Activez Steam dans les connexions externes et renseignez le port de requête A2S pour afficher l’état. Configurez Source RCON si vous voulez envoyer des commandes de console.',
            plugins: [
                {
                    slug: 'forum',
                    description: 'Réservez des catégories aux membres et épinglez le fil de recrutement de la saison.',
                },
                {
                    slug: 'support',
                    description:
                        'Ajoutez une catégorie pour les problèmes de connexion et demandez une capture dans le ticket.',
                },
                {
                    slug: 'vote',
                    description:
                        'Ajoutez la fiche de votre serveur sur un annuaire compatible et attribuez un grade sur le site aux membres qui atteignent un palier de votes vérifiés.',
                },
            ],
        },
        redm: {
            title: 'Un site pour recruter sur votre serveur RedM RP',
            description:
                'Présentez votre serveur RedM RP, publiez les règles et traitez les candidatures de personnages en privé avec KraftInk.',
            intro: 'Traitez les candidatures de votre serveur RedM en privé. Les joueurs déposent leur fiche de personnage, votre équipe se répartit les dossiers et les recrues retrouvent les consignes pour leur première session.',
            highlights: [
                'Candidatures dans des tickets privés',
                'Règles RP accessibles avant de jouer',
                'État de FXServer sur le site',
            ],
            features: [
                {
                    title: 'Recevoir des candidatures complètes',
                    description:
                        'Avec Assistance, ajoutez des questions propres aux candidatures. Demandez par exemple le nom du personnage et sa motivation, puis assignez le dossier à un membre de l’équipe.',
                },
                {
                    title: 'Garder les informations de connexion à portée de main',
                    description:
                        'Indiquez comment rejoindre le serveur après acceptation et affichez son état depuis FXServer. Les membres peuvent renseigner dans leur profil la licence Rockstar ou l’identifiant Cfx utilisé sur votre serveur.',
                },
            ],
            setup: 'Sélectionnez RedM dans Jeux et identités. Renseignez l’adresse de FXServer pour afficher l’état via dynamic.json. Pour utiliser les commandes de votre serveur depuis KraftInk, configurez aussi son accès RCON.',
            plugins: [
                {
                    slug: 'support',
                    description:
                        'Séparez les candidatures et les signalements RP en catégories privées avec leurs propres questions.',
                },
                {
                    slug: 'wiki',
                    description:
                        'Publiez les règles de création de personnage et les rôles accessibles. Réservez les procédures internes à l’équipe de modération.',
                },
            ],
        },
        arkascended: {
            title: 'Un site pour votre cluster ARK: Survival Ascended',
            description:
                'Gérez votre cluster ARK: Survival Ascended depuis KraftInk. Publiez les règles de transfert et comparez la fréquentation des cartes dans le panneau.',
            intro: 'Donnez aux tribus un site pour préparer leurs transferts entre les cartes. Votre équipe peut suivre la fréquentation du cluster et programmer une récompense qui attend le joueur sur la carte choisie.',
            highlights: [
                'Cartes et règles de transfert',
                'Fréquentation par carte dans le panneau',
                'Présence en jeu par identifiant EOS',
            ],
            features: [
                {
                    title: 'Trouver la bonne carte avant de se connecter',
                    description:
                        'Présentez les cartes ouvertes au crossplay et leurs règles de transfert. Choisissez le serveur principal dont vous voulez afficher l’état et le nombre de joueurs sur le site.',
                },
                {
                    title: 'Attendre le joueur pour une livraison',
                    description:
                        'Les membres renseignent leur identifiant EOS sur le site. Avec une commande compatible, une livraison peut attendre que cet identifiant soit détecté sur le serveur de destination.',
                },
            ],
            setup: 'Activez RCON dans GameUserSettings.ini avec RCONEnabled, RCONPort et ServerAdminPassword. Choisissez ARK: Survival Ascended dans KraftInk, puis ajoutez chaque serveur et configurez sa liaison RCON.',
            plugins: [
                {
                    slug: 'stats',
                    description:
                        'Repérez les pics de fréquentation de la carte choisie pour planifier un événement ou une maintenance.',
                },
                {
                    slug: 'shop',
                    description:
                        'Créez un grade de soutien pour financer le cluster et donnez aux soutiens accès à une section réservée sur le site.',
                },
            ],
        },
        palworld: {
            title: 'Créez le site de votre serveur Palworld',
            description:
                'Affichez l’état de votre serveur Palworld, aidez les guildes à recruter et annoncez vos maintenances en jeu depuis KraftInk.',
            intro: 'Prévenez les joueurs en jeu et sauvegardez le monde depuis le panneau avant une maintenance. Sur le site, les nouveaux joueurs peuvent trouver une guilde et vérifier quand le serveur répond de nouveau.',
            highlights: ['État et nombre de joueurs', 'Annonces et sauvegarde en jeu', 'Discussions pour les guildes'],
            features: [
                {
                    title: 'Prévenir les joueurs avant une maintenance',
                    description:
                        'Une fois le serveur dédié relié, envoyez une annonce en jeu et lancez une sauvegarde depuis le panneau. Les joueurs peuvent ensuite consulter l’état du serveur sur le site.',
                },
                {
                    title: 'Modérer avec l’identifiant Palworld',
                    description:
                        'Les membres peuvent renseigner leur identifiant Palworld dans leur profil. Avec les droits nécessaires, votre équipe peut utiliser cet identifiant dans le panneau pour expulser un joueur, le bannir ou lever son bannissement.',
                },
            ],
            setup: 'Activez RESTAPIEnabled sur votre serveur dédié. Choisissez Palworld dans KraftInk, puis renseignez le port REST et le mot de passe administrateur. Activez TLS si l’API est accessible en HTTPS.',
            plugins: [
                {
                    slug: 'forum',
                    description:
                        'Ouvrez une catégorie de recrutement et donnez aux guildes un fil où annoncer leurs expéditions.',
                },
                {
                    slug: 'stats',
                    description:
                        'Consultez l’historique du nombre de joueurs pour repérer les heures les plus calmes avant un redémarrage.',
                },
            ],
        },
        satisfactory: {
            title: 'Un site pour votre serveur Satisfactory et ses projets',
            description:
                'Gardez les plans de l’usine, les décisions de l’équipe et l’état du serveur Satisfactory au même endroit avec KraftInk.',
            intro: 'Passez le relais même quand vous jouez à des horaires différents. Vos partenaires retrouvent le plan retenu, la ligne de production à reprendre et l’état du serveur avant de lancer le jeu.',
            highlights: [
                'Plans et consignes pour la relève',
                'Sondages pour les prochains chantiers',
                'État du serveur dédié',
            ],
            features: [
                {
                    title: 'Reprendre un chantier sans chercher les consignes',
                    description:
                        'Réservez une section du Wiki à votre équipe. Pour chaque chantier, notez ce qui est terminé et le prochain travail à reprendre, par exemple le raccordement d’une ligne ferroviaire.',
                },
                {
                    title: 'Vérifier l’état du serveur avant une intervention',
                    description:
                        'Le panneau affiche l’état du serveur dédié et son nombre de joueurs via l’API HTTPS. Les administrateurs peuvent y lancer les commandes prises en charge par le serveur.',
                },
            ],
            setup: 'Sélectionnez Satisfactory dans Jeux et identités. Générez un jeton avec server.GenerateAPIToken dans la console dédiée, puis ajoutez l’adresse HTTPS, le port et le jeton dans KraftInk. Les membres peuvent renseigner leur identifiant Steam ou Epic.',
            plugins: [
                {
                    slug: 'wiki',
                    description:
                        'Publiez les plans ferroviaires et les conventions de nommage. Consultez l’historique si l’équipe a besoin de retrouver l’ancien tracé.',
                },
                {
                    slug: 'forum',
                    description:
                        'Soumettez deux emplacements d’usine au vote et conservez la décision avec les arguments du groupe.',
                },
            ],
        },
        conanexiles: {
            title: 'Un site pour les clans de votre serveur Conan Exiles',
            description:
                'Publiez les horaires de raid et les règles de votre serveur Conan Exiles. Traitez les signalements des clans et affichez l’état du serveur.',
            intro: 'Donnez aux clans un endroit où vérifier les règles avant un raid et signaler un incident après. L’équipe peut traiter chaque contestation dans un ticket privé, avec l’heure des faits et les captures du joueur.',
            highlights: [
                'Horaires et règles de raid',
                'Signalements privés avec pièces jointes',
                'État du serveur et accès à la console',
            ],
            features: [
                {
                    title: 'Annoncer les changements avant le prochain raid',
                    description:
                        'Publiez le nouveau créneau et sa date d’entrée en vigueur. Gardez le règlement et la liste des mods à la même adresse pour que les recrues les retrouvent.',
                },
                {
                    title: 'Donner à l’équipe les moyens de traiter un incident',
                    description:
                        'Assignez le ticket à un modérateur pour garder les échanges au même endroit. Si une intervention en jeu est nécessaire, les membres autorisés peuvent envoyer une commande depuis le panneau.',
                },
            ],
            setup: 'Sélectionnez Conan Exiles dans Jeux et identités et renseignez le port de requête pour l’état. Activez RconEnabled dans la section RconPlugin de Game.ini pour les commandes et indiquez RconPort et RconPassword. Les membres peuvent renseigner leur identifiant de plateforme.',
            plugins: [
                {
                    slug: 'support',
                    description:
                        'Créez une catégorie de signalements de raid avec ses propres questions et ajoutez des notes réservées aux modérateurs.',
                },
                {
                    slug: 'shop',
                    description:
                        'Proposez un grade de soutien sur le site aux membres qui souhaitent participer aux frais du serveur.',
                },
            ],
        },
    },
} satisfies GameCopy;
