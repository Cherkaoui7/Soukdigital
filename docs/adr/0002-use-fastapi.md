# ADR 0002: Choix de FastAPI pour le Backend et l'API Gateway

## Statut
Accepté

## Contexte
La plateforme intègre des fonctionnalités d'intelligence artificielle avancées (Upscaling, génération d'images, suppression d'arrière-plan). Les modèles et bibliothèques de traitement d'IA (Hugging Face, Diffusers, PyTorch, PyMuPDF, etc.) sont écrits en Python. Nous avons besoin d'un backend performant, asynchrone, et capable de s'interfacer naturellement avec ces scripts.

## Décision
Nous choisissons **FastAPI** pour implémenter notre API Gateway principale et notre serveur backend.

## Rationale
* **Performance asynchrone** : FastAPI est basé sur Starlette et Uvicorn, offrant des performances de pointe en I/O asynchrones en Python.
* **Typage & Validation de données** : Utilisation native de Pydantic pour la validation des requêtes et réponses JSON, garantissant des contrats d'API fiables.
* **Auto-documentation** : Génération automatique des spécifications Swagger/OpenAPI interfaçables avec nos outils de test.
* **Écosystème Python** : Permet d'appeler directement les pipelines IA et de gérer des files de tâches avec Redis (Arq / Celery).

## Conséquences
* Architecture réseau découplée où le frontend interagit avec FastAPI en HTTP/WS, et FastAPI redistribue les calculs.
* Besoin d'exclure les artefacts de compilation et environnements virtuels Python (`venv`, `__pycache__`) de la surveillance de Vite.
