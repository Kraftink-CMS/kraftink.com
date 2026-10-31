export default {
    contactTitle: 'Contact',
    contactText:
        'Pour une question juridique, une réclamation ou une demande concernant vos données personnelles, contactez Revolis à',
    notices: {
        account: 'Consultez les règles du service et les informations sur vos données personnelles :',
        creator: 'Avant de configurer les paiements avec Stripe, consultez :',
        purchase: 'Avant de continuer vers Stripe, consultez :',
    },
    referencesTitle: 'Informations des prestataires et de la CNIL sur les données personnelles',
    references: [
        ['Cloudflare', 'https://www.cloudflare.com/privacypolicy/'],
        ['GitHub', 'https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement'],
        ['Stripe', 'https://stripe.com/privacy'],
        ['LWS (PDF)', 'https://aide.lws.fr/doc/cgv_01_07_2020/Info_legales_Clause_confidentialite_RGPD.pdf'],
        [
            'CNIL : vos droits sur vos données',
            'https://www.cnil.fr/fr/mes-demarches/les-droits-pour-maitriser-vos-donnees-personnelles',
        ],
    ],
    terms: {
        title: 'Conditions d’utilisation',
        lead: 'Les règles d’utilisation des comptes KraftInk et du Market de ressources.',
        sections: [
            {
                title: 'Éditeur du site',
                paragraphs: [
                    'KraftInk est exploité par Nicolas Dusserre, entrepreneur individuel sous le nom commercial Revolis, au 41 rue de Lassun, 64800 Montaut, France. SIREN : 908 931 157. SIRET : 908 931 157 00014. Numéro de TVA intracommunautaire : FR02908931157.',
                    'Le directeur de la publication est Nicolas Dusserre.',
                ],
            },
            {
                title: 'Hébergement',
                paragraphs: [
                    'Le site est hébergé par Cloudflare, Inc., 101 Townsend St., San Francisco, CA 94107, États-Unis. Téléphone : +1 (650) 319-8930. Site : www.cloudflare.com.',
                ],
            },
            {
                title: 'Compte et accès',
                paragraphs: [
                    'Renseignez des informations exactes et gardez votre mot de passe et votre clé de site confidentiels. Vous pouvez vous connecter avec votre pseudo ou votre adresse email, ou lier votre compte GitHub. Une adresse email vérifiée est nécessaire pour acheter ou publier une ressource.',
                    'L’usurpation d’identité, le contournement des restrictions d’accès et les actions perturbant le service sont interdits. L’équipe peut limiter ou suspendre un compte en cas d’abus ou de risque pour la sécurité.',
                ],
            },
            {
                title: 'Ressources et vendeurs',
                paragraphs: [
                    'Le Market réunit des ressources gratuites, des ressources vendues sur KraftInk et des ressources commerciales proposées sur des sites externes. Les achats externes sont gérés par le prestataire vers lequel renvoie la fiche de la ressource.',
                    'Les créateurs doivent disposer des droits nécessaires à la distribution de leurs ressources et fournir des descriptions, versions, prix et conditions de licence exacts. Ils sont responsables de la légalité et de la sécurité de leurs fichiers, de l’assistance aux acheteurs, des taxes applicables et de leurs obligations de facturation.',
                    'Chaque ressource et chaque mise à jour soumise sur KraftInk doit être approuvée avant sa publication. Cette modération ne garantit pas l’absence de tout défaut ou de toute vulnérabilité.',
                ],
            },
            {
                title: 'Achats et paiements',
                paragraphs: [
                    'Le prix inclut les taxes applicables et la ressource concernée est indiquée avant le paiement. Stripe Tax calcule les taxes selon la configuration fiscale du vendeur et les coordonnées de facturation de l’acheteur. Les paiements des ressources vendues sur KraftInk sont traités par Stripe sur le compte connecté du vendeur. Le vendeur est responsable de la vente. Stripe applique ses propres conditions pour le paiement et la configuration du compte vendeur.',
                    'L’accès est associé au compte acheteur après confirmation du paiement. Stripe génère une facture au nom du vendeur pour chaque achat, accessible depuis vos commandes. Pour un achat professionnel, renseignez le nom de votre entreprise, son adresse de facturation et son numéro de TVA si applicable sur la page de paiement Stripe.',
                    'Pour une question sur une ressource, son assistance, un remboursement ou l’exécution de la vente, contactez le vendeur. Vous pouvez aussi signaler un problème lié au Market à l’équipe KraftInk. Les présentes conditions n’excluent pas les droits applicables aux consommateurs, notamment les garanties légales et un éventuel droit de rétractation. Les conditions de vente applicables du vendeur restent distinctes de ces conditions d’utilisation.',
                ],
            },
            {
                title: 'Utilisation des ressources achetées',
                paragraphs: [
                    'Les archives payantes achetées sur KraftInk sont téléchargées par le CMS à l’aide de la clé de site du compte et des autorisations IP configurées. Gardez cette clé privée et respectez la licence de la ressource.',
                    'Un compte dispose normalement d’une adresse IP autorisée, modifiable une fois tous les trois jours. Les administrateurs peuvent ajuster le quota ou définir des plages réseau autorisées à la place de cette liste d’adresses.',
                ],
            },
            {
                title: 'Modération et retrait',
                paragraphs: [
                    'L’équipe de modération peut refuser une soumission ou une mise à jour et retirer une ressource des nouvelles ventes.',
                    'Un retrait normal préserve les achats et les droits d’accès existants. En cas de risque pour la sécurité ou d’un autre problème grave, un administrateur peut bloquer les téléchargements et demander la désactivation de la ressource sur les CMS qui l’ont installée depuis ce Market. Les historiques d’achat et de modération sont conservés.',
                    'Signalez à l’équipe un contenu dangereux, une atteinte à des droits ou un problème de sécurité. Le retrait d’une ressource ne supprime pas les obligations légales du vendeur envers ses acheteurs.',
                ],
            },
        ],
    },
    privacy: {
        title: 'Politique de confidentialité',
        lead: 'L’utilisation de vos données pour les comptes, les achats, la publication de ressources et la sécurité.',
        sections: [
            {
                title: 'Responsable et contact',
                paragraphs: [
                    'Nicolas Dusserre, entrepreneur individuel sous le nom commercial Revolis au 41 rue de Lassun, 64800 Montaut, France, est responsable des traitements décrits ici. Son SIREN est le 908 931 157. Vous pouvez le contacter à contact@revolis.fr concernant vos données personnelles.',
                ],
            },
            {
                title: 'Données traitées',
                paragraphs: [
                    'Les données de compte comprennent votre pseudo, votre adresse email, l’empreinte de votre mot de passe lorsque vous en utilisez un, le statut de vérification, le grade et les dates de création ou de modification du compte. Lors de la création d’un nouveau compte, nous enregistrons aussi la date d’acceptation des conditions générales d’utilisation et la version acceptée. Votre mot de passe n’est pas conservé en clair.',
                    'Si vous activez la double authentification, nous conservons le secret de l’application sous forme chiffrée, les empreintes de vos codes de secours et les dates et compteurs nécessaires à la vérification des codes et à la prévention de leur réutilisation. La clé de configuration et les nouveaux codes de secours sont affichés uniquement lors de leur génération.',
                    'Si vous choisissez la connexion GitHub, GitHub fournit votre identifiant de compte, des informations de profil public et une adresse email vérifiée utilisés pour identifier ou créer votre compte KraftInk.',
                    'L’accès du CMS utilise une empreinte et un préfixe d’identification de votre clé de site, les adresses IP ou plages réseau autorisées et l’historique de leurs modifications. Les traces de sécurité et de modération peuvent comprendre le compte ayant agi, son adresse IP, l’action, la cible, le motif et la date.',
                    'Les achats comprennent les identifiants de l’acheteur et du vendeur, la ressource, le montant, la devise, le statut du paiement, les références Stripe et les liens vers les factures. Les données vendeur comprennent le compte Stripe connecté et des informations comme le nom commercial, le pays, le type d’activité et le statut d’activation des paiements. Les données de carte et les informations de facturation saisies sur les pages Stripe sont recueillies par Stripe. KraftInk ne conserve pas les numéros complets de carte bancaire.',
                    'Les informations publiées sur les ressources, les archives et images soumises, les décisions de modération et les messages adressés à l’assistance sont également traités pour faire fonctionner le Market et répondre aux demandes.',
                ],
            },
            {
                title: 'Finalités et bases légales',
                paragraphs: [
                    'La gestion du compte, la connexion, les achats, l’accès aux ressources achetées, les paiements des créateurs et les messages de service sont nécessaires pour fournir les services demandés et exécuter le contrat concerné ou les mesures précontractuelles.',
                    'La prévention des fraudes, la limitation des requêtes, le contrôle des accès, les traces de sécurité et la modération reposent sur notre intérêt légitime à protéger les utilisateurs et le service. Les pièces relatives aux transactions peuvent aussi être traitées pour respecter des obligations légales et établir, exercer ou défendre des droits en justice.',
                    'Les informations de compte et les vérifications demandées sont nécessaires à la fonctionnalité concernée. Sans elles, la création du compte, la connexion, un achat ou une publication peut être impossible. La connexion GitHub est facultative.',
                ],
            },
            {
                title: 'Destinataires et prestataires',
                paragraphs: [
                    'Les membres habilités de l’équipe accèdent aux informations nécessaires à l’administration, à la modération, à l’assistance et à la sécurité. Un vendeur consulte ses ventes et les informations de paiement disponibles dans son propre compte Stripe.',
                    'Cloudflare héberge le site, sa base D1 et les archives R2, et fournit la protection Turnstile contre les abus automatisés. La vérification Turnstile comprend le jeton du contrôle et votre adresse IP. GitHub fournit la connexion facultative. Stripe gère les paiements, la vérification des vendeurs et les documents de paiement. LWS assure l’envoi des emails de compte et traite les informations d’acheminement et le contenu des messages.',
                    'Certains prestataires peuvent traiter des données hors de l’Espace économique européen. Les lieux et les modalités applicables aux transferts dépendent du prestataire et du service. Leurs informations de confidentialité sont accessibles ci-dessous. Contactez Revolis pour obtenir des informations sur les garanties applicables à vos données.',
                ],
            },
            {
                title: 'Durées de conservation',
                paragraphs: [
                    'Par défaut, le cookie de connexion dure pendant la session du navigateur et la session côté serveur expire après douze heures maximum. Si vous choisissez Rester connecté, le cookie et la session peuvent durer sept jours. L’état de connexion GitHub expire après dix minutes et la confirmation d’une action sensible après cinq minutes. Les liens de réinitialisation du mot de passe expirent après trente minutes. Les liens de vérification ou de changement d’adresse email expirent après vingt-quatre heures.',
                    'Une configuration de double authentification en attente expire après dix minutes. Un contrôle de vérification et son cookie temporaire expirent après cinq minutes. Le secret de l’application est conservé tant que cette protection est activée. Les informations des codes de secours, y compris ceux déjà utilisés, sont conservées jusqu’à leur régénération ou à la désactivation de la double authentification.',
                    'Les données temporaires de connexion et de sécurité sont effacées après leur expiration. Les jetons des liens de vérification, de changement d’adresse email et de réinitialisation du mot de passe sont conservés environ vingt-quatre heures supplémentaires après leur expiration, sans pouvoir être réutilisés.',
                    'Les informations de compte, l’historique des achats, les droits d’accès et les traces de modération ou de sécurité sont conservés tant qu’ils sont nécessaires pour fournir le compte et les droits achetés, respecter des obligations légales, étudier un incident ou traiter un litige. Une demande d’effacement ou de limitation est examinée selon ces finalités et les droits et obligations applicables. Le retrait d’une ressource n’efface pas son historique d’achat.',
                    'Sans connexion, la préférence de langue est conservée un an dans un cookie. Lorsque vous êtes connecté, elle est conservée dans votre compte jusqu’à sa modification ou à la suppression du compte. Les prestataires appliquent leurs propres durées aux données traitées pour leurs services.',
                ],
            },
            {
                title: 'Cookies et stockage local',
                paragraphs: [
                    'KraftInk utilise un cookie de session pour la connexion et des cookies temporaires pour sécuriser la connexion GitHub et la double authentification. Sans connexion, un cookie conserve votre choix de langue. Lorsque vous êtes connecté, ce choix est enregistré dans votre compte. Ces fonctions servent au fonctionnement du service et à vos choix. Le site n’ajoute pas de mesure d’audience ni de traceur publicitaire.',
                ],
            },
            {
                title: 'Vos droits',
                paragraphs: [
                    'Selon les conditions applicables, vous pouvez demander l’accès, la rectification, l’effacement, la limitation ou la portabilité de vos données. Vous pouvez vous opposer aux traitements fondés sur l’intérêt légitime. Contactez Revolis à l’adresse ci-dessous en précisant votre demande. Des informations nécessaires pour vérifier que la demande porte sur vos données peuvent vous être demandées.',
                    'Vous pouvez aussi adresser une réclamation à la Commission nationale de l’informatique et des libertés, la CNIL. Ses informations sur les droits relatifs aux données personnelles sont accessibles ci-dessous.',
                ],
            },
        ],
    },
};
