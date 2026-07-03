# 🕌 Souk Digital & Convertisseur SVG

> Plateforme e-commerce 100% marocaine qui transpose l'expérience du souk traditionnel dans le monde numérique, accompagnée de son outil de bureau pour la conversion d'images SVG.

Souk Digital réunit les **maâlems** (maîtres artisans) de Fès, Marrakech, Essaouira, Safi, Tétouan et Chefchaouen autour d'une expérience d'achat authentique : négociation virtuelle avec **Hajj Brahim**, carte de fidélité **Zellige**, paiement à la livraison, suivi Amana, et interface multilingue **Darija / Français / English**.

Le projet inclut également un **Convertisseur SVG**, une application de bureau performante pour gérer et convertir vos fichiers graphiques vectoriels.

---

## ✨ Fonctionnalités

### 🛍️ E-commerce (Souk Digital)
- Catalogue produits multilingue (FR / AR / EN) avec prix en **MAD**
- Fiches produit détaillées avec provenance, artisan, matériaux
- Panier persistant (localStorage + Cloud)
- Checkout avec **Paiement à la livraison (COD)** et **CMI simulé**
- Suivi de commande **Amana** avec timeline visuelle
- Wishlist / Favoris (/favoris)
- Avis clients avec modération admin

### 🗣️ Négociation virtuelle — *Hajj Brahim*
- Chat IA (Gemini 2.5 Flash via Lovable AI Gateway) qui incarne un marchand marocain
- Respect d'un prix plancher (min_price_mad) défini par l'admin
- Prix négocié sauvegardé et appliqué au panier

### 🏅 Carte Zellige — Fidélité
- **1 point offert par tranche de 10 MAD** dépensée
- Paliers : Bronze → Silver (-5%) → Gold (-10%)
- Page dédiée /fidelite avec historique et progression visuelle

### 🖼️ Convertisseur SVG (Application Bureau)
- Application de bureau pour convertir des fichiers SVG en images matricielles (PNG, JPEG, WEBP) ou PDF.
- Interface graphique moderne développée avec **CustomTkinter**.
- Gestion de l'historique des conversions et système de préréglages (presets).
- Application autonome compilée en exécutable (via PyInstaller).

### 🔎 Recherche Darija
- Translittération tolérante (7→ح, 9→ق, 3→ع, etc.)
- Filtres catalogue : ville, artisan, fourchette de prix
- Recherche multilingue FR / AR / Darija latinisée

### 🌍 Multilingue & RTL
- Sélecteur de langue FR / AR / EN
- Direction RTL automatique en arabe
- Typographie **Noto Sans Arabic**

### 🔐 Back-office admin (/admin)
- Gestion produits (CRUD + upload images vers bucket privé product-images)
- Gestion catégories & artisans
- Gestion commandes + saisie n° tracking Amana
- Modération des avis
- **Analytics** : CA, top villes, ventes, commandes
- Broadcast **Web Push** (VAPID)

---

## 🧱 Stack technique

### Web (E-commerce)
| Couche | Technologie |
|--------|-------------|
| Framework | **TanStack Start v1** (React 19 + Vite 7) |
| Styling | **Tailwind CSS v4** + shadcn/ui + Radix |
| Backend | **Lovable Cloud** (Supabase) — Postgres, Auth, Storage, RLS |
| IA | **Lovable AI Gateway** (Gemini 2.5 Flash, gpt-image-2) |

### Desktop (Convertisseur SVG)
| Composant | Technologie |
|-----------|-------------|
| Langage | **Python 3.10+** |
| Interface (GUI) | **CustomTkinter** / Tkinter |
| Empaquetage | **PyInstaller** |

---

## 🚀 Installation locale

### 1. Plateforme E-commerce (Web)

**Prérequis :** Node.js >= 20 ou Bun >= 1.1, compte Lovable Cloud.

`ash
git clone <url-du-repo>
cd souk-digital
bun install
`

Le fichier .env est **auto-généré par Lovable Cloud**. Ne l'éditez pas manuellement.
Lancer en développement :
`ash
bun run dev
`
L'app démarre sur **http://localhost:8080**.

### 2. Convertisseur SVG (Desktop)

**Prérequis :** Python 3.10+

`ash
cd svg_to_img
pip install -r requirements.txt
`

**Pour lancer l'application :**
`ash
python app.py
`

**Pour lancer les tests :**
`ash
pip install -r requirements-dev.txt
pytest tests/
`

**Pour compiler l'exécutable :**
`ash
pyinstaller --name SVGConverter --windowed --onefile app.py
`
L'exécutable sera généré dans le dossier dist/.

---

## 📖 Utilisation

### 👤 Plateforme Web (Visiteur)
1. Choisir la langue (FR / AR / EN) via le sélecteur du header.
2. Parcourir le catalogue /catalogue — filtrer par ville, artisan, prix.
3. Ouvrir une fiche produit -> cliquer **"Négocier avec Hajj Brahim"** 💬
4. Ajouter au panier -> checkout en **paiement à la livraison** ou carte CMI.

### 🖼️ Convertisseur SVG
1. Ouvrez l'application SVGConverter.
2. Importez un fichier SVG depuis votre ordinateur.
3. Choisissez le format de sortie souhaité et ajustez la qualité.
4. Cliquez sur Convertir pour exporter l'image.

---

## 📁 Structure globale du projet

`
.
├── src/                    # Code source de la plateforme e-commerce Web
│   ├── routes/             # File-based routing (TanStack)
│   ├── components/         # Composants UI React
│   ├── lib/                # Logique métier, i18n, fonctions IA
│   └── styles.css          # Tokens design system Marocain
├── svg_to_img/             # Application bureau Convertisseur SVG (Python)
│   ├── app.py              # Point d'entrée de l'application
│   ├── converter/          # Logique de conversion et d'extraction (Python)
│   ├── ui/                 # Composants d'interface (CustomTkinter)
│   └── tests/              # Tests unitaires et d'intégration
└── README.md               # Ce fichier
`

---

## 📜 Licence

Projet propriétaire — **Souk Digital © 2026**. Tous droits réservés.

---

<p align="center">
  <strong>صنع بحب في المغرب — Fait avec ❤️ au Maroc</strong>
</p>
