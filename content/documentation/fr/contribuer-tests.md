# Tests de non-régression

Testez les comportements observables susceptibles de casser lorsqu’une autre partie de KraftInk évolue : autorisations, conservation des données, validation, calculs financiers, imports, compatibilité des extensions, mises à jour signées et récupération.

Utilisez une entrée réaliste et vérifiez le résultat ou l’état enregistré. Réutilisez un scénario existant lorsqu’il couvre déjà le risque. Isolez les données de test des sites installés, des services externes et des véritables identifiants.

Évitez les instantanés qui figent les textes actuels, classes CSS, emplacements de menus, nombres d’onglets, structures de helpers privés ou nombres de fichiers de migration. Les contrôles d’interface sont utiles lorsqu’ils protègent les accès, l’échappement du contenu, les valeurs sensibles ou un parcours d’erreur utilisable. Une modification de présentation ou de texte ne doit pas imposer de réécrire des tests sans rapport.

Par exemple, vérifiez qu’un changement de catégorie créant un cycle est refusé sans altérer les données existantes. N’imposez pas un élément `select` particulier ni l’agencement actuel de ses options.

Exécutez les suites du noyau autonome et des scripts depuis le dépôt du CMS :

```shell
php artisan test --compact --exclude-group=bundled-extensions
node --test tests/Frontend/*.test.mjs tests/Release/*.test.mjs
```

Le groupe `bundled-extensions` couvre l’intégration avec les sources externes des plugins et thèmes. Les racines de ses paquets pointent par défaut vers les dossiers `plugins/` et `themes/` du workspace, afin que les données de test d’intégration ne puissent pas mélanger silencieusement des classes sources avec des vues installées. Lancez `php artisan test --compact` dans le workspace de développement complet pour l’inclure. Les tests d’intégration frontend sont explicitement ignorés lorsque les sources de leur paquet externe sont absentes. Les contrôles des PR du noyau n’exigent pas ces projets séparés.

Une fixture d’intégration qui enregistre directement un fournisseur doit également faire pointer la racine de l’extension vers ses sources et enregistrer un reçu d’installation actif après migration de sa base isolée. Les permissions par défaut des extensions ne sont disponibles que pour les paquets actifs. Actualisez les instances des catalogues d’extensions et de permissions lorsque la fixture change l’état d’installation. Conservez les middlewares d’autorisation habituels et utilisez les permissions requises par le scénario.
