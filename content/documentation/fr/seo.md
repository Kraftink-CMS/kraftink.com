# Configurer le référencement

Ouvrez **Présentation → Référencement SEO** (`/admin/seo`) pour régler les modèles généraux ou personnaliser une page, y compris l’accueil. Le nom et la description de la communauté se définissent dans les réglages du site.

## Fonctionnement par défaut

Le modèle `{title} - {website_name}` assemble le titre de la page et le nom du site. Par exemple, l’accueil du site « Community » affiche `Accueil - Community` en français et `Home - Community` en anglais. Le nom du site n’est pas répété s’il est identique au titre. Cette structure s’applique aussi aux autres pages et à l’administration.

Les pages et actualités utilisent leur titre, leur résumé et leur couverture publique pour le référencement. L’aperçu de l’éditeur suit les modifications du brouillon avec le même rendu que la page publique, sans l’enregistrer.

La méta-description reprend le résumé complet, avec espaces et entités HTML normalisés. Sans résumé, elle utilise un extrait du contenu de 160 caractères, puis la description du site si le contenu est vide. Cette règle est automatique. Les extensions fournissent la description de leurs propres pages.

Le titre, la description et l’adresse canonique alimentent aussi Open Graph et Twitter. L’image de partage utilise la couverture publique, puis l’image générale et enfin le logo. Les couvertures privées sont exclues. La pagination possède une adresse canonique distincte dès la page 2, sans les paramètres de suivi ordinaires.

## Réglages généraux

L’onglet général permet de choisir :

- La structure des titres, par exemple `{title} - {website_name}`.
- Le modèle de description, initialement `{description}`.
- Les mots-clés facultatifs et la politique d’indexation du site.
- L’image de partage utilisée lorsque la page ne fournit pas sa propre image.

