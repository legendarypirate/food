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
