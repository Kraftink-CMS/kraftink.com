# Distribuer une extension

Ce guide s’adresse aux auteurs de plugins, thèmes et modules de jeu. Le paquet doit être installable indépendamment du dépôt où vous le développez.

## Préparer l’archive

Le ZIP contient `manifest.json`, les sources, traductions, migrations, vues, ressources compilées et licences du paquet. Placez ces fichiers à sa racine ou dans un unique dossier principal. N’incluez ni secrets, données locales, `node_modules` ou fichiers de test privés.

Déclarez les bibliothèques PHP dans le `composer.json` de l’extension et versionnez `composer.lock`. Le workflow les installe et les isole avec PHP-Scoper. Il distribue ce `vendor/` privé, ses licences, son index contrôlé et les fichiers Composer. N’utilisez pas votre `vendor/` de développement et ne modifiez pas le Composer du noyau.

Les bibliothèques suivent les fichiers du paquet lors d’une désinstallation, d’un archivage ou d’une suppression définitive. Le [cycle de vie des extensions](architecture-extensions.md#bibliotheques-et-compilation) détaille ces opérations et les fichiers de configuration.

Pour le frontend, déclarez les dépendances et `scripts.build` dans `package.json`, puis versionnez `package-lock.json`. Le workflow installe et compile dans une copie temporaire du commit. Seules les sorties de `public/` entrent dans le ZIP, sans `node_modules`, outils ni configuration npm. Le site utilisateur n’a besoin ni de Composer ni de Node.js pour installer le paquet.

Renseignez la version du manifeste et des exigences CMS/PHP réelles. Pour un thème, vérifiez que les sorties CSS et les polices déclarées sont présentes. Installez le ZIP sur un site de test, puis essayez la mise à jour d’une version précédente avec ses données.

Une archive publiée est immuable. Pour apporter une correction, publiez une nouvelle version sans remplacer le fichier d’un tag déjà distribué.

## Publication dans Kraftink-CMS

Les dépôts publics `Plugin-*`, `Theme-*` et `Game-*` utilisent les outils de [Kraftink-CMS/automation](https://github.com/Kraftink-CMS/automation). Le contrôleur installe et maintient automatiquement le petit workflow **Release** sur `master` et `dev` lors de l’initialisation du dépôt. Les auteurs n’ont ni configuration d’App, ni YAML à copier, ni jeton ou politique de version obligatoire à créer.

L’installation du workflow se fait directement sur GitHub, y compris pour les futurs dépôts couverts. Les sources locales et les extensions créées par le générateur du CMS ne contiennent pas ce fichier.

Un premier commit contenant simplement un README sur `master` suffit pour initialiser le dépôt. Le contrôleur peut alors installer le bouton et créer `dev` depuis le `master` configuré. Ajoutez les sources et le manifeste sur `dev` avant de publier. Les exclusions et les profils centraux s’appliquent aussi aux futurs dépôts. L’installation du bouton peut attendre le prochain passage de bootstrap et les règles de fusion du dépôt.

Les modules de jeu indépendants disposent d’un [modèle de sources](game-release-template/README.md). Les jeux intégrés au CMS suivent sa distribution et ne se publient pas séparément. Le CMS garde ses propres workflows, ses canaux et ses archives signées. [KraftLink](developpement-kraftlink.md#distribuer-le-connecteur) utilise le même bouton avec sa construction Maven locale.

Cette automatisation cible les dépôts de l’organisation Kraftink-CMS. Pour une extension hébergée ailleurs, construisez une archive localement ou utilisez votre propre workflow de publication.

Les PR vers `dev` réutilisent les validations de la release : manifeste, syntaxe PHP, dépendances et compilation des ressources. Elles ne publient rien et ne conservent aucun artifact de distribution. Le résultat requis **checks / Validate changes** doit réussir avant fusion. Les rôles GitHub **Maintain** et **Admin** peuvent forcer cette règle et pousser directement sur `dev`. La release ne fusionne ni ne publie si ses validations échouent. Les commits automatiques de version reçoivent une validation limitée aux métadonnées, sans approuver une release.

## Valider localement

Installez les dépendances npm et les outils Composer du projet `automation`, selon le [README des outils](https://github.com/Kraftink-CMS/automation). Depuis la racine du paquet, exécutez :

```shell
node /absolute/path/automation/scripts/releases/build.mjs check
```

Les scripts ne sont pas copiés dans le dépôt du paquet. La suite générique se lance avec `npm test` depuis `automation`. Exécutez aussi les tests métier du paquet. La construction centrale utilise PHP 8.5.

Pour exécuter vos tests dans les PR et les releases, versionnez une action composite facultative `.github/actions/test/action.yml`. La validation commune l’exécute avant le build, avec un jeton en lecture seule. Cette action place ses étapes à la racine du projet (`${{ github.action_path }}/../../..`), installe son environnement et lance vos commandes (`npm test`, PHPUnit, etc.), sans framework imposé. Un échec bloque la validation. Sans tests, aucun fichier n’est requis. Le build Maven de KraftLink exécute déjà ses tests éventuels.

## Publier une version

1. Poussez le contenu à publier sur `dev`.
2. Dans le dépôt de l’extension, ouvrez **Actions → Release → Run workflow**.
3. Choisissez `master` ou `dev`, puis `bump` : `auto`, `patch`, `minor` ou `major`.
4. Lancez le workflow. Il enregistre le commit actuel de `dev` et le niveau demandé.

Un droit d’écriture sur le dépôt de l’extension suffit pour lancer **Release**. Le workflow vérifie aussi ce droit lors d’une relance. Aucun accès d’écriture au dépôt central ni jeton personnel n’est nécessaire.

La même exécution **Release** inscrit la version stable dans le manifeste sur `dev` par un commit limité à ce changement, puis ouvre la PR `dev → master` avant le build. Un job en lecture seule vérifie et construit ce contenu sans clé App ni secret de publication. Le workflow attend les contrôles requis et la fusion autorisée de la PR, puis vérifie les preuves et les empreintes avant de publier les fichiers construits dans GitHub Releases. Après publication vérifiée, il prépare le prochain patch de développement sur `dev`.

Un échec du build ou un contrôle supplémentaire peut laisser la PR ouverte. Une nouvelle demande **Run workflow** est alors refusée et indique le lien de cette PR. Complétez les exigences dans la publication en cours. Les passages programmés sont réservés au bootstrap du bouton, à ses protections et à l’actualisation du Market. La publication reste suivie dans la même exécution du dépôt de l’extension.

Les nouveaux commits de `dev` ne sont jamais ajoutés silencieusement au build existant. Avant fusion, poussez vos corrections sur `dev`, puis choisissez **Re-run all jobs** dans la même exécution **Release** pour préparer la source corrigée et refaire entièrement le build, en gardant la version choisie. Pour changer de cible, fermez la PR puis lancez une nouvelle **Release**. Conservez les blocs générés dans la description de PR. Un simple push ou une PR ordinaire ne publie pas de version.

Sans politique particulière, la première version reprend le numéro du manifeste sans son suffixe de développement, par exemple `0.0.1-dev` donne `0.0.1`. Pour les suivantes :

- `auto` suit les tags et les Conventional Commits, avec un patch par défaut.
- `patch`, `minor` ou `major` applique explicitement ce niveau à la dernière stable.

Le fichier `.github/release-policy.json` est facultatif. Il peut adapter `initial_version`, `default_bump` et `next_version`. Avec `auto`, une cible `next_version` prévue est prise en compte. Un niveau explicite prend le dessus.

`master` porte la version stable publiée. Après publication vérifiée, l’automatisation pousse sur `dev` un commit de version pour le patch suivant, par exemple `1.0.1-dev` après `1.0.0`, sans écraser une cible supérieure ni les changements plus récents. Faites un `git pull` avant de reprendre vos modifications. Ce commit ne lance pas de nouvelle release.

La release contient :

- `<slug>-<version>.zip`.
- son empreinte SHA-256.
- `kraftink-extension.json`, avec la fiche `resource` et les versions disponibles.

Le tag conserve le commit testé, intégré à `master` par la PR. Un commit déjà tagué garde sa version. Les fichiers publiés ne sont jamais remplacés par un contenu différent.

Pour une erreur temporaire sur le même SHA, ouvrez l’exécution **Release** concernée et utilisez **Re-run failed jobs**. Cette reprise conserve le même contexte et les fichiers préparés. Un changement de code avant fusion exige **Re-run all jobs** dans cette même exécution. Si la PR est déjà fusionnée, terminez cette publication interrompue avant d’en demander une autre. Les artifacts de transfert expirent après sept jours, y compris pour KraftLink. Les fichiers définitifs restent dans GitHub Releases. Si les artifacts ont expiré après la fusion, un administrateur doit résoudre la publication inachevée avant la suivante.

## Notes de version

Le formulaire **Release** propose les mêmes options pour les plugins, thèmes, jeux et constructions personnalisées comme KraftLink :

| `notes_mode` | Contenu publié |
| --- | --- |
| `auto` | La liste automatique des commits. C’est le choix par défaut et `notes` doit rester vide |
| `append` | Le message Markdown de `notes`, puis la liste automatique |
| `replace` | Uniquement le message Markdown de `notes` |

`notes` est facultatif avec les valeurs par défaut. Il devient obligatoire avec `append` ou `replace` et accepte au plus 8 Kio en UTF-8. Il s’agit d’une entrée de type chaîne. Pour transmettre du Markdown sur plusieurs lignes, vous pouvez fournir cette chaîne à l’API GitHub `workflow_dispatch`, avec `notes_mode`.

La liste vient des vrais commits entre la précédente version stable et la source retenue. Pour une première version, elle utilise l’historique de cette source. Elle affiche les sujets avec des liens vers les commits, sans se limiter à la PR automatique `dev → master`. Les auteurs ou committers bots, les commits de fusion et les messages techniques exacts des workflows, comme les changements de numéro et l’installation du bouton, sont exclus. Les autres commits humains, y compris les migrations et les `chore` métier, restent présents.

La liste est limitée à 100 commits et peut être raccourcie pour respecter la taille des notes. Une indication de troncature et un lien vers la comparaison ou l’historique permettent de lire la suite. Votre message précède toujours la liste avec `append`.

Les notes font partie du contexte préparé. **Re-run failed jobs** conserve ce contexte. Lors d’une reprise, le workflow ne remplace pas les notes d’une version déjà publiée.

## Présenter le paquet dans le Market

Le manifeste fournit `name` et `description`, sous forme de textes ou de clés de traduction du paquet. Les champs facultatifs `market.name` et `market.description` choisissent une présentation dédiée au catalogue et acceptent aussi un dictionnaire de traductions. Le workflow résout toutes les traductions réellement présentes dans le commit publié, indépendamment pour chaque champ. Il ne crée aucune traduction manquante. Un texte brut reste une chaîne sans langue attribuée. Une description absente ou introuvable fait échouer la validation.

Placez les images de présentation du paquet dans `resources/market/`, à la racine de son dépôt. `market.image` accepte simplement un nom de fichier comme `preview.jpg`, un sous-chemin comme `fr/preview.jpg` ou le chemin complet relatif au dépôt `resources/market/fr/preview.jpg`. Les formats acceptés sont PNG, JPG, JPEG, WebP, GIF et AVIF. Les chemins doivent rester dans ce dossier, sans traversée, lien symbolique ni chemin absolu.

Le champ peut aussi fournir des images différentes par langue. Les noms de langue peuvent notamment être `fr`, `en`, `pt-BR` ou `zh-Hant-TW`. La publication vérifie chaque fichier, puis remplace son chemin par une URL GitHub brute liée au tag `v<version>`. Le catalogue contient donc des URL HTTPS utilisables directement, sans connaître l’arborescence du dépôt. Une URL HTTPS publique directe reste acceptée, sans identifiants, port personnalisé, paramètres ni fragment.

```json
{
    "market": {
        "name": "My theme",
        "description": {
            "fr": "Un thème pour votre communauté.",
            "en": "A theme for your community."
        },
        "image": {
            "fr": "preview-fr.jpg",
            "en": "preview-en.jpg"
        }
    }
}
```

Cet exemple utilise `resources/market/preview-fr.jpg` et `resources/market/preview-en.jpg`. Une image commune à toutes les langues se déclare avec `"image": "preview.jpg"`.

Le site affiche directement les fiches du catalogue. Pour chaque champ, il cherche la langue du visiteur, puis sa langue de base, puis l’anglais, puis la première langue disponible. Une fiche uniquement française reste donc lisible sur le site anglais. Une chaîne brute s’affiche telle quelle. Le site ne possède pas de seconde sélection de fiches ni de textes à maintenir séparément.

`manifest.market` peut aussi préciser `author.name`, `author.url`, `commercial.kind`, `commercial.url`, `commercial.price` et `manual_only`. Le prix est un objet tel que `{"amount": "9.99", "currency": "EUR"}`. L’acquisition d’un paquet payant se déroule chez son auteur.

Le responsable du registre ajoute le dépôt dans `resources.json` sur la branche `dev` du Market :

```json
{
    "schema_version": 1,
    "repositories": [{ "repository": "community/Plugin-Example", "auto_update": true }],
    "resources": []
}
```

Le fichier `resources.json` reste sur `dev`. Le workflow **Market validation** contrôle les changements et les PR vers cette branche. L’automatisation centrale construit `catalogue.json` depuis les métadonnées des releases, sans exécuter le PHP des extensions. Elle publie le catalogue sur `master`, qui contient uniquement `README.md` et `catalogue.json`. Les sites consultent ce catalogue et téléchargent l’archive de la version choisie.

Une entrée avec `auto_update: true` permet d’importer l’offre au prochain passage automatique, même si sa première release existe déjà. Retirer le dépôt de la liste retire son offre. Avec `auto_update: false`, les mises à jour automatiques sont suspendues et la fiche déjà publiée est conservée. La valeur doit être un booléen. La liste `resources` reste disponible pour les offres manuelles.

Le workflow central [Refresh Market](https://github.com/Kraftink-CMS/automation/actions/workflows/refresh-market.yml), sur `master`, propose trois portées manuelles : `automatic` actualise les dépôts actifs, `repository` importe ou actualise le dépôt inscrit indiqué dans le champ du même nom, et `all` traite tous les dépôts inscrits. Les modes `repository` et `all` incluent les offres en pause sans modifier `auto_update`.

## Actualiser le registre

Après publication, le workflow central **Refresh Market** actualise le catalogue lors d’un passage automatique ou d’un lancement manuel. L’apparition d’une version dépend du traitement GitHub et de l’actualisation des caches des sites. Aucune configuration Market supplémentaire n’est nécessaire dans le dépôt de l’extension.

Les empreintes distribuées contrôlent le fichier attendu et ne constituent pas une signature d’auteur. Pour héberger votre propre flux ou publier une offre manuelle, consultez le [contrat du catalogue](market-contract.md).
