# Suivre les statistiques du site et des serveurs

Installez **Statistiques** depuis le panneau **Plugins**, puis ouvrez **Extensions → Statistiques**. Le droit **Consulter les statistiques** donne accès à ce panneau.

Sélectionnez une période prédéfinie ou des dates personnalisées. La comparaison superpose la période précédente de même durée quand elle est encore disponible. Survolez une courbe ou utilisez son curseur pour lire les valeurs d’une date précise. Le CSV exporte les données quotidiennes de la période et du serveur sélectionnés.

## Audience du site

Les graphiques distinguent les pages vues, les visiteurs quotidiens et les nouvelles inscriptions. Le détail sépare les vues des visiteurs et celles des membres connectés. Un visiteur est compté une fois par session et par jour. Une même session peut donc compter sur plusieurs jours. Les sections les plus vues regroupent les pages par route publique, par exemple toutes les actualités.

La répartition présente les navigateurs, leurs versions majeures, les systèmes d’exploitation et les domaines référents externes. Le plugin ignore les robots reconnus, conserve des compteurs agrégés et réutilise la session KraftInk. Il n’ajoute aucun cookie et ne conserve ni adresse IP, ni identifiant de membre, ni URL complète, ni agent utilisateur brut. La collecte commence à l’activation du plugin et compte les pages publiques servies par KraftInk.

## Serveurs de jeu

Activez le [planificateur](operations.md#planificateur) pour relever les données toutes les cinq minutes. Une liaison par ping suffit pour suivre le nombre de joueurs si le serveur le communique. KraftLink est facultatif et peut aussi fournir la mémoire Java utilisée et les TPS, selon la plateforme.

Le graphique CPU est disponible avec Statistiques 1.0.2 et KraftLink 1.5.0, ou des versions compatibles plus récentes. Il indique la part du processeur utilisée par le processus Java qui exécute KraftLink lorsque l’environnement Java fournit cette mesure.

Les courbes présentent les pics de joueurs, de mémoire et de CPU, ainsi que les TPS moyens. Une période d’un jour affiche les mesures par heure. Un tiret indique une valeur indisponible. Le nombre de relevés aide à lire les résultats d’une période incomplète.

Les périodes suivent l’heure UTC. Réglez la durée de conservation dans **Fonctionnement → Conservation des données → Anciens envois et tâches, en jours**.
