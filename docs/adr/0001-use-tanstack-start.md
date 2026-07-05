# ADR 0001: Choix de TanStack Start pour le Framework Frontend

## Statut
Accepté

## Contexte
Le projet requiert une interface utilisateur réactive (Single Page Application) tout en bénéficiant d'une excellente optimisation pour le référencement naturel (SEO) indispensable pour une place de marché publique (Marketplace). Il nous faut un framework qui unifie les routes client, le rendu côté serveur (SSR), et la gestion d'état réactive.

## Décision
Nous choisissons **TanStack Start** comme framework de développement frontend. 

## Rationale
* **Rendu SSR natif** : Permet l'hydratation et le rendu initial côté serveur pour assurer des temps de chargement réduits et une indexabilité optimale (Lighthouse SEO 100/100).
* **Router typé (TanStack Router)** : Offre une sécurité de typage complète de bout en bout sur les paramètres de routes, les requêtes de recherche (Search Params) et les redirections.
* **TanStack Query intégré** : Fournit une gestion robuste du cache, du préchargement (prefetching) et de la synchronisation d'état serveur, ce qui est parfait pour le catalogue de produits.
* **Intégration transparente avec Lovable** : Offre une fluidité de développement et de modification visuelle à la racine du dépôt.

## Conséquences
* Nécessité de respecter les contraintes strictes du rendu SSR (ne pas accéder aux objets globaux comme `window` sans vérification).
* Unification du serveur SSR Node.js et du bundling client via Vite.
