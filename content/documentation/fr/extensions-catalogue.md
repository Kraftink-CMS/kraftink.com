# Plugins et thèmes

Installez vos extensions depuis le catalogue ou le ZIP fourni par leur auteur, dans **Plugins**, **Thèmes** ou **Jeux et identités**. KraftInk fonctionne aussi sans thème ajouté.

## Installer et utiliser une extension

Choisissez le paquet, vérifiez les exigences affichées puis confirmez son installation. Un plugin est activé après validation. Un thème ou un module de jeu devient disponible sans changer la sélection actuelle.

Le site public et le panneau ont chacun leur thème. Le bouton **Utiliser** sélectionne un thème pour sa destination. **Par défaut** rétablit le rendu natif de cette destination. Les réglages et contenus sont conservés lors d’un changement.

Pour une installation manuelle, utilisez une archive prête à installer. Les archives « Source code » de GitHub ne contiennent pas toujours les dépendances et ressources compilées nécessaires.

## Accéder à vos achats depuis le Market

Le catalogue public KraftInk fonctionne sans clé. Pour installer vos achats :

1. Dans votre compte sur le site KraftInk, ouvrez **Mon CMS**.
2. Créez une clé de site et renseignez l’IP publique utilisée par votre hébergement web pour contacter le Market.
3. Dans **Administration → Market** du CMS, enregistrez cette clé dans la carte KraftInk.
4. Actualisez le catalogue. Les offres accessibles affichent **Acheté** et s’installent depuis le CMS.

Une adresse IP est autorisée par défaut. Sa liste peut être modifiée tous les trois jours. Si votre hébergement utilise plusieurs adresses ou une IP dynamique, contactez l’administration KraftInk. Renouveler la clé ne raccourcit pas ce délai.

Pour un autre catalogue acceptant les clés, utilisez celle de son distributeur dans sa propre carte. Si une offre renvoie vers un achat externe, suivez le lien de l’auteur puis récupérez son archive. Un refus d’accès indique la clé ou l’autorisation à vérifier.

Le catalogue officiel est déjà configuré. L’ajout d’une autre source demande une modification de `config/market.php` par le responsable de l’hébergement.

## Mettre à jour ou retirer

Une mise à jour depuis le catalogue ou un ZIP conserve les données et l’état d’activation. Les extensions intégrées suivent les [mises à jour du CMS](updates.md).

| Action | Effet |
| --- | --- |
| Désactiver | Suspend le plugin en conservant ses données |
| Désinstaller | Efface les données et réglages du paquet après confirmation, mais conserve ses fichiers |
| Supprimer les fichiers | Retire les fichiers d’un paquet non installé |

Si une extension est suspendue, corrigez la cause indiquée puis utilisez **Réparer l’installation** lorsque proposé. Une copie de fichiers seule ne répare pas son installation. Les paquets archivés se récupèrent depuis **Extensions retirées**.
