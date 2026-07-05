# Feuille de Route Technique (Roadmap) - Souk Digital Marketplace

Ce document présente la trajectoire d'évolution technique et fonctionnelle du projet Souk Digital Marketplace pour structurer l'implémentation des différentes phases de développement.

---

## 📍 Phase 1 : Cœur de la Marketplace (Marché local et transactions)
* **Objectif** : Mettre en place les fondations de la plateforme e-commerce et des profils artisans.
* **Fonctionnalités** :
  * Portail client et profils d'artisans.
  * Catalogue de produits et filtres dynamiques (catégories, villes, prix).
  * Système de panier d'achats localisé et persistant.
  * Authentification des utilisateurs (clients et artisans via Supabase Auth).
  * Tunnel d'achat complet avec intégration de la passerelle de paiement (CMI).
  * Suivi de commande et livraison.

---

## 🎨 Phase 2 : AI Studio & Outils Créatifs (Services IA Initiaux)
* **Objectif** : Enrichir l'expérience des artisans avec des outils de retouche et d'amélioration assistés par IA.
* **Fonctionnalités** :
  * Intégration de l'**AI Image Generator** (SDXL/Flux) pour générer des fonds de présentation.
  * Module **AI Image Upscaler** (super-résolution ESRGAN) pour améliorer les photos basse qualité.
  * Module **AI Background Remover** pour détourer automatiquement les photos de produits.
  * Module **AI Mockup Generator** pour projeter les designs (tissus, broderies) sur des modèles ou objets en situation.

---

## 📈 Phase 3 : AI Marketplace & Dashboards Commerçants
* **Objectif** : Offrir des outils d'analyse de données avancés aux commerçants et un moteur de recommandation intelligent.
* **Fonctionnalités** :
  * Recommandations personnalisées de produits basées sur le comportement de navigation.
  * Dashboard commerçant détaillé (statistiques de ventes, panier moyen, visiteurs, stocks).
  * Génération automatique de descriptions de produits optimisées SEO (AI Writer).
  * Outils d'aide à la fixation des prix basés sur l'historique et la demande du marché (Dynamic Pricing).

---

## 🐳 Phase 4 : Mise à l'échelle & Infrastructure de Production
* **Objectif** : Assurer la scalabilité, la haute disponibilité et la tolérance aux pannes.
* **Fonctionnalités** :
  * Migration vers une infrastructure multi-régions avec intégration d'un CDN (Content Delivery Network).
  * Orchestration des conteneurs via Kubernetes (K8s) pour gérer le cycle de vie des microservices IA et de la Gateway.
  * Séparation physique et auto-scaling des instances de calcul GPU pour l'inférence.
  * Surveillance continue avec alertes automatisées (Prometheus, Grafana, Alertmanager).
