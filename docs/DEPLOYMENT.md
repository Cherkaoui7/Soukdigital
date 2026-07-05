# Guide de Déploiement et d'Exploitation

Ce document décrit les procédures de conteneurisation (Docker), la gestion des variables d'environnement, l'observabilité et les SLAs de performance de Souk Digital Marketplace.

---

## 🐳 Conteneurisation (Docker)

Chaque service de la plateforme possède son propre fichier `Dockerfile` isolé. En production et en intégration locale, les services communiquent à travers un réseau Docker virtuel isolé :

* **frontend** : Conteneurisant l'application TanStack Start (Node.js).
* **backend** : Conteneurisant l'API Gateway FastAPI (Python).
* **ai-services/** : Conteneurs spécialisés par tâche d'inférence (Flux, Upscaler, Background Remover) pour permettre une allocation de GPU dédiée.
* **redis** : Utilisé comme broker de tâches pour les workers d'IA asynchrones.
* **postgres** : Base de données locale de développement.
* **nginx** : Proxy inverse gérant les redirections et la sécurité TLS.

---

## 🌐 Variables d'Environnement

### Configuration Client (Frontend)
Les variables exposées au navigateur doivent être définies dans `.env` ou `.env.local` et préfixées par `VITE_` :
* `VITE_SUPABASE_URL` : URL publique du projet Supabase.
* `VITE_SUPABASE_PUBLISHABLE_KEY` : Clé publishable anonyme.

### Configuration API & Services
Les variables secrètes résident dans `backend/.env` et ne sont jamais exposées :
* `SUPABASE_SERVICE_ROLE_KEY` : Clé de service à privilèges élevés.
* `REDIS_URL` : URL de connexion au broker Redis.
* `DATABASE_URL` : Chaine de connexion de la base de données PostgreSQL principale.

---

## 📈 Observabilité & Journalisation

Chaque microservice doit produire des logs structurés (au format JSON en production) afin de faciliter le diagnostic :

1. **Request ID** : Un identifiant unique de requête doit être généré à la passerelle (Gateway) et propagé à tous les appels de microservices internes et de workers.
2. **Niveaux de Journalisation** :
   * `INFO` : Suivi global des requêtes et cycles de vie.
   * `WARNING` : Problèmes mineurs, requêtes lentes, échecs d'appels temporaires.
   * `ERROR` : Échecs bloquants avec trace de pile d'exécution complète.
3. **Mesure de temps** : Journalisation systématique du temps de traitement de chaque endpoint API et tâche d'inférence IA.

---

## 🚀 Objectifs de Performance (SLAs)

Pour préserver l'expérience utilisateur et l'indexation SEO :

### Frontend (Rendu Client & SSR)
* **First Contentful Paint (FCP)** : < 1.8 secondes.
* **Lighthouse Score** : Objectif > 90 en Performance, SEO et Bonnes Pratiques.
* **SSR Execution Overhead** : < 150 ms (le serveur TanStack Start doit hydrater la page instantanément).

### API Gateway (FastAPI)
* **Temps de Réponse API** : < 300 ms sur 95 % des requêtes synchrones (hors traitements de tâches asynchrones d'IA).

### Microservices IA (Traitement asynchrone)
* **Temps moyen de traitement** : Configurable selon la complexité du modèle (ex: < 5s pour le détourage, < 15s pour l'upscaler). Les résultats de génération lourde s'effectuent en asynchrone pour ne jamais bloquer la navigation de l'utilisateur.

---

## 📈 Surveillance & Métriques (Monitoring)

Le suivi de la santé opérationnelle s'appuie sur la stack **Prometheus & Grafana** :
* **Health Checks** : Chaque conteneur (Gateway, workers IA) expose deux endpoints de diagnostic :
  * `/health/live` : Sonde de réactivité (Liveness probe).
  * `/health/ready` : Sonde de disponibilité des connexions de données (Readiness probe).
* **Métriques clés suivies** :
  * Taux d'utilisation CPU/GPU et mémoire des instances d'inférence.
  * Nombre de requêtes HTTP et code HTTP de retour (2xx, 4xx, 5xx).
  * Taille et temps d'attente de la file de messages Redis.

---

## 💾 Sauvegardes & Restauration (Backups)

* **Bases de Données (PostgreSQL)** :
  * Sauvegarde automatique quotidienne (snapshot) gérée par Supabase avec rétention sur 30 jours.
  * Procédure de restauration testée mensuellement en environnement de staging.
* **Médias (Object Storage)** : Rétention des versions de fichiers activée sur le bucket S3 pour récupérer les suppressions accidentelles.
* **Configurations & Poids IA** : Les poids de modèles d'IA ne font pas l'objet de sauvegardes locales car ils sont reconstructibles à partir du script `download_models.py` pointant sur les dépôts de référence.

---

## 📏 Versionnage (SemVer)

Le projet applique le versionnage sémantique **SemVer** (`MAJOR.MINOR.PATCH`) :
* **MAJOR** : Changement d'API cassant ou refonte complète de la marketplace.
* **MINOR** : Ajout d'une fonctionnalité non cassante (ex: nouvel outil dans AI Studio).
* **PATCH** : Corrections de bugs ou d'optimisations.
* **Release Notes** : Chaque nouvelle version donne lieu à la rédaction de notes de version dans le fichier `CHANGELOG.md`.

---

## 🔍 Audit & Gestion des Dépendances

Afin de se prémunir contre les failles de sécurité de type *Supply Chain* :
* **Audit Mensuel** :
  * Frontend : Exécution de `npm audit` à chaque compilation CI et mise à niveau des paquets vulnérables.
  * Backend & IA : Exécution de `pip-audit` pour valider l'absence de failles connues dans les packages Python.
* **Automatisation** : Activation de **Dependabot** sur le dépôt Git pour générer automatiquement des PRs de correctif de sécurité sur les packages de dépendances.

