# TradeSense AI

> La Premiere Prop Firm Assistee par IA pour l'Afrique

Une plateforme de trading de nouvelle generation qui combine analyses IA en temps reel, outils de trading intelligents, et education premium.

## Stack Technique

- **Backend**: Python Flask (Flask-RESTful, Flask-JWT-Extended, SQLAlchemy)
- **Frontend**: React + TypeScript + Vite
- **Database**: SQLite (dev) / PostgreSQL (prod)
- **Charts**: TradingView Lightweight Charts
- **Data Feeds**: yfinance (US/Crypto) + BVCscrap (Maroc)

## Structure du Projet

```
TradeSense/
├── backend/
│   ├── app.py              # Application Flask
│   ├── models.py           # Modeles SQLAlchemy
│   ├── routes/             # API Endpoints
│   ├── services/           # Business Logic
│   ├── requirements.txt    # Dependencies Python
│   └── render.yaml         # Config Render
├── frontend/
│   ├── src/
│   │   ├── components/     # Composants React
│   │   ├── features/       # Features (auth, dashboard, etc.)
│   │   ├── store/          # State management (Zustand)
│   │   └── services/       # API client
│   ├── vercel.json         # Config Vercel
│   └── package.json
└── database.sql            # Schema SQL
```

## Installation Locale

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
flask run
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

## Deploiement

### Frontend (Vercel)

1. Connectez votre repo GitHub a Vercel
2. Selectionnez le dossier `frontend` comme Root Directory
3. Ajoutez la variable d'environnement: `VITE_API_URL`

### Backend (Render)

1. Connectez votre repo GitHub a Render
2. Creez un Web Service avec le dossier `backend`
3. Creez une base PostgreSQL
4. Ajoutez les variables d'environnement

## Fonctionnalites

- **Module A**: Challenge Engine (5% daily loss, 10% total loss, 10% profit target)
- **Module B**: Payment (Mock + PayPal Sandbox)
- **Module C**: Dashboard Temps Reel (TradingView Charts)
- **Module D**: Leaderboard (Top 10 Traders)

## API Endpoints

- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/challenges/plans` - Plans disponibles
- `POST /api/trading/execute` - Executer un trade
- `GET /api/leaderboard/top-10` - Classement

## Licence

Projet Academique - TradeSense 2025
