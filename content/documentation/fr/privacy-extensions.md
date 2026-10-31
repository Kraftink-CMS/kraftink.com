# Gérer les données personnelles

Une extension qui conserve des données personnelles doit participer à l’export et à l’anonymisation du compte, même lorsqu’elle est désactivée.

## Déclarer le gestionnaire

Dans `manifest.json` :

```json
"privacy": "Vendor\\Package\\Services\\Privacy"
```

Le service est dans `src/Services/Privacy.php`, sous le namespace du paquet. Il implémente `App\Kraft\Extensions\Contracts\PrivacyHandler` :

```php
public function export(\App\Events\ExportingPersonalData $event): void;
public function anonymize(\App\Events\AccountDeleting $event): void;
```

Le CMS charge uniquement cette classe, sans démarrer le fournisseur, les routes ou les migrations. Le manifeste est le point d’entrée. N’ajoutez pas un second listener dans le fournisseur. Si vos tables n’ont jamais été installées, le gestionnaire ne fait rien.

## Export

Ajoutez les données sous la clé égale à l’identifiant du paquet dans `$event->data`. Sélectionnez uniquement celles du membre et appliquez ses droits actuels aux contenus privés. Ne remplacez pas les clés du noyau.

Vous pouvez fournir des collections paresseuses. Le CMS prépare l’export avant l’envoi et interrompt le traitement si une erreur de curseur ou une limite de `config/privacy.php` survient. N’exposez ni secrets, chemins de stockage, notes internes ou données appartenant à d’autres membres.

## Anonymisation

Le gestionnaire s’exécute dans la transaction globale du compte : une erreur annule toutes les écritures en base. Différez les suppressions physiques de fichiers jusqu’au commit. Préservez les fichiers encore référencés et les enregistrements nécessaires à l’historique en retirant leur contenu personnel.

Traitez aussi les anciennes révisions : elles ne doivent pas restaurer des données supprimées pour confidentialité. Pour les [images d’éditeur privées](ui-contributions.md#editeurs-et-images-privees), appelez `anonymizeUser($id)`.

Le chargement défaillant d’un paquet concerné interrompt la demande. Il ne doit pas être interprété comme une absence de données.

## Vérifier le comportement

Testez un export avec droits restreints, les références vers d’autres comptes, l’absence de tables, l’extension désactivée et l’annulation complète après une erreur. Les fixtures utilisent des comptes et fichiers isolés.
