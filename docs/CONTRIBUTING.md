# Guide de Contribution de Souk Digital Marketplace

Ce document définit les conventions de développement, de versionnement, et de tests à respecter par tous les collaborateurs (humains ou assistants IA).

---

## 🌿 Convention Git & Flux de Travail

Le projet utilise une variante de Git Flow pour la gestion de ses branches :

* `main` : Branche stable de production.
* `develop` : Branche d'intégration pour les fonctionnalités en cours de validation.
* `feature/*` : Branches de développement de nouvelles fonctionnalités (partent de `develop`, fusionnent dans `develop`).
* `fix/*` : Branches de résolution de bugs (partent de `develop`, fusionnent dans `develop`).
* `hotfix/*` : Corrections urgentes appliquées directement sur `main` (fusionnées ensuite dans `develop`).
* `release/*` : Branches de préparation de version.

### Format des Messages de Commit
Chaque message de commit doit respecter les préfixes sémantiques suivants :
* `feat:` Nouvelle fonctionnalité.
* `fix:` Résolution de bug.
* `refactor:` Modification du code qui n'ajoute pas de fonctionnalité ni ne résout de bug.
* `docs:` Ajout ou mise à jour de la documentation.
* `perf:` Amélioration des performances.
* `test:` Ajout ou correction de tests.
* `build:` Changements impactant le système de build (Vite, Docker, scripts npm).
* `chore:` Tâches de maintenance diverses.

---

## 📏 Conventions de Code & Formatage

Pour garantir l'homogénéité du code source, des linters et formateurs sont configurés dans chaque environnement.

### Frontend
* **TypeScript strict** : Aucun type `any` n'est toléré sans commentaire d'explication.
* **ESLint** : Validation syntaxique et application des règles de style obligatoires avant validation.
* **Prettier** : Formatage automatique du code activé à la sauvegarde.

### Backend & AI Services
* **Ruff** : Linter rapide pour Python configuré à la racine du dossier backend.
* **Black** : Formateur officiel pour le code Python.
* **isort** : Tri automatique des importations Python.
* **MyPy** : Vérification statique des types Python (types hints obligatoires sur les signatures de fonctions API).

---

## ⛔ Règles d'Importations (Import Rules)

Pour maintenir la propreté du code et éviter les couplages accidentels entre services, respectez le schéma d'importation suivant :

```text
       ┌───────────┐
       │  shared/  │
       └─────▲─────┘
             │ (Imports autorisés)
    ┌────────┴────────┐
    │                 │
┌───┴─────┐     ┌─────┴─────┐
│  src/   │     │  backend/ │
│(Frontend│     │ (FastAPI) │
└─────────┘     └───────────┘
```

* **Interdiction stricte** : Aucun fichier du dossier `src/` (frontend) ne doit importer de module ou de type issu de `backend/` ou de `ai-services/`.
* **Échanges** : Toute communication de données entre les couches se fait uniquement via des contrats JSON typés définis dans le répertoire partagé ou exposés par l'API Gateway.

---

## ✅ Politique de Tests

### Frontend
* **Tests Unitaires** : Couverture des fonctions utilitaires, des hooks React personnalisés, et de la logique de gestion d'état locale.
* **Tests de Composants** : Validation du rendu des éléments interactifs clés de l'interface utilisateur.

### Backend (FastAPI)
* **Tests Unitaires** : Validation de la logique métier, des services, et des calculs internes de l'API.
* **Tests d'Intégration** : Validation des endpoints HTTP et de la communication avec la base de données de test en utilisant `TestClient` de FastAPI.

### AI Services
* **Validation des modèles** : Vérification de la non-régression des poids lors du chargement des pipelines d'inférence.
* **Tests de performances** : Suivi du temps de traitement de l'inférence des modèles (mesure de la latence).

---

## 🔒 Règles de Sécurité

* **Aucun secret dans le code** : Les identifiants, tokens, clés privées API, et clés Supabase secrètes doivent être chargés exclusivement via des variables d'environnement.
* **Validation d'Entrée** : Tous les fichiers et métadonnées envoyés par l'utilisateur doivent être rigoureusement analysés et validés par les schémas Pydantic (backend) et Zod (frontend) avant tout traitement.
* **Nettoyage automatique** : Les fichiers intermédiaires de traitement d'IA doivent être supprimés automatiquement après génération ou échec du traitement pour éviter l'exposition ou la fuite de données utilisateur.
