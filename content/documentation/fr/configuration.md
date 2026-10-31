# Configurer votre site

Après l’installation, ces réglages permettent au CMS de communiquer correctement avec votre hébergement et vos services externes. Les contenus, menus, rangs et options visuelles se gèrent directement dans le panneau.

## Domaine, HTTPS et proxy

Faites fonctionner votre domaine et son certificat chez l’hébergeur avant d’enregistrer l’URL publique dans les réglages du site. Utilisez l’adresse complète, par exemple `https://communaute.example`. Ce réglage ne crée ni domaine ni certificat.

Le plugin **Network**, fourni et activé avec KraftInk, gère les connexions passant par un proxy. Ouvrez **Plugins**, puis **Configurer** sur Network pour choisir le mode correspondant à l’hébergement :

- **Connexion directe** si les visiteurs atteignent directement le serveur web.
- **Cloudflare** si les requêtes passent par Cloudflare. La liste de ses réseaux est incluse dans le plugin et suit les mises à jour du CMS. Aucun téléchargement ni actualisation manuelle n’est nécessaire.
- **Proxy personnalisé** si votre hébergeur utilise un autre relais. Demandez-lui ses adresses IP ou réseaux CIDR et ajoutez uniquement ceux-ci.

Si Network est désactivé, le CMS utilise la connexion directe et ignore les informations transmises par les proxies. En mode Cloudflare, une connexion qui ne provient pas d’un réseau Cloudflare conserve aussi l’adresse IP de la connexion.

Une mauvaise configuration peut fausser les adresses des visiteurs ou la détection HTTPS. Derrière un autre proxy non déclaré fiable, l’adresse détectée est celle du relais. Ne déclarez pas tous les réseaux comme fiables pour contourner le problème.

Lors d’un changement de domaine, mettez aussi à jour les URL de retour de vos [connexions externes](oauth.md), des services de paiement et des autres intégrations concernées. Prévoyez une redirection de l’ancien domaine chez l’hébergeur.

## Envoyer les e-mails

Préparez les identifiants d’un service SMTP, distincts de votre compte administrateur. Dans **E-mails et fonctionnement**, renseignez l’hôte, le port, le mode de connexion et les identifiants indiqués par le prestataire, puis une adresse d’expéditeur qu’il autorise. Sendmail peut être utilisé si votre hébergement le fournit.

Enregistrez, envoyez un e-mail de test et vérifiez sa réception, y compris dans les indésirables. Si le prestataire demande des enregistrements DNS SPF ou DKIM, ajoutez exactement les valeurs qu’il fournit chez le gestionnaire du domaine.

Un test accepté par SMTP ne garantit pas l’arrivée dans la boîte du destinataire. En cas d’échec, vérifiez les identifiants, les ports sortants autorisés par l’hébergeur et les journaux du prestataire. Un champ de mot de passe laissé vide conserve le secret déjà enregistré.

Les e-mails courants sont immédiats par défaut. Pour les envois différés et les automatismes, configurez le [planificateur](operations.md#planificateur).

## Langue et heures

Choisissez la langue et le fuseau dans les réglages du site, par exemple `Europe/Paris`. Les horaires saisis pour programmer les contenus suivent ce fuseau. Le changer modifie leur affichage sans déplacer les échéances déjà enregistrées.

La langue de l’interface ne traduit pas vos contenus : renseignez leurs traductions dans les formulaires qui les proposent. Après un import, vérifiez aussi les horaires et les textes dans chaque langue utilisée.

## Référencement et partage

Ouvrez **Présentation → Référencement SEO** pour configurer l’accueil, la structure des titres, les modèles de description et les personnalisations par page. Les pages et actualités utilisent directement leur titre, leur résumé et leur couverture. Le [guide du référencement](seo.md) détaille ces valeurs natives, les variables, les traductions et l’indexation. Les listes et les pages de détail disposent de modèles distincts.

## Avant l’ouverture

Testez un parcours d’inscription et de récupération du mot de passe, puis vérifiez les contenus publics et privés avec un compte membre. Activez la double authentification pour vos comptes d’administration et conservez leurs codes de récupération hors du site.

Installez ensuite les [extensions nécessaires](extensions-catalogue.md), configurez votre [jeu](games.md) et, si nécessaire, [KraftLink](kraftlink.md). Vérifiez enfin qu’une [sauvegarde externe](operations.md#sauvegardes) existe.
