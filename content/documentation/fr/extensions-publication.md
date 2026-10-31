# Distribuer une extension

Livrez un ZIP installable depuis le panneau, avec les dépendances et ressources déjà préparées. Le propriétaire du site ne doit pas avoir à compiler votre paquet.

## Contenu de l’archive

Placez `manifest.json`, `src/`, routes, vues, traductions, migrations et ressources nécessaires à la racine ou dans un unique dossier principal. Incluez les licences des bibliothèques et polices distribuées. Excluez les secrets, données locales, `node_modules` et outils de développement.

Renseignez une version stable et les exigences CMS/PHP dans le manifeste. Installez le ZIP sur une copie de KraftInk sans votre dépôt de développement, puis vérifiez la mise à jour d’une version précédente avec ses données.

Une version distribuée est immuable. Publiez une nouvelle version pour corriger son contenu.

## Bibliothèques et ressources

| Fichier | Rôle |
| --- | --- |
| `manifest.json` | Identité, compatibilité et contributions KraftInk |
| `composer.json`, `composer.lock` | Bibliothèques PHP du paquet et versions verrouillées |
| `package.json`, `package-lock.json` | Dépendances frontend et compilation |

Ces fichiers sont facultatifs si le paquet n’en a pas besoin. Ne modifiez pas les dépendances du noyau pour installer les vôtres.

La publication KraftInk prépare les bibliothèques PHP de production avec PHP-Scoper dans un `vendor/` privé et génère `manifest.libraries`. Le CMS charge cet index, votre fournisseur ne doit pas inclure `vendor/autoload.php`. `App`, `Illuminate` et `Laravel` restent fournis par le CMS.

Le fichier Composer peut déclarer les exigences, métadonnées et le PSR-4 du namespace vers `src/`. Les dépôts personnalisés, scripts et configurations actives sont refusés. Testez les références de classes dynamiques après préparation. Un `scoper.inc.php` peut ajouter des `patchers` si nécessaire.

Pour le frontend, déclarez un script `build` produisant les fichiers sous `public/`. La publication utilise `npm ci` puis ce script sans hooks d’installation, `prebuild` ou `postbuild`. Un thème peut utiliser `build.scss` avec ses dépendances Sass verrouillées si aucun script `build` n’est défini.

## Présentation dans le Market

Le manifeste fournit `name` et `description` sous forme de textes ou de clés de traduction du paquet. `market.name` et `market.description` permettent une présentation dédiée. Une description est nécessaire à la validation.

```json
"market": {
    "name": "My theme",
    "description": {
        "fr": "Un thème pour votre communauté.",
        "en": "A theme for your community."
    },
    "image": {"fr": "preview-fr.jpg", "en": "preview-en.jpg"}
}
```

Placez les images dans `resources/market/`. Les formats acceptés sont PNG, JPG, JPEG, WebP, GIF et AVIF. Une image commune se déclare avec `"image": "preview.jpg"`. Les traductions présentes sont utilisées sans imposer toutes les langues.

Les champs facultatifs `author.name`, `author.url`, `commercial.kind`, `commercial.url`, `commercial.price` et `manual_only` se placent aussi dans `market`. Par exemple, un prix utilise `{"amount": "9.99", "currency": "EUR"}`.

## Publier une version

Si votre dépôt est géré par l’automatisation Kraftink-CMS :

1. Poussez le contenu sur `dev`.
2. Ouvrez **Actions → Release → Run workflow**.
3. Choisissez le niveau `auto`, `patch`, `minor` ou `major`.
4. Corrigez les contrôles en échec et suivez la PR proposée jusqu’à sa fusion.

Le workflow construit le ZIP et ses métadonnées. Pour vérifier un paquet localement après installation des [outils de publication](https://github.com/Kraftink-CMS/automation), lancez depuis sa racine :

```shell
node /absolute/path/automation/scripts/releases/build.mjs check
```

Pour un dépôt indépendant, votre propre compilation doit produire le même paquet prêt à installer. Si vous souhaitez le proposer dans le catalogue KraftInk, transmettez son dépôt et sa publication au responsable du Market.
