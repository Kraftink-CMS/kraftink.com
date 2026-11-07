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

## E-mails

Dans **E-mails et fonctionnement**, renseignez les paramètres SMTP de votre prestataire et une adresse d’expéditeur autorisée. Sendmail est également disponible si l’hébergement le fournit.

Enregistrez, envoyez un e-mail de test et vérifiez sa réception, y compris dans les indésirables. Ajoutez les entrées DNS SPF ou DKIM demandées par le prestataire. Un mot de passe laissé vide conserve sa valeur enregistrée.

Si le test échoue, contrôlez les identifiants, les ports sortants autorisés et les journaux du prestataire. Pour les envois programmés ou à reprendre après un échec, configurez le [planificateur](operations.md#planificateur).

## Langue et horaires

Choisissez le fuseau du site, par exemple `Europe/Paris`. Les horaires de publication sont saisis dans ce fuseau. Le changer modifie leur affichage sans déplacer les échéances déjà enregistrées.

Lorsque le choix de langue des visiteurs est activé, les formulaires proposent des traductions facultatives de vos contenus. Un champ manquant utilise l’anglais, puis la langue du site et enfin sa valeur principale. Désactiver le choix de langue conserve les traductions.

Le [guide du référencement](seo.md) explique les titres et descriptions produits automatiquement et leurs personnalisations.

## Images et médiathèque

Dans **Contenus → Médiathèque**, choisissez **Ajouter l’image** pour la réutiliser dans vos pages et actualités. La médiathèque accepte les fichiers JPEG, PNG, WebP, GIF et AVIF de 8 Mo maximum par défaut. Ajoutez un texte alternatif qui décrit l’image pour les personnes qui ne peuvent pas la voir.

Les images de la médiathèque sont publiques, même si vous les insérez dans un contenu réservé. Pour limiter l’accès, ajoutez l’image depuis l’éditeur du contenu en choisissant l’envoi privé lorsqu’il est proposé.

KraftInk retire des nouveaux envois les métadonnées personnelles telles que la localisation enregistrée par un appareil photo. Si les envois échouent, vérifiez auprès de votre hébergeur que PHP peut [exécuter ExifTool](installation.md#hebergement-requis).
