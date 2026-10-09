# Visitor Management System

A full-stack visitor management system with React frontend and Node.js backend.

## Live Demo

- **Frontend:** [https://your-app.netlify.app](https://your-app.netlify.app)
- **Backend:** [https://vms-backend.onrender.com](https://vms-backend.onrender.com)

## Features

- ✅ Visitor check-in/check-out with QR code
- ✅ Photo capture during check-in
- ✅ Pre-registration for expected visitors
- ✅ Real-time notifications (Socket.io)
- ✅ Host management
- ✅ Dashboard with analytics
- ✅ CSV/PDF report exports
- ✅ Redis caching (optional)

## Tech Stack

| Frontend | Backend | Database |
|----------|---------|----------|
| React 18 | Node.js | PostgreSQL |
| Vite | Express.js | Redis (optional) |
| Tailwind CSS | Socket.io | |

## Project Structure

```
├── backend/          # Node.js API server
├── frontend/         # React application
└── README.md
```

## Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### Backend Setup
```bash
cd backend
cp .env.example .env    # Edit with your DB credentials
npm install
npm run db:migrate
node src/db/seed.js
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Default Login
- **Email:** admin@vms.com
- **Password:** admin123

## Deployment

- **Frontend:** Netlify (from `/frontend` folder)
- **Backend:** Render (from `/backend` folder)

See [backend/README.md](./backend/README.md) for detailed deployment instructions.

## License

MIT
