# foody Platform

Monorepo for the foody food delivery platform (admin + API).

| Service | Port | Path |
|---------|------|------|
| Admin (Vite + shadcn) | 3000 | `admin/` |
| API (Express + Sequelize) | 3001 | `back/` |
| Mobile (Flutter) | — | `StudioProjects/food` or link here |

## Database

PostgreSQL database **`food`**, user **`postgres`**, password in `back/.env`.

```bash
# Create database (once)
createdb food

# Install & seed backend
cd back
npm install
npm run seed
npm run dev
```

## Admin

```bash
cd admin
npm install
npm run dev
```

Open http://localhost:3000

## Production (PM2)

Build the admin **before** starting PM2 (set your API URL for the build):

```bash
cd admin
npm install
VITE_API_URL=https://your-domain.com/api npm run build
node server.js   # or: npm start — serves dist/ on port 3000
```

Backend:

```bash
cd back
cp .env.example .env   # configure production DB + CORS
npm install
npm run seed           # first deploy only
npm start              # port 3001
```

Or run both from repo root:

```bash
npm install --prefix back
npm install --prefix admin
VITE_API_URL=https://your-domain.com/api npm run build --prefix admin
pm2 start ecosystem.config.cjs
pm2 save
```

**Note:** `npm start` in `admin/` requires `dist/` to exist — run `npm run build` first.

## Flutter

```bash
cd /path/to/flutter/food
flutter pub get
flutter run
```

API default URLs:
- iOS simulator: `http://localhost:3001/api`
- Android emulator: `http://10.0.2.2:3001/api`
- Physical device: `flutter run --dart-define=API_BASE_URL=http://YOUR_LAN_IP:3001/api`

## API Endpoints

- `GET /api/health`
- `GET /api/categories`
- `GET /api/restaurants?category=&q=`
- `GET /api/dishes?category=&q=`
- `GET /api/orders`
- `PATCH /api/orders/:id/status`
- `GET/POST/PUT/DELETE /api/users`
- `GET/POST/PUT/DELETE /api/payments`
