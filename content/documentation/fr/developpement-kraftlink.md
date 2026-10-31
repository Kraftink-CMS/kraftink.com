# Développer KraftLink

Ce guide concerne les modifications du connecteur Java et les clients du protocole de livraison. Pour relier un serveur existant, suivez [Installer KraftLink](kraftlink.md).

## Construire les JAR

Les sources se compilent avec **JDK 25 et Maven**, en bytecode Java 8. Le projet contient `common`, les connecteurs `bukkit`, `velocity` et `hytale`, et le module d’assemblage `all`. Le connecteur Bukkit prend pour base Minecraft 1.8.8 dans la branche 1.8.x. Chaque plateforme conserve ses propres prérequis Java à l’exécution.

```shell
mvn clean package
```

Cette commande construit les trois variantes et le JAR universel. Maven résout l’API publique `com.hypixel.hytale:Server:0.7.4` depuis le [dépôt officiel Hytale](https://maven.hytale.com/release). La dépendance reste en `provided` et le manifeste cible exactement le serveur `0.7.4`. Aucun SDK local ni secret de téléchargement n’est nécessaire.

Le build complet regroupe les quatre JAR dans le dossier `target/` à la racine du projet, ignoré par Git. Le numéro du build remplace `VERSION` :

| Fichier | Plateforme |
| --- | --- |
| `target/KraftLink.jar` | Bukkit, Spigot, Paper, Folia, Velocity et Hytale |
| `target/KraftLink-Bukkit-VERSION.jar` | Bukkit, Spigot, Paper et Folia |
| `target/KraftLink-Velocity-VERSION.jar` | Velocity |
| `target/KraftLink-Hytale-VERSION.jar` | Hytale |

Installez un seul JAR KraftLink par instance, sans suffixe `-thin`. Les API des serveurs restent des dépendances de compilation. Gson est embarqué et isolé. Conservez sa licence et sa notice sous `META-INF/licenses/gson/`.

Gardez les appels réseau et les écritures du journal hors des threads de jeu. Utilisez le scheduler serveur Bukkit, les schedulers régionaux ou d’entités lorsqu’ils sont disponibles sur Paper/Folia, le scheduler du proxy sur Velocity et les threads de monde sur Hytale. Sur Velocity, les livraisons exécutent les commandes de la console du proxy. Ciblez une liaison du serveur de jeu pour les commandes de ce serveur. Vérifiez chaque version ciblée et les commandes des plugins concernés, notamment sur Folia.

## Récupérer une livraison

Le client utilise HTTPS et `Authorization: Bearer JETON_SERVEUR`, avec le jeton de la fiche du serveur. Envoyez `POST /api/link/commands/claim` :

```json
{
    "protocol": 1,
    "players": ["00000000000000000000000000000001"],
    "player_names": ["ExamplePlayer"],
    "limit": 20
}
```

`players` contient au plus 2 000 UUID présents et peut être vide. La liste facultative `player_names` contient les pseudos des joueurs présents. `limit` va de 1 à 20. Les réponses JSON utilisent `success` pour indiquer la réussite et `data` pour le résultat. La liste `data.commands` fournit pour chaque livraison `id`, `command`, `uuid`, `player`, `channel`, `lease`, `lease_expires_at` et `requires_online`. Une cible par pseudo est fournie dans `player`, une cible par UUID dans `uuid`.

Le bail dure cinq minutes et appartient au serveur demandeur. Le budget est partagé entre les canaux du noyau et des extensions. Une commande exigeant un joueur présent n’est proposée que si son UUID figure dans `players` ou son pseudo dans `player_names`. Le connecteur vérifie à nouveau sa présence sur le serveur avant l’exécution. Sans `player_names`, les commandes ciblées par pseudo avec présence requise restent en attente. Traitez les identifiants de livraison comme opaques. Leur préfixe ne donne aucun accès aux tables du fournisseur.

## Confirmer sans rejouer

Après traitement, envoyez `POST /api/link/commands/{id}/ack` avec l’identifiant complet :

```json
{
    "lease": "bail-recu",
    "state": "executed",
    "error": null
}
```

| État | Usage |
| --- | --- |
| `executed` | Exécution terminée |
| `failed` | Échec confirmé à corriger |
| `uncertain` | Effet possible nécessitant une vérification |
| `deferred` | Report de trente secondes sans consommer la tentative |

`error` est facultatif, limité à 1 000 caractères et sans secret. Le bail et le serveur doivent correspondre. Une répétition d’accusé ne doit pas produire une seconde récompense. Un accusé accepté renvoie `{"success":true,"data":{"ok":true}}`.

Enregistrez durablement l’identifiant et le résultat avant l’accusé. Si le CMS repropose une commande exécutée, confirmez-la avec le nouveau bail sans la rejouer. Une coupure avant journalisation laisse un résultat incertain : vérifiez son effet avant toute nouvelle exécution, même après expiration du bail.

## Distribuer le connecteur

Le wrapper unique `.github/workflows/release.yml` appelle le workflow commun de `Kraftink-CMS/automation` pour les vérifications des PR vers `dev` et la publication manuelle. Il utilise l’action locale `.github/actions/build/action.yml`, qui construit les JAR avec Maven. La première version reprend le numéro du POM sans son suffixe de développement, soit `1.0.0`. Les suivantes sont calculées depuis les tags et les Conventional Commits, avec un patch par défaut. Le workflow prépare le numéro stable dans le POM parent et les références des modules. Maven construit directement cette version.

`master` garde le numéro stable publié. Après publication vérifiée, un commit sur `dev` prépare le patch suivant dans les POM, par exemple `1.0.1-dev` après `1.0.0`. Les changements plus récents et une cible supérieure sont conservés. Faites un `git pull` avant de continuer le développement. Ce commit ne publie pas de JAR.

| Déclenchement | Résultat |
| --- | --- |
| PR vers `dev` | Mêmes validations et build Maven que la release, sans publication ni upload d’artifacts |
| Simple push sur `dev` ou `master` | Aucune compilation CI |
| **Actions → Release → Run workflow** dans le dépôt KraftLink | Préparation, build, promotion et publication du commit de `dev` dans une même exécution |

Le contrôle requis pour les PR vers `dev` est **checks / Validate changes**. Les rôles **Maintain** et **Admin** conservent leur droit de push direct sur `dev` grâce au bypass prévu pour ces rôles.

Pour publier une stable, ouvrez **Actions → Release → Run workflow** dans le dépôt KraftLink. Gardez `bump=auto`, ou choisissez `patch`, `minor` ou `major`. La demande capture le commit courant de `dev`, même si le formulaire reste sur `master`. La même exécution prépare la version et ouvre sa PR vers `master` avant le build, construit les fichiers, puis attend la fusion autorisée avant de publier. Les PR vers `dev` et les releases exécutent les mêmes validations `mvn clean package` via le hook de build. Après réussite du build et vérification de la source, le workflow émet le statut requis **Release validated source**.

Un échec du build laisse la PR ouverte. Une nouvelle demande **Run workflow** est alors refusée avec son lien. Pour une erreur temporaire sur le même SHA, utilisez **Re-run failed jobs**. Pour corriger le code avant fusion, poussez la correction sur `dev`, puis choisissez **Re-run all jobs** dans cette même exécution pour préparer à nouveau la source et reconstruire tous les JAR avec la version choisie. Changer de cible exige de fermer la PR puis de lancer une nouvelle **Release**.

Le workflow KraftLink utilise son `GITHUB_TOKEN` temporaire pour publier `KraftLink.jar`, les trois variantes et `SHA256SUMS`. KraftLink publie uniquement des versions stables. Une publication interrompue après fusion doit être reprise avant la suivante, avec ses fichiers déjà préparés. Les artifacts temporaires expirent après sept jours. Les fichiers déjà publiés restent immuables. Aucun fichier `release-policy.json` n’est nécessaire.

Le même formulaire propose `notes_mode` (`auto`, `append` ou `replace`) et le champ Markdown `notes`. Les [options communes de notes de version](extensions-publication.md#notes-de-version) s’appliquent aussi aux JAR KraftLink, avec une liste issue des commits réels depuis la précédente stable.

La release exécute `mvn clean package`, joint les quatre JAR et calcule `SHA256SUMS`. Une erreur Maven empêche la publication. L’API Hytale sert à la compilation et reste exclue des JAR distribués.

Avant distribution, vérifiez la reprise après coupure, les accusés répétés, un bail expiré et l’absence de double exécution. Les accès comptes/soldes et les transports d’autres jeux sont décrits dans les [API serveur](developpement-serveurs.md).
