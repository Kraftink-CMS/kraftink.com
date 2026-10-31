# Modèle de publication d’un jeu

Ce modèle fournit les sources d’un module de jeu indépendant. Les outils de construction et de publication sont maintenus dans `Kraftink-CMS/automation`. Les jeux intégrés au CMS suivent sa distribution et n’utilisent pas ce modèle.

## Préparer le dépôt

Créez un dépôt public `Game-*` de Kraftink-CMS avec un premier README sur `master`. Après création de `dev`, ajoutez-y les sources et un manifeste tel que :

```json
{
    "id": "example-game",
    "name": "Example Game",
    "description": "example-game::messages.description",
    "market": {
        "description": "example-game::messages.description"
    },
    "type": "game",
    "version": "1.0.0-dev",
    "namespace": "Community\\Games\\ExampleGame\\",
    "provider": "Community\\Games\\ExampleGame\\Providers\\GameServiceProvider",
    "requires": { "cms": ">=0.0.1", "php": "^8.4.1" }
}
```

Le module ne déclare pas `builtin: true` et ne remplace pas un identifiant réservé au noyau. Fournissez les traductions de la description dans `lang/fr/messages.php` et `lang/en/messages.php`.

Les champs `name`, `type` et `version` du manifeste identifient le module. La présentation publique utilise `market.name` lorsqu’il est renseigné, sinon `name`, et la description traduite de `market.description`. Le générateur réutilise la clé `messages.description` du module, dont les textes sont définis une seule fois dans `lang/fr/messages.php` et `lang/en/messages.php`. Remplacez la description initiale par les fonctions réellement proposées par votre jeu. Aucune traduction supplémentaire n’est obligatoire.

La prévisualisation d’un ZIP lit les traductions comme des données, sans exécuter ses fichiers PHP. Les fichiers de langue doivent retourner des tableaux de textes littéraux. Une présentation publique différente du résumé interne peut utiliser une clé dédiée, par exemple `example-game::market.description` dans `lang/fr/market.php`, sans recopier ses textes dans le manifeste. Le nom public peut suivre le même principe avec `market.name`.

Les images sont facultatives. Si vous fournissez un vrai visuel, placez-le dans `resources/market/` et déclarez par exemple `"image": "preview.png"` dans `market`, ou un dictionnaire par langue. Les formats acceptés sont PNG, JPG, JPEG, WebP, GIF et AVIF. Le fichier doit exister dans le paquet, sans traversée de dossier ni lien symbolique. Une URL HTTPS publique sans identifiants, port, paramètres ni fragment est également possible. Ne déclarez aucun chemin d’image en l’absence du fichier. Les fichiers SVG ne sont pas des images de présentation du Market.

Le [contrôleur central](https://github.com/Kraftink-CMS/automation) installe et maintient automatiquement le petit workflow **Release** sur `master` et `dev` lors de l’initialisation du dépôt. Il crée `dev` si nécessaire, après configuration de `master`. Aucun YAML, jeton ou fichier de politique de publication n’est à configurer pour le module. L’installation peut attendre le prochain passage de bootstrap ou les contrôles requis par le dépôt.

Le workflow est installé directement sur GitHub. Ce modèle et le générateur de jeux du CMS fournissent les sources du module, sans fichier `.github/workflows/release.yml` ni copie des outils génériques.

## Valider et publier

Installez les dépendances du projet `automation`, puis lancez `node /absolute/path/automation/scripts/releases/build.mjs check` depuis la racine du module. Les tests génériques se lancent avec `npm test` depuis `automation`. Conservez et exécutez les tests métier du module. Installez ensuite une archive sur un site de test. Si `build.scss` est déclaré, fournissez les dépendances npm et le fichier de verrou pour compiler les styles.

Le versionnement, la publication avec **Release**, les reprises après échec et l’inscription au Market sont décrits dans [Distribuer une extension](../extensions-publication.md).
