# Guide d'Assistance IA (Assistant Guide)

Ce guide est destiné aux assistants de codage IA (Gemini, Claude, ChatGPT, Codex) travaillant sur le dépôt Souk Digital Marketplace. Lisez ce fichier avant d'effectuer toute modification de code ou recherche.

---

## 🏛️ Résumé de l'Architecture du Projet

```text
Souk Digital Marketplace/
├── src/                      # Frontend TanStack Start (Rendu SSR + Client)
├── backend/                  # API Gateway FastAPI (Python)
├── ai-services/              # Services IA (Python, traitement asynchrone)
└── shared/                   # Configurations et types partagés
```

---

## 🚫 Chemins et Dossiers à Ignorer (Watch & Search Ignored)

**Ne recherchez, n'indexez et ne lisez jamais** les fichiers situés dans les répertoires suivants :

* `**/venv/**` et `**/.venv/**` (Environnements virtuels Python contenant des dizaines de milliers de fichiers).
* `**/__pycache__/**` (Fichiers de cache compilés Python).
* `**/node_modules/**`, `**/dist/**`, `**/build/**` et `**/.output/**` (Artefacts JS).
* `**/.pytest_cache/**`, `**/.mypy_cache/**`, `**/.ruff_cache/**`.
* `**/*.db`, `**/*.sqlite`, `**/*.sqlite3` (Bases de données SQL locales).

Si vous devez effectuer une recherche globale, filtrez explicitement pour n'inclure que les fichiers sources utiles (ex: `src/` pour le frontend, `backend/app/` pour le backend).

---

## 🖥️ Règles SSR (Server-Side Rendering)

Le code situé dans `src/` s'exécute à la fois sur le serveur TanStack Start et dans le navigateur.

* **Pas d'accès direct au navigateur** : N'utilisez pas `window`, `document`, `navigator`, `localStorage`, `sessionStorage`, ou d'autres objets globaux du navigateur à la racine d'un fichier ou d'un composant.
* **Garde obligatoire** : Encapsulez toujours ces appels dans un bloc de garde :
  ```typescript
  if (typeof window !== 'undefined') {
    // Code exécutable uniquement côté client (navigateur)
  }
  ```

---

## ⛔ Règles d'Importation Strictes

* Le frontend (code dans `src/`) ne doit **jamais** importer de code, de script, ou de module Python issu de `backend/` ou de `ai-services/`.
* La communication de données s'effectue exclusivement par des appels HTTP/WebSocket asynchrones à travers l'API Gateway FastAPI.

---

## 🔧 Commandes Terminales Autorisées (OS: Windows / PowerShell)

Lorsque vous proposez ou exécutez des commandes système :

* Utilisez toujours PowerShell.
* **Ne proposez jamais de commande `cd`**. Exécutez directement les commandes en renseignant le chemin complet ou en utilisant le paramètre de répertoire de travail (`Cwd`).
* Pour exécuter le serveur frontend de développement :
  ```powershell
  npm run dev
  ```
* Pour exécuter le serveur backend FastAPI :
  ```powershell
  venv/Scripts/activate # pour activer l'environnement virtuel local
  uvicorn main:app --reload
  ```
