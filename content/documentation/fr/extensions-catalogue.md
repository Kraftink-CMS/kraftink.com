# Installer des plugins et des thèmes

KraftInk fonctionne avec sa présentation native. Ajoutez seulement les extensions nécessaires à votre communauté, depuis **Plugins**, **Thèmes** ou **Jeux et identités**.

## Installer un paquet

1. Choisissez une extension dans le catalogue ou envoyez le ZIP fourni par son auteur.
2. Vérifiez sa compatibilité avec votre version de KraftInk et les dépendances demandées.
3. Confirmez l’installation et attendez la fin de l’opération.
4. Ouvrez les réglages du plugin, ou choisissez d’utiliser le thème ou le module de jeu installé.

Un nouveau plugin est activé automatiquement après une installation réussie. Installer un thème ou un module de jeu le rend disponible sans modifier le thème ou le jeu utilisé par le site.

Un paquet présent dans les fichiers n’est pas encore installé. Le panneau prépare les données et vérifie que le paquet peut démarrer. Les archives GitHub « Source code » ne remplacent pas nécessairement une archive prête à installer.

Une offre payante peut s’installer depuis le catalogue lorsque votre clé donne accès à son téléchargement. Si l’offre renvoie vers un distributeur externe, récupérez son archive avant de revenir dans le panneau. Installez uniquement le code d’un auteur de confiance.

## Choisir un thème

Le site public et l’administration ont chacun leur thème. Choisissez la destination indiquée par le paquet, puis **Utiliser**. Le choix **Par défaut** rétablit séparément la présentation native de chaque interface. Changer de thème conserve les comptes et les contenus.

Le bouton **Configurer**, lorsqu’il existe, ouvre les réglages du thème. Vérifiez ensuite vos pages importantes sur ordinateur et mobile.

## Mettre à jour ou réparer

Sauvegardez le site et consultez les changements de l’auteur avant une mise à jour. Le catalogue ou l’envoi d’une nouvelle archive prépare l’opération. Le CMS vérifie les prérequis, sauvegarde et conserve l’état actif ou inactif du paquet.

Si l’extension est suspendue, lisez sa cause avant de tenter une activation. Corrigez la compatibilité ou rétablissez les fichiers, puis utilisez **Réparer l’installation** lorsque cette action est proposée. Modifier un fichier d’état ou copier des fichiers au hasard ne répare pas ses données.

Les modules fournis avec KraftInk suivent les [mises à jour du CMS](updates.md). Ils ne sont pas remplacés par une archive tierce. En cas d’opération interrompue, suivez le [guide de reprise](operations.md).

Le plugin intégré **Network** est activé par défaut. Son bouton **Configurer** permet de choisir Cloudflare, un proxy personnalisé ou une connexion directe. Le désactiver rétablit la connexion directe. Ses réseaux Cloudflare sont maintenus avec le CMS, sans actualisation manuelle. Consultez la [configuration du réseau](configuration.md#domaine-https-et-proxy) avant de modifier ce réglage.

## Retirer une extension

Désactiver un plugin ou choisir un autre thème conserve ses données. **Désinstaller** efface définitivement ses données et ses réglages, après confirmation. Ses fichiers restent disponibles. **Supprimer les fichiers** concerne un paquet non installé. Vérifiez les conséquences affichées et gardez une sauvegarde avant toute suppression.

Pour une ancienne extension placée dans **Extensions retirées**, restaurez sa copie depuis cette section avant de la réutiliser. Une extension dont dépend un autre paquet doit rester disponible tant que cette dépendance existe.

## Ajouter un catalogue

Le catalogue officiel est déjà configuré. Une autre source se déclare dans `config/market.php` par le responsable de l’hébergement, avec son nom, son URL et la prise en charge éventuelle des clés de site. Choisissez un distributeur de confiance. Une adresse de catalogue ne garantit pas la qualité de ses extensions.

## Configurer l’accès au Market

Dans **Administration → Market**, tous les catalogues configurés affichent chacun leur carte. Dans la carte du catalogue concerné, renseignez la **Clé de site** fournie par son distributeur si celui-ci accepte les clés. Enregistrez, puis actualisez le catalogue. La clé est conservée chiffrée et seul son état apparaît après l’enregistrement. Utilisez **Remplacer** pour en saisir une nouvelle ou **Retirer** pour la supprimer après confirmation. Une source publique sans prise en charge des clés ne présente pas ce champ.

Le catalogue public fonctionne sans clé. Une source peut réserver des offres aux achats du compte associé ou limiter l’accès privé à certaines adresses IP. Lorsqu’un accès ou un téléchargement est refusé, le panneau affiche un motif traduit par le CMS dans votre langue. Un code inconnu produit un motif générique. Les textes d’erreur distants ne sont pas affichés. Corrigez la clé ou les autorisations indiquées avant d’actualiser.

Les fiches conservent leurs propres langues pour le nom, la description et les images. Ces contenus viennent de chaque paquet et restent distincts des messages de l’interface.

Les téléchargements et mises à jour peuvent provenir directement du site du distributeur, sans dépôt Git. La clé et les droits sont vérifiés lors du téléchargement, puis le CMS contrôle l’archive avant de préparer l’installation.

Chaque source possède son propre accès. La clé d’une source n’est transmise ni aux autres catalogues ni aux domaines de distribution externes. Pour fournir un catalogue, consultez le [contrat Market](market-contract.md).

Pour créer vos propres paquets, consultez les guides [plugin](developpement-plugins.md) et [thème](developpement-themes.md).

## Relier les achats KraftInk

Le catalogue KraftInk est configuré par défaut et réunit les ressources communautaires et les offres vendues sur le site. Les offres vendues sur KraftInk ouvrent leur page d’achat. Les offres d’un distributeur externe conservent le lien d’achat ou de contact indiqué par leur auteur.

Dans votre compte KraftInk, ouvrez **Mon CMS**, créez une clé de site et renseignez l’IP publique utilisée par votre serveur web. Copiez la clé dans **Administration → Market** du CMS, puis actualisez le catalogue. Une ressource accessible affiche **Acheté**. Une erreur de clé ou d’IP conserve les fiches publiques et ne révèle pas les achats du compte.

Une IP est autorisée par défaut. Un administrateur du site KraftInk peut augmenter le nombre d’adresses de votre compte ou accorder une exemption pour une IP dynamique. La liste d’adresses peut être modifiée tous les trois jours. Remplacer la clé ne modifie pas cette période d’attente. Les ressources achetées sur KraftInk s’installent depuis le CMS, sans téléchargement ZIP dans l’espace acheteur du site.
