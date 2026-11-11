# Configurer votre site

Après l’installation, vérifiez l’adresse du site, la messagerie et les réglages de langue avant d’inviter vos membres.

## Domaine et proxy

Configurez le domaine et son certificat HTTPS chez l’hébergeur, puis enregistrez l’adresse complète dans les réglages du site, par exemple `https://communaute.example`.

Si vous utilisez Cloudflare ou un autre proxy, ouvrez **Plugins → Network → Configurer** :

| Mode | Utilisation |
| --- | --- |
| Connexion directe | Les visiteurs atteignent directement le serveur web |
| Cloudflare | Le domaine passe par Cloudflare. Ses réseaux sont déjà inclus |
| Proxy personnalisé | Ajoutez uniquement les adresses IP ou réseaux CIDR fournis par l’hébergeur |

Network est fourni et activé par défaut. Le désactiver rétablit la connexion directe. Un proxy mal déclaré peut fausser les adresses des visiteurs et la détection HTTPS.

Lors d’un changement de domaine, adaptez aussi les adresses de retour des [connexions externes](oauth.md) et des [paiements](shop-administration.md).

## Connexion et inscription

Dans **Sécurité et accès → Connexion et inscription → Réglages généraux**, choisissez le mode de connexion, les règles de mot de passe, l’ouverture des inscriptions et la présentation des formulaires. Par défaut, les formulaires s’affichent sur des pages séparées et les clés d’accès sont autorisées.

**Exiger une adresse e-mail** est activé par défaut. Ce réglage affiche l’option **Exiger une adresse vérifiée**, qui demande aux membres de confirmer leur adresse pour accéder au site. Si l’adresse est facultative, le membre peut l’ajouter plus tard depuis **Mon compte**.

Sous **Comptes externes**, **Autoriser la configuration d’un mot de passe** est activé par défaut. Ce réglage affiche **Exiger un mot de passe à l’inscription**, désactivé par défaut. Activez cette seconde option pour que les nouveaux membres choisissent un mot de passe KraftInk lorsqu’ils s’inscrivent avec un fournisseur.

Lorsque les formulaires s’ouvrent dans des fenêtres modales, la récupération du mot de passe et la double authentification peuvent s’y poursuivre. Les liens reçus par e-mail et les retours depuis un fournisseur de connexion s’affichent sur une page. Gérez les fournisseurs et la récupération des comptes dans l’onglet [Connexions externes](oauth.md).

Si Minecraft est le jeu actif, ses réglages de connexion portent le badge **Minecraft**. La **Connexion rapide en jeu** est désactivée par défaut. Installez et reliez KraftLink sur le serveur choisi. Sur un réseau Velocity, l’installation sur le proxy couvre les serveurs du réseau. La confirmation du numéro et les champs encore nécessaires à l’inscription restent sur la page ou dans la fenêtre déjà ouverte. [Connexion rapide en jeu](games.md#connexion-rapide-en-jeu)

L’**intégration AuthMe** est désactivée par défaut. Choisissez le serveur qui exécute AuthMe et KraftLink. Lorsqu’un joueur s’inscrit en jeu avec un mot de passe AuthMe, KraftInk crée son compte avec le même pseudo et le même mot de passe. Si le site exige une adresse e-mail, le joueur la renseigne au premier accès. Les changements de mot de passe se gèrent ensuite séparément.

## Adresse de connexion au jeu

Dans **Serveurs de jeux**, ajoutez le serveur à afficher sur votre site, puis utilisez son bouton **Définir comme serveur principal** dans la liste. L’accueil et les thèmes utilisent son adresse et son nombre de joueurs. Sur un réseau, choisissez généralement le proxy qui connaît l’ensemble des joueurs connectés.

Le premier serveur ajouté devient principal automatiquement. Utilisez la colonne **Principal** pour en choisir un autre. Les serveurs importés conservent uniquement le choix principal explicite du site source.

Renseignez l’adresse sans port, puis le port dans son champ dédié. Cochez **Afficher le port dans l’adresse de connexion** pour afficher, par exemple, `play.example.org:25566`. Décochez-la pour afficher uniquement `play.example.org`. Un port standard reste affiché lorsque la case est cochée.

Le compteur vient uniquement du serveur principal, via son mode de liaison. Sans mesure récente, il reste indisponible. Les autres serveurs peuvent recevoir des récompenses sans être affichés ni additionnés au compteur. Le choix du serveur principal ne change pas la destination des récompenses.

Décochez **Afficher le nombre de joueurs en ligne** pour conserver l’adresse sans compteur public. Avec un mode de consultation comme Ping Minecraft, cela arrête aussi les interrogations. Avec RCON ou KraftLink, les échanges et les commandes restent actifs.

## E-mails

Dans **Réglages → E-mails et fonctionnement**, renseignez les paramètres SMTP de votre prestataire et une adresse d’expéditeur autorisée. Sendmail est également disponible si l’hébergement le fournit.

Enregistrez, envoyez un e-mail de test et vérifiez sa réception, y compris dans les indésirables. Ajoutez les entrées DNS SPF ou DKIM demandées par le prestataire. Un mot de passe laissé vide conserve sa valeur enregistrée.

Si le test échoue, contrôlez les identifiants, les ports sortants autorisés et les journaux du prestataire. Pour les envois programmés ou à reprendre après un échec, configurez le [planificateur](operations.md#planificateur).

## Langue et horaires

Choisissez le fuseau du site, par exemple `Europe/Paris`. Les horaires de publication sont saisis dans ce fuseau. Le changer modifie leur affichage sans déplacer les échéances déjà enregistrées.

Lorsque le choix de langue des visiteurs est activé, les formulaires proposent des traductions facultatives de vos contenus. Un champ manquant utilise l’anglais, puis la langue du site et enfin sa valeur principale. Désactiver le choix de langue conserve les traductions.

Le [guide du référencement](seo.md) explique les titres et descriptions produits automatiquement et leurs personnalisations.

## Images et médiathèque

Dans **Contenus → Médiathèque**, choisissez **Ajouter l’image** pour la réutiliser dans vos pages et actualités. La médiathèque accepte les fichiers JPEG, PNG, WebP, GIF et AVIF de 8 Mo maximum par défaut. Ajoutez un texte alternatif qui décrit l’image pour les personnes qui ne peuvent pas la voir.

Les images de la médiathèque sont publiques, même si vous les insérez dans un contenu réservé. Pour limiter l’accès, ajoutez l’image depuis l’éditeur du contenu en choisissant l’envoi privé lorsqu’il est proposé.

KraftInk utilise automatiquement ExifTool ou l’extension PHP Imagick, selon leur disponibilité, pour retirer les métadonnées des images envoyées, comme la localisation enregistrée par l’appareil photo. Si aucun des deux outils ne peut traiter une image, KraftInk conserve le fichier original.
