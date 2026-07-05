# ADR 0004: Isolation des Services IA en Microservices Asynchrones

## Statut
Accepté

## Contexte
Les modèles d'apprentissage profond pour l'amélioration d'images (Upscaling ESRGAN, segmentation d'arrière-plan, génération Flux/SDXL) ont des exigences matérielles élevées (nécessité de GPU) et des temps de traitement d'inférence variables (de 1s à 25s). Les exécuter directement de manière synchrone sur le serveur d'API principal bloquerait les threads HTTP, ralentirait le catalogue de produits, et entraînerait des indisponibilités.

## Décision
Nous choisissons d'isoler chaque composant d'IA sous forme de microservice asynchrone indépendant communiquant via des files de messages Redis.

## Rationale
* **Non-blocage du thread d'API** : Le backend FastAPI enregistre la demande instantanément et délègue le travail aux workers IA, évitant les timeouts et maintenant l'API Gateway réactive.
* **Mise à l'échelle sélective** : Les conteneurs d'inférence (contenant les modèles de traitement d'image) peuvent être alloués individuellement à des serveurs équipés de GPU (ex: instances AWS EC2 P3 ou équivalent), tandis que l'API principale tourne sur des serveurs standards moins coûteux.
* **Robustesse aux pannes** : En cas de surcharge ou de plantage d'un modèle d'IA, les tâches en attente restent dans la file Redis et aucun processus HTTP n'est interrompu.

## Conséquences
* Le frontend implémente des mécanismes de polling ou d'écoute WebSocket pour suivre le cycle de vie des tâches (`PENDING` ──► `SUCCESS`/`FAILED`).
* Les poids volumineux des modèles sont hébergés et téléchargés dynamiquement à l'initialisation des conteneurs IA, éliminant tout fichier binaire lourd du dépôt Git.