Privilégiez des titres précis et des descriptions utiles. La balise facultative `meta keywords` n’influence pas l’indexation ni le classement Google. Voir les [balises prises en charge par Google](https://developers.google.com/search/docs/crawling-indexing/special-tags).

Si le choix de langue des visiteurs est activé, vous pouvez traduire ces textes. Chaque champ utilise la langue du visiteur, puis l’anglais, la langue du site et sa valeur principale. Désactiver ce choix conserve les traductions.

## Personnaliser une page

Sélectionnez une destination dans l’onglet des pages : accueil, liste des actualités, modèle des articles ou des pages de contenu. Vous pouvez aussi personnaliser chaque page de contenu publique. Les plugins ajoutent leurs listes et modèles de détail.

Le **titre de base** et la **structure du titre** remplissent deux rôles différents :

| Réglage | Exemple | Résultat avec le site « Eden » |
| --- | --- | --- |
| Titre de base | `La boutique` | La structure globale assemble ensuite ce texte |
| Structure héritée | `{title} - {website_name}` | `La boutique - Eden` |
| Structure propre à la page | `{title}` | `La boutique` |
| Structure propre à la page | `{website_name} : {title}` | `Eden : La boutique` |

La structure globale s’applique tant que celle de la page reste vide. L’aide indique la valeur héritée de chaque champ. L’aperçu utilise les exemples du panneau à titre indicatif.

Pour les pages et actualités, un titre personnalisé remplace celui du contenu avant l’application de la structure. Une description personnalisée remplace le modèle global.

Une description personnalisée suit exactement son modèle. Avec `{summary}`, un résumé vide donne une méta-description vide, sans extrait de remplacement. Effacez la personnalisation pour rétablir le comportement automatique.

Ces réglages ne modifient pas le H1 visible, qui reste le titre de la page ou du contenu.

## Variables

Les modèles acceptent les variables suivantes, avec une seule paire d’accolades :

| Variable | Valeur |
| --- | --- |
| `{title}` | Titre de base de la page ou du contenu |
| `{description}` | Description native de la page, issue du résumé puis du contenu pour les pages et actualités |
| `{website_name}` | Nom du site |
| `{site_description}` | Description de votre communauté |
| `{url}` | Adresse canonique de la page |
| `{path}` | Chemin de la page dans le site |
| `{locale}` | Langue du visiteur |
| `{year}` | Année courante dans le fuseau du site |
| `{page}` | Numéro de pagination |

Les plugins peuvent ajouter des variables pour leurs destinations, comme un nom de produit ou une catégorie. Les valeurs insérées restent du texte : elles n’exécutent ni PHP ni Blade et ne sont pas interprétées comme de nouveaux modèles.

Les modèles de détail des pages et actualités proposent aussi `{summary}` pour le résumé complet et `{excerpt}` pour un extrait du contenu. Ces variables sont absentes des modèles généraux, de l’accueil et des listes.

## Indexation et confidentialité

Choisissez `index,follow`, `noindex,follow` ou `noindex,nofollow`. Une exclusion globale ou propre à la page reste prioritaire. Le compte, l’administration, l’authentification et les contenus natifs privés sont toujours exclus.

Une règle `noindex` retire la destination du sitemap, qui respecte aussi la publication et la visibilité des contenus. Le SEO ne remplace pas les contrôles d’accès aux données privées.

Le sitemap se trouve sur `/sitemap.xml`, les consignes d’exploration sur `/robots.txt`. Les moteurs prennent en compte les changements lors de leurs prochaines explorations et peuvent choisir un autre titre ou extrait.

## Intégrer un plugin

Les extensions déclarent leurs pages auprès du noyau pour utiliser les mêmes modèles et le même écran d’administration.

### Déclarer les destinations

Dans le `boot()` du fournisseur, écoutez `App\Events\CollectingSeoPages`. Importez cet événement et `Illuminate\Support\Facades\Event`, puis déclarez séparément la liste et le détail :

```php
Event::listen(CollectingSeoPages::class, function (CollectingSeoPages $event): void {
    $event->add(
        'plugins.exemple.public.products.index',
        __('exemple::messages.seo.products'),
        defaults: [
            'title' => __('exemple::messages.products.title'),
            'description' => __('exemple::messages.products.description'),
        ],
    );
    $event->add(
        'plugins.exemple.public.products.show',
        __('exemple::messages.seo.product'),
        [
            'product_name' => __('exemple::messages.seo.product_name'),
            'category_name' => __('exemple::messages.seo.category_name'),
        ],
        ['plugins.exemple.public.products.localized'],
        [
            'title' => '{product_name}',
            'description' => '{category_name} - {description}',
        ],
    );
});
```

`add()` reçoit la route principale, son libellé traduit, les variables propres à la page, les routes alternatives et les valeurs par défaut facultatives. Ce dernier argument accepte `title` et `description`, sous forme de textes ou de modèles. Le libellé affiché dans le sélecteur ne définit pas le titre SEO.

Les routes doivent exister et accepter GET sans middleware `auth` ou `guest`. Les routes alternatives partagent le même modèle, par exemple pour une URL localisée.

Les variables du plugin commencent par une lettre minuscule, suivie de lettres minuscules, chiffres ou traits de soulignement, sur 50 caractères au maximum. Les noms du noyau sont réservés.

### Fournir les valeurs et les sections

Le contrôleur fournit les valeurs scalaires de base dans `seo` et les variables propres à la page dans `seoVariables`. Les modèles déclarés par le fournisseur les utilisent au rendu :

```php
return view('exemple::default.products.show', [
    'product' => $product,
    'seo' => [
        'title' => $product->name,
        'description' => \App\Kraft\Site\Seo::excerpt($product->description),
    ],
    'seoVariables' => [
        'product_name' => $product->name,
        'category_name' => $product->category?->name ?? '',
    ],
]);
```

Si votre plugin possède ses propres champs SEO, fournissez-les avec les sections `seo_title` et `seo_description`. Elles sont prioritaires sur les personnalisations du type de page, sans modifier le H1. Les pages et actualités du noyau utilisent directement leurs champs éditoriaux :

```blade
@extends('default.layouts.layout')
@section('seo_title', $product->seo_title ?: '')
@section('seo_description', $product->seo_description ?: '')
@section('content')
    <h1>{{ $product->name }}</h1>
@endsection
```

Les sections facultatives `canonical`, `og_type`, `og_image` et `robots` complètent ces valeurs. Fournissez une adresse canonique explicite si une catégorie, une langue ou un paramètre définit le contenu. Le rendu conserve ces paramètres et ajoute la pagination utile.

Appliquez vos règles de visibilité dans le contrôleur et vos contributions à `CollectingSitemapEntries`. Pour un contenu réservé sur une route publique, ajoutez `noindex,nofollow` dans `robots`. Ces contrôles restent à la charge du plugin.

Un thème qui remplace un layout public conserve `default.layouts.partials.metadata` et `$seoVariables`. Gardez un seul H1 principal par page et les niveaux suivants pour les cartes et sous-sections.
