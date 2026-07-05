# ADR 0003: Choix de Supabase pour l'Authentification, la Base de Données et le Stockage

## Statut
Accepté

## Contexte
Une marketplace nécessite une authentification sécurisée (avec gestion des rôles artisans vs clients), une base de données relationnelle persistante et robuste pour gérer les transactions et stocks, ainsi qu'un espace de stockage cloud optimisé pour les photos de produits soumises par les artisans.

## Décision
Nous choisissons **Supabase** comme plateforme Backend-as-a-Service (BaaS) pour la persistance, l'auth et le stockage.

## Rationale
* **PostgreSQL managé** : Accès à une base de données PostgreSQL puissante, gérant nativement les requêtes complexes et les transactions ACIDs.
* **Supabase Auth** : Fournit un système d'authentification robuste (OAuth, email/mot de passe, OTP) et des politiques de sécurité au niveau des lignes (RLS - Row Level Security).
* **Object Storage intégré** : Facilite le stockage et la distribution globale (via CDN) des images de produits haute définition.
* **Intégration Lovable** : L'écosystème Lovable s'interface parfaitement avec Supabase, permettant une génération automatique de tables et de requêtes.

## Conséquences
* Le client et le serveur backend utilisent les variables d'environnement Supabase pour authentifier et autoriser les opérations.
* Les requêtes de données transactionnelles sensibles passent par l'API Gateway FastAPI pour appliquer les règles métiers de la marketplace.
