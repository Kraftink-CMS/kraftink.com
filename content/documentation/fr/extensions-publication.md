# Distribuer une extension

Livrez un ZIP installable depuis le panneau, avec les dépendances et ressources déjà préparées. Le propriétaire du site ne doit pas avoir à compiler votre paquet.

Si votre extension figure au catalogue, indiquez aux utilisateurs de l’installer depuis le panneau d’administration KraftInk. Pour l’installation manuelle, dirigez-les vers le ZIP prêt à installer joint à la publication. [Installer une extension](extensions-catalogue.md)

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

`market.name` donne le titre de la fiche. Utilisez `market.description` pour le résumé affiché dans les cartes du catalogue et développez les détails dans le texte Markdown de la fiche. Sans ces champs, la publication reprend `name` et `description` à la racine du manifeste. Une description est nécessaire à la validation.

Pour les plugins, le Market lit la [déclaration des jeux](developpement-plugins.md#manifeste-et-fournisseur) obligatoire dans `games`. La fiche affiche la compatibilité et les fonctions supplémentaires de la dernière version.

Pour afficher un contact d’assistance sur votre fiche Market, renseignez `market.support.discord` avec une invitation HTTPS sur `discord.gg` ou `discord.com/invite`, ou `market.support.email` avec une adresse e-mail simple. Vous pouvez renseigner les deux. La fiche propose le Discord de KraftInk lorsqu’aucun contact n’est renseigné.

Choisissez l’une des trois formes suivantes pour le nom et le résumé.

### Réutiliser les traductions du paquet

Une clé référence un texte de vos fichiers de langue. C’est le format à utiliser pour conserver les traductions dans les catalogues PHP du paquet :

```json
"market": {
    "name": "my-theme::messages.market.name",
    "description": "my-theme::messages.market.description",
    "image": "preview.jpg"
}
```

Dans `lang/fr/messages.php` :

```php
<?php

return [
    'market' => [
        'name' => 'Mon thème',
        'description' => 'Un thème pour votre communauté.',
    ],
];
```

Dans `lang/en/messages.php` :

```php
<?php

return [
    'market' => [
        'name' => 'My theme',
        'description' => 'A theme for your community.',
    ],
];
```

`my-theme` doit correspondre à l’`id` du manifeste. `messages` désigne le fichier PHP et `market.description` les clés imbriquées du tableau. La publication récupère les langues renseignées. Une clé sans aucune traduction bloque la validation.

### Écrire un texte commun

Pour une présentation identique dans toutes les langues, utilisez du texte direct :

```json
"market": {
    "name": "My theme",
    "description": "A theme for your community."
}
```

Ce texte s’affiche tel quel, sans traduction automatique.

### Renseigner les langues dans le manifeste

Un dictionnaire permet aussi de fournir les textes directement par langue :

```json
"market": {
    "name": {"fr": "Mon thème", "en": "My theme"},
    "description": {
        "fr": "Un thème pour votre communauté.",
        "en": "A theme for your community."
    },
    "image": {"fr": "preview-fr.jpg", "en": "preview-en.jpg"}
}
```

Les valeurs de ce dictionnaire sont des textes directs. Vous pouvez mélanger les formats entre les champs, par exemple un nom commun et une description issue d’une clé. Toutes les langues ne sont pas obligatoires.

Les champs facultatifs `author.name`, `author.url`, `commercial.kind`, `commercial.url`, `commercial.price` et `manual_only` se placent aussi dans `market`. Par exemple, un prix utilise `{"amount": "9.99", "currency": "EUR"}`.

### Rédiger la fiche en Markdown

Ajoutez `MARKET.md` à la racine du paquet pour afficher un texte commun. Pour traduire la fiche, placez un fichier `market.md` dans chaque dossier de langue sous `lang/` et déclarez les chemins dans `market.readme`.

```json
"market": {
    "description": "Un forum pour votre communauté de jeu.",
    "readme": {
        "en": "lang/en/market.md",
        "fr": "lang/fr/market.md"
    }
}
```

Le Market affiche la langue active si elle est disponible, puis l’anglais, puis la première langue renseignée. Écrivez en Markdown UTF-8. Vous pouvez fournir jusqu’à huit langues, avec un maximum de 32 Kio par fichier et de 128 Kio au total. Utilisez la syntaxe Markdown pour la mise en forme et les liens. La fiche ignore les balises HTML et le dépôt direct d’un ZIP les refuse.

### Ajouter des icônes et des images

- Renseignez `market.icon` avec un nom Bootstrap Icons en minuscules, avec des tirets entre les mots, comme `chat-square-text`, ou avec le chemin d’une image dans `resources/market/`. [Bootstrap Icons](https://icons.getbootstrap.com/)
- Renseignez `market.image` avec l’image de couverture. Un chemin comme `preview.jpg` s’applique à toutes les langues. Utilisez un dictionnaire pour fournir une couverture par langue. Pour un thème, un aperçu de 1440 × 900 pixels (8:5) permet de montrer la mise en page et les éléments principaux dans la carte.
- Pour illustrer une fonctionnalité dans le texte Markdown, placez l’image dans `resources/market/` et utilisez la syntaxe d’image Markdown.

```markdown
![Catégories du forum](resources/market/categories.webp)
```

Une URL HTTPS publique directe convient aussi pour la couverture, une icône sous forme d’image ou une image du texte Markdown. Les couvertures publiées depuis GitHub acceptent aussi les formats GIF et AVIF. Pour les fichiers inclus dans un ZIP envoyé au Market, utilisez le format PNG, JPEG ou WebP, avec un maximum de 2 Mio par image. Les icônes et images du texte Markdown partagent une limite de huit fichiers distincts et de 6 Mio au total.

## Notes de version

Pour un dépôt GitHub référencé, le Market récupère les notes de chaque version dans les publications GitHub.

Pour un ZIP envoyé au Market, ajoutez un fichier facultatif `CHANGELOG.md` à la racine du paquet avec les notes propres à cette version. Pour traduire les notes, placez un fichier `changelog.md` dans chaque dossier de langue et déclarez les chemins dans `market.changelog`. Le Market applique le même ordre de langue que pour la description de la fiche.

```json
"market": {
    "changelog": {
        "en": "lang/en/changelog.md",
        "fr": "lang/fr/changelog.md"
    }
}
```

Vous pouvez fournir jusqu’à huit langues et 8 Kio par fichier. Les notes acceptent les liens Markdown et les images servies par une URL HTTPS publique directe. Placez les images incluses dans le ZIP dans la description de la fiche. Une version sans notes apparaît quand même dans l’historique.

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
