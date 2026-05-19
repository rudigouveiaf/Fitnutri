# Fit·Nutri

Application sport & nutrition pour suivre vos entraînements et vos repas, à plusieurs profils.

## Déploiement rapide sur Vercel (5 minutes)

### 1. Créez un compte Vercel
- Allez sur https://vercel.com
- Cliquez sur **Sign up** → choisissez "Continue with Email" ou "Continue with GitHub"
- C'est gratuit, pas de carte bancaire demandée

### 2. Préparez le projet
- Dézippez le fichier que je vous ai donné
- Vous obtenez un dossier `fitnutri` contenant des fichiers comme `package.json`, `src/`, etc.

### 3. Déployez (3 options, choisissez la plus simple)

#### Option A — Glisser-déposer (la plus simple)
1. Sur https://vercel.com/new, cherchez le lien **"deploy a template"** ou utilisez l'interface ligne de commande
2. La méthode glisser-déposer demande un compte GitHub. Si vous n'en avez pas, passez à l'option B.

#### Option B — Via Vercel CLI (recommandé, le plus rapide)
1. Ouvrez un terminal (Terminal sur Mac, Invite de commandes sur Windows)
2. Installez Node.js depuis https://nodejs.org (version LTS) si vous ne l'avez pas
3. Tapez ces commandes une par une :
   ```bash
   npm install -g vercel
   cd /chemin/vers/le/dossier/fitnutri
   vercel
   ```
4. Vercel vous demande de vous connecter (un lien s'ouvre dans votre navigateur)
5. Répondez aux questions :
   - "Set up and deploy?" → **Y**
   - "Which scope?" → choisissez votre compte
   - "Link to existing project?" → **N**
   - "Project name?" → tapez `fitnutri` (ou ce que vous voulez)
   - "Directory?" → laissez par défaut (appuyez sur Entrée)
   - "Override settings?" → **N**
6. Vercel installe tout et vous donne une URL : `https://fitnutri-xxx.vercel.app`
7. Pour mettre en production : `vercel --prod`

#### Option C — Via GitHub (idéal si vous voulez modifier plus tard)
1. Créez un compte GitHub sur https://github.com
2. Créez un nouveau dépôt (repository), nom : `fitnutri`
3. Sur Vercel, cliquez "Add New… → Project" → "Continue with GitHub" → autorisez
4. Choisissez votre dépôt `fitnutri`
5. Cliquez "Deploy". C'est fini.

### 4. Installez l'app sur vos téléphones
Une fois en ligne sur `https://fitnutri-xxx.vercel.app` :

**Sur iPhone :**
1. Ouvrez l'URL dans Safari
2. Appuyez sur le bouton Partager (carré avec flèche vers le haut)
3. "Sur l'écran d'accueil" → "Ajouter"
4. L'icône apparaît comme une vraie app

**Sur Android :**
1. Ouvrez l'URL dans Chrome
2. Menu (trois points en haut à droite) → "Ajouter à l'écran d'accueil" ou "Installer l'application"
3. L'icône apparaît comme une vraie app

## Test en local avant déploiement (optionnel)

Si vous voulez tester avant :
```bash
cd fitnutri
npm install
npm run dev
```
Puis ouvrez http://localhost:5173

## Stockage des données

Les données sont stockées dans le navigateur de chaque téléphone (localStorage). Cela veut dire :
- Vos données et celles de votre femme sont indépendantes (chaque téléphone garde les siennes)
- Si vous voulez voir les données de votre femme depuis votre téléphone, il faudra plus tard ajouter une vraie base de données partagée (Firebase, Supabase…)
- Les données ne disparaissent pas tant que vous n'effacez pas les données du site dans votre navigateur

## Pour modifier l'app

Tout le code est dans `src/App.jsx`. Quand vous voulez des changements, redonnez-moi le projet, je modifie, vous redéployez avec `vercel --prod` ou en pushant sur GitHub.

## Support

Si quelque chose coince, dites-moi à quelle étape et avec quel message d'erreur.
