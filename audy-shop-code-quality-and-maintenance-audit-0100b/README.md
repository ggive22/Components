# Audy Shop - Plateforme E-commerce pour le Togo

Audy Shop est une plateforme e-commerce moderne construite avec React, TypeScript, Vite et Supabase, conçue spécialement pour le marché togolais.

## 🚀 Fonctionnalités

- **Catalogue de produits** avec recherche et filtrage par catégorie
- **Panier d'achat** persistant avec gestion des quantités
- **Processus de commande** complet avec collecte d'informations client
- **Intégration WhatsApp** pour la confirmation des commandes
- **Système de notation et d'avis** pour les produits
- **Tableau de bord admin** pour la gestion des produits et commandes
- **Design responsive** optimisé pour mobile et desktop
- **Animations fluides** avec Framer Motion
- **Support multilingue** (préparé pour l'extension)

## 🛠️ Technologies utilisées

### Frontend
- **React 18** avec hooks modernes
- **TypeScript** pour une sécurité de type optimale
- **Vite** comme outil de build ultra-rapide
- **Tailwind CSS** pour le styling utility-first
- **Framer Motion** pour les animations
- **React Router DOM** pour la navigation
- **React Hook Form** pour la gestion des formulaires
- **Zustand** pour la gestion d'état global
- **TanStack Query** pour le caching et la synchronisation des données
- **Lucide React** pour les icônes
- **Sonner** pour les notifications toast

### Backend & Infrastructure
- **Supabase** comme backend-as-a-service (PostgreSQL, Auth, Storage)
- **Zod** pour la validation de schéma
- **Class Variance Authority** pour les variantes de composants Tailwind

### Testing & Qualité
- **Vitest** pour les tests unitaires
- **Testing Library** pour les tests de composants
- **ESLint** pour le linting du code
- **Prettier** pour le formatage du code
- **TypeScript** pour le contrôle de types statique

## 📋 Prérequis

Avant de commencer, assurez-vous d'avoir installé :

- [Node.js](https://nodejs.org/) (version 18 ou supérieure)
- [npm](https://www.npmjs.com/) (version 9 ou supérieure)
- Un compte [Supabase](https://supabase.com/)

## ⚙️ Installation

1. Clonez le dépôt :
   ```bash
   git clone https://github.com/votre-utilisateur/audy-shop.git
   cd audy-shop
   ```

2. Installez les dépendances :
   ```bash
   npm install
   ```

3. Créez un fichier `.env` à la racine du projet basé sur `.env.example` :
   ```bash
   cp .env.example .env
   ```

4. Remplissez les variables d'environnement dans votre fichier `.env` :
   ```
   VITE_SUPABASE_URL=votre_url_supabase
   VITE_SUPABASE_PUBLISHABLE_KEY=votre_anon_public_key
   ```

5. Configurez votre projet Supabase :
   - Créez un nouveau projet sur [Supabase](https://supabase.com/)
   - Exécutez le schéma SQL fourni dans `DATABASE_SETUP.md`
   - Configurez les politiques de sécurité Row Level Security (RLS) comme indiqué dans la documentation

## 🛠️ Scripts disponibles

Dans le répertoire du projet, vous pouvez exécuter :

- `npm dev` - Lance l'application en mode développement
- `npm build` - Construit l'application pour la production
- `npm preview` - Prévisualise la build de production
- `npm lint` - Exécute ESLint pour vérifier la qualité du code
- `npm test` - Lance les tests unitaires avec Vitest
- `npm test:ui` - Lance les tests avec l'interface Vitest
- `npm test:coverage` - Lance les tests avec rapport de couverture
- `npm typecheck` - Vérifie les types TypeScript sans compilation

## 🏗️ Architecture du projet

```
src/
├── components/         # Composants React réutilisables
│   ├── ui/            # Composants UI de base (buttons, inputs, etc.)
│   └── ...            # Composants spécifiques à l'application
├── lib/               # Utilitaires et helpers
│   ├── format.ts      # Fonctions de formatage (monnaie, dates, etc.)
│   ├── logger.ts      # Utilitaire de logging
│   └── types.ts       # Types TypeScript partagés
├── services/          # Services d'appel API
│   └── products.ts    # Services liés aux produits
├── store/             # Gestion d'état (Zustand)
├── hooks/             # Hooks React personnalisés
├── layouts/           # Layouts de pages
├── pages/             # Pages de l'application
├── integrations/      # Intégrations tierces (Supabase)
└── test/              # Configuration de tests
```

## 🔒 Sécurité

La sécurité est une priorité dans Audy Shop :

1. **Variables d'environnement** : Toutes les clés sensibles sont stockées dans des variables d'environnement et ne sont jamais committées
2. **Supabase RLS** : Des politiques de sécurité strictes sont appliquées au niveau de la base de données
3. **Validation des entrées** : Toutes les entrées utilisateur sont validées tant côté client que côté serveur
4. **Protection XSS** : Les contenus sont correctement échappés pour prévenir les attaques XSS
5. **Headers de sécurité** : Des headers de sécurité appropriés sont configurés pour la production

## 🧪 Couverture de tests

Le projet maintient une couverture de tests élevée :

- **Tests unitaires** pour tous les utilitaires et services
- **Tests d'intégration** pour les flux critiques
- **Objectif de couverture** : >80% pour les unités, >70% pour l'intégration

Pour vérifier la couverture :
```bash
npm test:coverage
```

## 📱 Responsive Design

Audy Shop est entièrement responsive et fonctionne sur :
- Téléphones mobiles (≥320px de largeur)
- Tablettes (≥768px de largeur)
- Ordinateurs de bureau (≥1024px de largeur)
- Grands écrans (≥1440px de largeur)

## 🚀 Déploiement

### Déploiement sur Vercel

1. Installez la CLI Vercel si ce n'est pas déjà fait :
   ```bash
   npm i -g vercel
   ```

2. Connectez-vous à Vercel :
   ```bash
   vercel login
   ```

3. Déployez le projet :
   ```bash
   vercel
   ```

4. Suivez les instructions pour configurer les variables d'environnement :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`

### Déploiement manuel

Pour déployer manuellement sur n'importe quel serveur statique :
```bash
npm build
```
Le contenu du dossier `dist/` peut être déployé sur n'importe quel serveur HTTP.

## 📚 Documentation supplémentaire

- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Guide d'installation détaillé
- [DATABASE_SETUP.md](./DATABASE_SETUP.md) - Instructions pour configurer la base de données Supabase
- [API_REFERENCE.md](./API_REFERENCE.md) - Référence des endpoints API (si applicable)
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Guidelines pour contribuer au projet
- [CHANGELOG.md](./CHANGELOG.md) - Historique des versions

## 🐛 Rapport de problèmes

Si vous trouvez un bug ou avez une suggestion d'amélioration, veuillez ouvrir une issue sur le dépôt GitHub en incluant :
- Une description claire du problème
- Les étapes pour le reproduire
- Des captures d'écran si applicable
- Votre environnement (navigateur, version de l'app, etc.)

## 👥 Contribuer

Les contributions sont les bienvenues ! Pour contribuer :

1. Forkez le dépôt
2. Créez une branche pour votre fonctionnalité (`git checkout -b feature/amazing-feature`)
3. Committez vos changements (`git commit -m 'Add some amazing feature'`)
4. Poussez vers la branche (`git push origin feature/amazing-feature`)
5. Ouvrez une Pull Request

Assurez-vous de suivre les guidelines de codage et d'inclure des tests pour toute nouvelle fonctionnalité.

## 📄 Licence

Ce projet est sous licence MIT - voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🙏 Remerciements

- [Supabase](https://supabase.com/) pour leur plateforme backend incroyable
- [Vercel](https://vercel.com/) pour leur plateforme de déploiement
- Tous les contributeurs open source dont les bibliothèques rendent ce projet possible

---

**Audy Shop - Fait avec ❤️ pour le commerce togolais**