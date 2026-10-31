# Référencement et partage

KraftInk prépare les métadonnées des pages à partir de leur titre, résumé et couverture. **Présentation → Référencement SEO** permet d’adapter ce résultat pour l’accueil, les listes et les pages de détail.

## Valeurs automatiques

La structure initiale `{title} - {website_name}` associe le titre de la page au nom du site. La description utilise le résumé, puis un extrait du contenu s’il est vide, puis la description du site. L’image de partage utilise la couverture publique, l’image générale ou le logo.

Pour les pages et actualités, l’aperçu de l’éditeur suit la saisie sans enregistrer le brouillon.

## Personnaliser les modèles

Les réglages généraux définissent la structure des titres, le modèle de description et l’image de partage. Dans l’onglet des pages, choisissez une destination pour remplacer ses valeurs.

| Réglage | Exemple avec le site « Eden » |
| --- | --- |
| Titre de base `La boutique`, structure héritée | `La boutique - Eden` |
| Structure propre `{title}` | `La boutique` |
| Structure propre `{website_name} : {title}` | `Eden : La boutique` |

Un champ de structure vide reprend le modèle général. Ces réglages changent le titre transmis aux moteurs, sans modifier le titre visible dans la page.

Les modèles acceptent `{title}`, `{description}`, `{website_name}`, `{site_description}`, `{url}`, `{path}`, `{locale}`, `{year}` et `{page}`. Les détails des pages et actualités proposent aussi `{summary}` et `{excerpt}`. Les plugins peuvent ajouter leurs propres variables, indiquées dans le panneau.

Une description personnalisée suit son modèle sans repli automatique. Avec `{summary}`, un résumé vide donne une description vide. Effacez la personnalisation pour retrouver le comportement automatique.

## Indexation

`index,follow` autorise l’indexation. `noindex,follow` ou `noindex,nofollow` demande son exclusion et retire la page du sitemap. L’administration, le compte et les contenus natifs privés restent exclus.

Le sitemap est disponible sur `/sitemap.xml`, les consignes d’exploration sur `/robots.txt`. Une règle SEO ne protège pas l’accès à un contenu privé. Les moteurs prennent en compte les changements lors de leurs prochaines explorations.
