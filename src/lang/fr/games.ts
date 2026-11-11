import type { GameCopy } from '../../lib/translations';

export default {
    highlightsTitle: 'Intégration au serveur',
    setupTitle: 'Relier votre serveur',
    guideLink: 'Lire le guide de connexion',
    installationLink: 'Installer KraftInk',
    backLink: 'Tous les jeux compatibles',
    pluginsTitle: 'Plugins officiels',
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
            title: 'CMS pour serveur Minecraft Java',
            description:
                'KraftInk relie votre site Minecraft Java à Paper, Velocity ou à un serveur moddé. Associez les comptes Minecraft et envoyez vos récompenses avec KraftLink.',
            intro: 'Survie entre amis, réseau de mini-jeux ou serveur moddé, donnez à vos joueurs une adresse pour retrouver les règles, les annonces et les infos de connexion.',
            highlights: [
                'Liaison des comptes Microsoft',
                'Prise en charge de Geyser et Floodgate',
                'KraftLink, ping et RCON',
            ],
            features: [
                {
                    title: 'Vérifier les comptes Java et Bedrock',
                    description:
                        'Les joueurs Java associent leur compte Microsoft. Ceux qui passent par Geyser peuvent confirmer leur identité en jeu sur un serveur compatible équipé de Floodgate et KraftLink.',
                },
                {
                    title: 'Relier un proxy et ses serveurs',
                    description:
                        'Créez une liaison pour Velocity et une pour chaque serveur qui utilise KraftLink. Une commande destinée à Paper arrive ainsi sur la bonne instance.',
                },
                {
                    title: 'Livrer une récompense à la connexion',
                    description:
                        'Avec une extension compatible, choisissez le serveur de livraison. KraftLink peut attendre que le joueur rejoigne ce serveur avant d’exécuter la commande.',
                },
            ],
            setup: 'Sélectionnez Minecraft dans Jeux et identités. Choisissez Ping pour l’état public, RCON pour les commandes de console ou KraftLink pour les commandes et la présence des joueurs.',
            plugins: [
                {
                    slug: 'shop',
                    description:
                        'Vendez un grade en jeu et livrez-le via KraftLink si votre serveur fournit la commande d’attribution.',
                },
                {
                    slug: 'vote',
                    description:
                        'Vérifiez les votes sur les annuaires Minecraft compatibles et récompensez les joueurs qui atteignent un palier.',
                },
                {
                    slug: 'skins',
                    description:
                        'Les membres qui ont vérifié leur compte Java peuvent personnaliser leur skin et leur cape depuis leur profil.',
                },
            ],
        },
        minecraftbedrock: {
            title: 'CMS pour serveur Minecraft Bedrock',
            description:
                'Affichez l’état de votre serveur Minecraft Bedrock sur votre site. Sur Cloudburst Nukkit, KraftLink vérifie les gamertags Xbox et envoie des commandes.',
            intro: 'Indiquez à vos joueurs l’adresse et le port de votre monde Bedrock. Avec un serveur Nukkit relié à KraftLink, ils peuvent aussi associer leur gamertag Xbox directement en jeu.',
            highlights: ['Ping UDP Bedrock', 'Connecteur Cloudburst Nukkit', 'Vérification des gamertags Xbox'],
            features: [
                {
                    title: 'Afficher l’état d’un serveur dédié Bedrock',
                    description:
                        'Le ping UDP récupère l’état du serveur et le nombre de joueurs. Renseignez le port de jeu indiqué dans la configuration de votre Bedrock Dedicated Server.',
                },
                {
                    title: 'Vérifier un gamertag sur Nukkit',
                    description:
                        'Activez l’authentification Xbox sur Cloudburst Nukkit et reliez-le à KraftLink. Le joueur utilise le code de vérification en jeu, puis confirme le gamertag détecté sur le site.',
                },
                {
                    title: 'Envoyer une commande à un joueur Nukkit',
                    description:
                        'KraftLink peut attendre l’arrivée du joueur et utiliser son gamertag dans la commande, même quand il contient des espaces.',
                },
            ],
            setup: 'Dans Jeux et identités, choisissez Minecraft Bedrock. Utilisez le mode Ping pour un Bedrock Dedicated Server ou créez une liaison KraftLink pour un serveur Cloudburst Nukkit.',
            plugins: [
                {
                    slug: 'shop',
                    description:
                        'Proposez un grade de soutien sur le site pour les membres qui souhaitent contribuer au serveur Bedrock.',
                },
                {
                    slug: 'forum',
                    description: 'Organisez un sondage pour choisir la prochaine construction de votre monde Bedrock.',
                },
            ],
        },
        hytale: {
            title: 'CMS pour serveur Hytale',
            description:
                'Présentez votre monde Hytale et affichez l’état du serveur avec KraftLink. Les joueurs déclarent leur profil et PlayerDB peut retrouver leur pseudo ou UUID.',
            intro: 'Présentez votre monde Hytale aux nouveaux joueurs. Une page peut expliquer comment rejoindre l’aventure, tandis que vos annonces suivent l’ouverture du serveur et les mises à jour.',
            highlights: ['Profils joueurs Hytale', 'Recherche publique de profil facultative', 'Connecteur KraftLink'],
            features: [
                {
                    title: 'Retrouver les profils Hytale',
                    description:
                        'Les membres déclarent leur identité Hytale sur le site. Si vous activez PlayerDB, la recherche publique peut retrouver leur profil par pseudo ou UUID.',
                },
                {
                    title: 'Relier un serveur Hytale',
                    description:
                        'KraftLink remonte l’état du serveur et la présence des joueurs. Depuis le panneau, vous pouvez aussi envoyer les commandes autorisées dans la configuration du connecteur.',
                },
            ],
            setup: 'Sélectionnez Hytale dans Jeux et identités, puis créez une liaison KraftLink. Installez le connecteur compatible dans le dossier mods du serveur et renseignez l’URL du site et le jeton de liaison.',
            plugins: [
                {
                    slug: 'vote',
                    description:
                        'Reliez votre fiche Hytale Servers pour vérifier les votes et récompenser les membres qui soutiennent votre serveur.',
                },
                {
                    slug: 'wiki',
                    description:
                        'Regroupez vos guides de départ et les règles de vos mondes dans des pages que les joueurs peuvent retrouver par recherche.',
                },
            ],
        },
        garrysmod: {
            title: 'CMS pour serveur Garry’s Mod (GMod)',
            description:
                'Créez le site de votre serveur GMod avec son règlement DarkRP et sa collection Workshop. Reliez les comptes Steam et connectez le serveur via A2S ou RCON.',
            intro: 'Indiquez quoi télécharger avant la première connexion à votre serveur GMod. Pour un DarkRP, présentez aussi les métiers, le règlement et la marche à suivre pour rejoindre le staff.',
            highlights: ['Steam OpenID', 'État et nombre de joueurs via A2S', 'Commandes Source RCON'],
            features: [
                {
                    title: 'Préparer les nouveaux joueurs',
                    description:
                        'Regroupez sur une page l’adresse du serveur, les cartes jouées et le lien vers votre collection Workshop. Les joueurs savent quels addons installer avant de lancer Garry’s Mod.',
                },
                {
                    title: 'Retrouver un membre par son compte Steam',
                    description:
                        'Activez Steam OpenID pour que les joueurs puissent associer un compte Steam vérifié à leur profil KraftInk.',
                },
                {
                    title: 'Afficher les places et relier la console',
                    description:
                        'La requête A2S indique si le serveur répond et combien de joueurs sont connectés. Source RCON permet d’envoyer les commandes prises en charge par le serveur et ses addons.',
                },
            ],
            setup: 'Sélectionnez Garry’s Mod dans Jeux et identités. Renseignez le port de requête A2S pour afficher l’état du serveur. Pour les commandes, choisissez RCON et configurez le port TCP et le mot de passe dans Gérer la liaison.',
            plugins: [
                {
                    slug: 'vote',
                    description:
                        'Vérifiez les votes de Garry’s Mod Servers et créditez le solde des membres sur le site en récompense.',
                },
                {
                    slug: 'forum',
                    description:
                        'Soumettez les changements de métiers DarkRP aux joueurs dans un sondage et discutez des propositions dans le même fil.',
                },
            ],
        },
        rust: {
            title: 'CMS pour serveur Rust',
            description:
                'Publiez votre calendrier de wipes Rust sur KraftInk. Les membres associent leur compte Steam et le serveur se connecte via A2S et WebRCON.',
            intro: 'Les joueurs qui reviennent au prochain wipe veulent connaître la date, la carte et la taille maximale des équipes. Publiez ces informations sur le site de votre serveur Rust.',
            highlights: ['Steam OpenID', 'État du serveur via A2S', 'WebRCON avec TLS facultatif'],
            features: [
                {
                    title: 'Annoncer le prochain wipe',
                    description:
                        'Précisez si la réinitialisation concerne aussi les plans. Si vous gérez plusieurs serveurs, indiquez les horaires et les règles propres à chacun.',
                },
                {
                    title: 'Séparer l’adresse de jeu et la console',
                    description:
                        'Le site interroge le serveur de jeu via A2S. Si votre console WebRCON a une adresse dédiée, renseignez-la séparément et activez TLS lorsque le serveur ou son proxy fournit un accès chiffré.',
                },
            ],
            setup: 'Activez WebRCON avec rcon.web 1 sur le serveur. Renseignez le port de requête A2S dans sa fiche, puis le port RCON, le mot de passe et le mode de chiffrement dans Gérer la liaison.',
            plugins: [
                {
                    slug: 'stats',
                    description:
                        'Comparez le nombre de joueurs et les pics de fréquentation autour de deux wipes successifs.',
                },
                {
                    slug: 'vote',
                    description:
                        'Reliez votre fiche Rust Servers et récompensez les membres après confirmation de leur vote.',
                },
            ],
        },
        fivem: {
            title: 'CMS pour serveur FiveM',
            description:
                'Publiez le règlement et les étapes pour rejoindre votre serveur FiveM RP. KraftInk associe les comptes Cfx.re ou Steam et affiche l’état de FXServer.',
            intro: 'Pour rejoindre votre ville, les nouveaux joueurs doivent savoir où lire le règlement et comment passer la whitelist. Expliquez ces étapes sur le site de votre serveur FiveM.',
            highlights: ['Identité Cfx.re ou Steam', 'État du FXServer', 'Commandes RCON FXServer'],
            features: [
                {
                    title: 'Organiser l’arrivée en ville',
                    description:
                        'Expliquez la procédure de candidature, les rôles disponibles et les règles des premières sessions. Publiez les annonces de la ville au même endroit.',
                },
                {
                    title: 'Choisir entre Cfx.re et Steam',
                    description:
                        'Cfx.re est le fournisseur par défaut et demande un site en HTTPS. Choisissez Steam dans les réglages si c’est ainsi que votre serveur identifie les joueurs.',
                },
                {
                    title: 'Afficher l’activité de FXServer',
                    description:
                        'KraftInk lit l’état du serveur et le nombre de joueurs via dynamic.json. Activez RCON côté serveur pour envoyer les commandes disponibles dans votre installation.',
                },
            ],
            setup: 'Après avoir sélectionné FiveM dans Jeux et identités, activez la connexion externe Cfx.re ou Steam. Renseignez l’adresse de FXServer et configurez RCON dans Gérer la liaison si vous utilisez les commandes.',
            plugins: [
                {
                    slug: 'support',
                    description:
                        'Traitez les questions sur la whitelist dans des tickets privés que votre équipe peut se répartir.',
                },
                {
                    slug: 'shop',
                    description:
                        'Proposez un grade de soutien qui donne accès à un espace réservé sur le site de votre ville.',
                },
            ],
        },
        dayz: {
            title: 'CMS pour serveur DayZ',
            description:
                'Publiez la carte, les mods et les horaires de redémarrage de votre serveur DayZ. KraftInk associe les comptes Steam et se relie à A2S et BattlEye RCON.',
            intro: 'Avant de partir en expédition sur votre serveur DayZ, vos joueurs doivent trouver les bons mods, les horaires de redémarrage et vos règles de survie.',
            highlights: ['Steam OpenID', 'État du serveur via A2S', 'BattlEye RCON'],
            features: [
                {
                    title: 'Tenir la liste de mods à jour',
                    description:
                        'Indiquez la carte et la collection requise. Lors d’un changement de mods, publiez la date de mise à jour et les étapes à suivre avant de se reconnecter.',
                },
                {
                    title: 'Relier la console BattlEye',
                    description:
                        'Le site affiche l’état du serveur via A2S. Pour administrer le serveur depuis KraftInk, configurez la console BattlEye RCON avec son port UDP et son mot de passe.',
                },
            ],
            setup: 'Choisissez DayZ dans Jeux et identités, puis ajoutez le port de requête A2S à la fiche du serveur. Renseignez les accès BattlEye dans Gérer la liaison.',
            plugins: [
                {
                    slug: 'wiki',
                    description:
                        'Gardez l’historique du guide d’installation des mods pour retrouver les changements entre deux mises à jour.',
                },
                {
                    slug: 'vote',
                    description:
                        'Vérifiez les votes de votre fiche TrackyServer et attribuez une récompense aux membres après confirmation.',
                },
            ],
        },
        ark: {
            title: 'CMS pour serveur ARK: Survival Evolved',
            description:
                'Présentez les cartes et les règles de transfert de votre cluster ARK: Survival Evolved. Reliez les comptes Steam et connectez les serveurs via A2S et RCON.',
            intro: 'Sur un cluster ARK: Survival Evolved, un nouveau joueur doit choisir sa carte et savoir ce qu’il peut transférer. Réunissez les règles de chaque carte sur un même site.',
            highlights: ['Steam OpenID', 'État du serveur via A2S', 'Commandes Source RCON'],
            features: [
                {
                    title: 'Orienter les joueurs dans le cluster',
                    description:
                        'Indiquez les cartes ouvertes, les mods à installer et les règles de transfert. Les multiplicateurs de récolte ou d’élevage aident les joueurs à choisir où commencer.',
                },
                {
                    title: 'Cibler le serveur de la bonne carte',
                    description:
                        'Affichez l’état du serveur principal via A2S. Avec une liaison Source RCON par serveur, vos commandes peuvent cibler la carte concernée.',
                },
            ],
            setup: 'Sélectionnez ARK: Survival Evolved dans Jeux et identités. Renseignez le port de requête A2S pour l’état, puis le port TCP et le mot de passe de Source RCON pour les commandes.',
            plugins: [
                {
                    slug: 'wiki',
                    description:
                        'Consacrez une page à chaque carte du cluster avec ses multiplicateurs et les transferts autorisés.',
                },
                {
                    slug: 'vote',
                    description:
                        'Vérifiez les votes sur ARK Servers et récompensez les membres qui se distinguent au classement mensuel.',
                },
            ],
        },
        sevendaystodie: {
            title: 'CMS pour serveur 7 Days to Die',
            description:
                'Préparez les joueurs de votre serveur 7 Days to Die avec le règlement et les mods. KraftInk prend en charge les comptes Steam, A2S et la console Telnet.',
            intro: 'Vos joueurs préparent la prochaine lune de sang. Donnez-leur un endroit pour vérifier les réglages du monde, les règles des bases et le pack de mods à installer.',
            highlights: ['Steam OpenID', 'État du serveur via A2S', 'Console Telnet'],
            features: [
                {
                    title: 'Expliquer la difficulté de votre partie',
                    description:
                        'Publiez la fréquence des lunes de sang, les règles de construction et les réglages du butin. Annoncez les réinitialisations assez tôt pour que les joueurs puissent s’organiser.',
                },
                {
                    title: 'Envoyer des commandes via Telnet',
                    description:
                        'La console du serveur dédié accepte les commandes depuis KraftInk quand elle est activée et protégée par mot de passe. Utilisez un réseau de confiance ou un tunnel.',
                },
            ],
            setup: 'Renseignez le port de requête A2S pour afficher l’état. Pour envoyer des commandes, indiquez le port et le mot de passe de la console Telnet dans Gérer la liaison.',
            plugins: [
                {
                    slug: 'forum',
                    description:
                        'Demandez aux joueurs de choisir le prochain défi ou les réglages d’une nouvelle partie dans un sondage.',
                },
                {
                    slug: 'vote',
                    description:
                        'Vérifiez les votes de 7 Days to Die Servers et offrez une récompense au bout de plusieurs votes confirmés.',
                },
            ],
        },
        counterstrike2: {
            title: 'CMS pour serveur Counter-Strike 2',
            description:
                'Publiez les rotations et les matchs de votre serveur communautaire CS2. KraftInk affiche les places via A2S et prend en charge Steam et Source RCON.',
            intro: 'Un serveur de retake, un serveur d’entraînement et une soirée de matchs ont chacun leurs règles. Montrez à vos joueurs où se connecter et comment participer.',
            highlights: ['Steam OpenID', 'État et nombre de joueurs via A2S', 'Commandes Source RCON'],
            features: [
                {
                    title: 'Donner les bons accès avant un match',
                    description:
                        'Publiez la rotation des cartes et les instructions de connexion pour chaque mode. Pour un match communautaire, indiquez l’horaire et la procédure d’inscription.',
                },
                {
                    title: 'Vérifier l’affluence avant de rejoindre',
                    description:
                        'A2S affiche l’état et le nombre de joueurs. Steam OpenID permet aux membres d’associer le compte Steam qu’ils utilisent dans votre communauté.',
                },
            ],
            setup: 'Sélectionnez Counter-Strike 2 dans Jeux et identités. Configurez le port de requête A2S et ajoutez le port TCP et le mot de passe de Source RCON pour les commandes.',
            plugins: [
                {
                    slug: 'stats',
                    description: 'Consultez l’affluence par heure pour choisir un créneau de match communautaire.',
                },
                {
                    slug: 'vote',
                    description:
                        'Reliez votre fiche Counter-Strike Servers pour vérifier les votes et récompenser les membres.',
                },
            ],
        },
        teamfortress2: {
            title: 'CMS pour serveur Team Fortress 2',
            description:
                'Créez un site pour les cartes personnalisées et les soirées de votre serveur TF2. KraftInk relie Steam et la console Source RCON, et affiche l’état via A2S.',
            intro: 'Annoncez votre prochaine soirée Payload, les cartes personnalisées et le serveur à rejoindre. Vos habitués retrouvent ces informations entre deux parties de Team Fortress 2.',
            highlights: ['Steam OpenID', 'État et nombre de joueurs via A2S', 'Commandes Source RCON'],
            features: [
                {
                    title: 'Présenter les cartes de la soirée',
                    description:
                        'Indiquez les modes joués, la rotation prévue et les téléchargements nécessaires. Une page par événement permet aux joueurs de retrouver les règles avant la partie.',
                },
                {
                    title: 'Afficher les places sur votre serveur TF2',
                    description:
                        'Le compteur A2S indique combien de joueurs sont connectés. Utilisez la console Source RCON pour envoyer les commandes disponibles sur le serveur et ses plugins.',
                },
            ],
            setup: 'Sélectionnez Team Fortress 2 dans Jeux et identités. Renseignez le port de requête A2S et configurez le port TCP et le mot de passe de Source RCON pour les commandes.',
            plugins: [
                {
                    slug: 'forum',
                    description:
                        'Faites choisir la prochaine carte Payload aux membres et recueillez leurs suggestions dans la discussion.',
                },
                {
                    slug: 'vote',
                    description:
                        'Connectez votre fiche Team Fortress 2 Servers et fixez un objectif collectif de votes vérifiés.',
                },
            ],
        },
        unturned: {
            title: 'CMS pour serveur Unturned',
            description:
                'Rassemblez l’adresse, la carte et les mods Workshop de votre serveur Unturned. Reliez les comptes Steam, l’état A2S et un composant RCON compatible.',
            intro: 'Quand la carte ou les mods de votre serveur Unturned changent, mettez à jour une seule page. Les joueurs y retrouvent l’adresse de connexion et la collection Workshop à installer.',
            highlights: ['Steam OpenID', 'État du serveur via A2S', 'Composant Source RCON compatible'],
            features: [
                {
                    title: 'Expliquer les règles de votre carte',
                    description:
                        'Précisez les zones sûres, les règles du PvP et les mods requis. Si votre serveur mêle survie et RP, indiquez dans quelles zones chaque règlement s’applique.',
                },
                {
                    title: 'Ajouter une console à votre installation',
                    description:
                        'L’état est disponible via A2S. Pour envoyer des commandes, Unturned a besoin d’un composant serveur qui implémente Source RCON.',
                },
            ],
            setup: 'Sélectionnez Unturned dans Jeux et identités et indiquez le port de requête A2S. Pour les commandes, installez et configurez d’abord un composant Source RCON compatible côté jeu.',
            plugins: [
                {
                    slug: 'wiki',
                    description:
                        'Documentez les zones sûres et les règles du PvP par carte pour que les nouveaux puissent les retrouver.',
                },
                {
                    slug: 'vote',
                    description:
                        'Reliez votre fiche Unturned Servers pour vérifier les votes et attribuer un grade sur le site au palier choisi.',
                },
            ],
        },
        projectzomboid: {
            title: 'CMS pour serveur Project Zomboid',
            description:
                'Publiez les réglages du monde et la collection Workshop de votre serveur Project Zomboid. KraftInk prend en charge Steam, A2S et Source RCON.',
            intro: 'Pour reprendre une partie sur votre serveur Project Zomboid, les survivants doivent retrouver la bonne collection Workshop et savoir ce qui change au prochain redémarrage.',
            highlights: ['Steam OpenID', 'État du serveur via A2S', 'Commandes Source RCON'],
            features: [
                {
                    title: 'Tenir le guide des survivants à jour',
                    description:
                        'Expliquez les règles de création de personnage et les réglages du monde, comme le PvP ou la protection des refuges. À chaque changement de saison, indiquez ce qui est conservé.',
                },
                {
                    title: 'Vérifier que le serveur est prêt',
                    description:
                        'A2S permet aux joueurs de voir si le serveur répond après un redémarrage. Les membres peuvent associer leur compte Steam à leur profil via OpenID.',
                },
            ],
            setup: 'Sélectionnez Project Zomboid dans Jeux et identités. Configurez le port de requête A2S pour l’état, puis le port TCP et le mot de passe de Source RCON pour les commandes.',
            plugins: [
                {
                    slug: 'forum',
                    description:
                        'Organisez les groupes de survivants et préparez la reprise d’une saison dans des discussions réservées aux membres.',
                },
                {
                    slug: 'support',
                    description:
                        'Aidez les joueurs dont le chargement bloque sur un mod Workshop dans un ticket privé.',
                },
            ],
        },
        redm: {
            title: 'CMS pour serveur RedM',
            description:
                'Présentez votre serveur RedM RP et ses candidatures. Les membres déclarent leur identifiant Rockstar ou Cfx, et KraftInk affiche l’état de FXServer.',
            intro: 'Présentez votre univers avant que les joueurs créent leur personnage. Décrivez le cadre du serveur RedM, les rôles accessibles et la façon de rejoindre la première session.',
            highlights: ['Identité Rockstar ou Cfx déclarée', 'État du FXServer', 'Commandes RCON FXServer'],
            features: [
                {
                    title: 'Préparer une candidature de personnage',
                    description:
                        'Expliquez les règles du RP et les informations attendues dans une candidature. Donnez aux nouveaux joueurs un point de départ avant de leur faire découvrir vos villes et vos groupes.',
                },
                {
                    title: 'Identifier les joueurs côté serveur',
                    description:
                        'Les membres déclarent la licence Rockstar ou l’identifiant Cfx que votre serveur utilise. KraftInk enregistre cette valeur avec leur profil.',
                },
                {
                    title: 'Utiliser les commandes de votre framework RP',
                    description:
                        'FXServer fournit l’état du serveur. Les récompenses de personnage passent par RCON et demandent une commande fournie par votre framework RP.',
                },
            ],
            setup: 'Choisissez RedM dans Jeux et identités, puis indiquez l’adresse de FXServer pour récupérer l’état via dynamic.json. Configurez RCON si vous utilisez les commandes.',
            plugins: [
                {
                    slug: 'wiki',
                    description:
                        'Consignez les règles de création de personnage et les rôles jouables pour que les candidats puissent préparer leur arrivée.',
                },
                {
                    slug: 'support',
                    description:
                        'Permettez aux joueurs de poser une question sur leur candidature de personnage sans la publier sur le site.',
                },
            ],
        },
        arkascended: {
            title: 'CMS pour serveur ARK: Survival Ascended',
            description:
                'Documentez les cartes et l’accès crossplay de votre cluster ARK: Survival Ascended. KraftInk utilise RCON pour l’état et la présence des joueurs via EOS.',
            intro: 'Quelles cartes sont accessibles depuis chaque plateforme ? Où les joueurs peuvent-ils transférer leur personnage ? Expliquez les règles de votre cluster ARK: Survival Ascended sur le site.',
            highlights: ['Identité EOS déclarée', 'État via RCON authentifié', 'Présence via ListPlayers'],
            features: [
                {
                    title: 'Compter les joueurs via ListPlayers',
                    description:
                        'KraftInk utilise RCON authentifié pour vérifier la présence et récupérer le nombre de joueurs. Les noms et identifiants restent privés dans l’état public.',
                },
                {
                    title: 'Attendre le bon joueur pour une livraison',
                    description:
                        'Les membres déclarent leur identifiant EOS. Avec une commande compatible, une récompense peut rester en attente jusqu’à ce que KraftInk détecte cet identifiant sur le serveur.',
                },
            ],
            setup: 'Configurez RCONEnabled, RCONPort et ServerAdminPassword dans GameUserSettings.ini. Sélectionnez ARK: Survival Ascended dans KraftInk et renseignez les paramètres de connexion RCON.',
            plugins: [
                {
                    slug: 'stats',
                    description:
                        'Suivez les pics de fréquentation de chaque serveur du cluster grâce au nombre de joueurs remonté par RCON.',
                },
                {
                    slug: 'shop',
                    description:
                        'Proposez un grade de soutien sur le site du cluster qui donne accès à des pages réservées aux membres concernés.',
                },
            ],
        },
        palworld: {
            title: 'CMS pour serveur Palworld',
            description:
                'Publiez le règlement de votre monde Palworld. KraftInk utilise l’API REST du serveur dédié pour lire l’état, vérifier la présence et envoyer des annonces.',
            intro: 'Indiquez aux membres de votre monde Palworld où installer leurs bases et comment rejoindre une guilde. Publiez les règles et les dates des prochaines expéditions sur le site.',
            highlights: ['Identifiant Palworld déclaré', 'API REST officielle', 'Présence authentifiée des joueurs'],
            features: [
                {
                    title: 'Consulter l’état du serveur dédié',
                    description:
                        'L’API REST fournit le nombre de joueurs et permet de vérifier la présence d’un joueur par son identifiant Palworld. Vous pouvez utiliser TLS si votre API est accessible en HTTPS.',
                },
                {
                    title: 'Annoncer une maintenance depuis KraftInk',
                    description:
                        'L’intégration REST permet d’envoyer une annonce en jeu, de sauvegarder le monde et d’effectuer certaines actions de modération. Les récompenses en objets nécessitent une intégration supplémentaire.',
                },
            ],
            setup: 'Activez RESTAPIEnabled sur le serveur dédié, puis réglez le port REST et le mot de passe administrateur. Sélectionnez Palworld dans KraftInk, renseignez les accès et choisissez le chiffrement.',
            plugins: [
                {
                    slug: 'wiki',
                    description:
                        'Publiez un guide par guilde avec ses règles de construction et ses projets, facile à retrouver avant une expédition.',
                },
                {
                    slug: 'stats',
                    description:
                        'Suivez les pics de fréquentation de votre monde à partir du nombre de joueurs transmis par l’API REST.',
                },
            ],
        },
        satisfactory: {
            title: 'CMS pour serveur Satisfactory',
            description:
                'Rassemblez les projets et les annonces de votre serveur Satisfactory. KraftInk se connecte à l’API HTTPS du serveur dédié avec un jeton.',
            intro: 'Une nouvelle ligne de train ou une usine à reprendre ? Donnez à votre groupe Satisfactory un endroit pour retrouver les plans et les priorités avant la prochaine session.',
            highlights: [
                'Identifiant Steam ou Epic déclaré',
                'API HTTPS du serveur dédié',
                'Authentification par jeton API',
            ],
            features: [
                {
                    title: 'Partager l’avancement de la partie',
                    description:
                        'Publiez les sites d’implantation, les conventions de nommage et ce que chacun peut reprendre à la prochaine connexion. Gardez les informations de connexion sur la même page.',
                },
                {
                    title: 'Lire l’état du serveur via HTTPS',
                    description:
                        'L’API dédiée fournit le nombre de joueurs et accepte les commandes prises en charge par le serveur. Si votre API utilise une autorité de certification privée, indiquez son certificat dans KraftInk.',
                },
            ],
            setup: 'Générez un jeton avec server.GenerateAPIToken dans la console du serveur dédié. Sélectionnez Satisfactory dans KraftInk, puis renseignez l’adresse HTTPS, le port et le jeton de l’API.',
            plugins: [
                {
                    slug: 'wiki',
                    description:
                        'Documentez vos réseaux ferroviaires et vos conventions de nommage, puis consultez l’historique quand un plan change.',
                },
                {
                    slug: 'forum',
                    description:
                        'Faites choisir le prochain chantier au groupe avec un sondage et recueillez les idées d’implantation dans le fil.',
                },
            ],
        },
        conanexiles: {
            title: 'CMS pour serveur Conan Exiles',
            description:
                'Publiez les horaires de raid et les règles des clans sur le site de votre serveur Conan Exiles. Reliez le port de requête et la console RCON à KraftInk.',
            intro: 'Vos clans doivent pouvoir retrouver les horaires de raid et les zones où construire. Publiez ces règles avec la carte et la liste des mods de votre serveur Conan Exiles.',
            highlights: ['Identifiant de plateforme déclaré', 'État via le port de requête', 'Commandes Source RCON'],
            features: [
                {
                    title: 'Prévenir les clans avant un changement de règles',
                    description:
                        'Regroupez le calendrier des raids, les zones protégées et les multiplicateurs du serveur. Annoncez les modifications avant leur entrée en vigueur.',
                },
                {
                    title: 'Relier la console de Conan Exiles',
                    description:
                        'L’état du serveur provient du port de requête. Source RCON permet d’exécuter les commandes disponibles, dont celles de vos mods. Pour une récompense, utilisez une commande qui accepte l’identifiant de plateforme déclaré.',
                },
            ],
            setup: 'Dans la section RconPlugin de Game.ini, activez RconEnabled et configurez RconPort et RconPassword. Indiquez ensuite les ports de requête et de console dans KraftInk.',
            plugins: [
                {
                    slug: 'support',
                    description:
                        'Recueillez les signalements de raid dans des tickets privés où les joueurs peuvent joindre une capture.',
                },
                {
                    slug: 'shop',
                    description:
                        'Vendez un grade de soutien sur le site pour les joueurs qui souhaitent participer aux frais du serveur.',
                },
            ],
        },
    },
} satisfies GameCopy;
