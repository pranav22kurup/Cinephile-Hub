# Cinephile Hub

Full-stack movie web application with user browsing, search, sorting, and admin CRUD. Built with React (MUI) on the frontend and Node.js/Express + MongoDB on the backend. JWT-based authentication with role-based access control.

## Features
- View movie details (supports pagination)
- Search by name or description
- Sort by name, rating, release date, and duration
- Admin: Add, edit, delete movies
- JWT auth, admin-only protected routes
- Distributed queue for lazy insertion (BullMQ + Redis), with in-memory fallback for local dev

## Repository Structure
- server/ — Express API, MongoDB models, auth, queue
- client/ — React + Vite + Material-UI UI

## Prerequisites
- Node.js 18+
- MongoDB (local or remote)
- Optional: Redis (for distributed queue)

## Backend Setup (server)
1. Create env file:
	- Copy server/.env.example to server/.env and set:
	  - `PORT=4000`
	  - `MONGO_URI=mongodb://localhost:27017/cinephile_hub`
	  - `JWT_SECRET=your-strong-secret`
	  - `REDIS_URL=redis://localhost:6379` (optional)
2. Install and run:
	```bash
	cd server
	npm install
	npm run seed:admin # creates admin user (env ADMIN_EMAIL/ADMIN_PASSWORD optional)
	npm run dev
	```

### Optional: Start Redis via Docker
```bash
docker run -d --name redis -p 6379:6379 redis:7-alpine
```
Then set `REDIS_URL=redis://localhost:6379` in server/.env.

## Frontend Setup (client)
1. Create env file:
	- Copy client/.env.example to client/.env and set `VITE_API_URL=http://localhost:4000`
2. Install and run:
	```bash
	cd client
	npm install
	npm run dev
	```

## Authentication
- Use the Login page to authenticate.
- Admin credentials are created by the seed script; set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in server/.env to control values.
- Admin-only routes: Add/Edit/Delete movies.

## Data: IMDb Top 250
To respect copyrights and policies, the project does not scrape IMDb. You can seed the database using legally permissible sources (e.g., OMDb API with your key) or curated datasets. Link to IMDb Top 250 is provided for reference only: https://www.imdb.com/chart/top?ref_=nv_mv_250

## API Summary
- GET /movies — paginated list
- GET /movies/sorted — sorted list (`by`, `order`, `page`, `limit`)
- GET /movies/search — search (`q`, `page`, `limit`)
- GET /movies/:id — single movie
- POST /movies — admin only; queued lazy insertion
- PUT /movies/:id — admin only
- DELETE /movies/:id — admin only
- POST /auth/login — email/password -> JWT

## Notes on Performance & Concurrency
- MongoDB indexes on `name`, `description` (text), and numeric fields used for sorting.
- Lazy insert via BullMQ worker (Redis) with concurrency; fallback in-memory queue for local dev.

## Deployment
This is a monorepo. Configure each platform to point at the correct subfolder.

### Backend — Render
- Root Directory: `server`
- Environment: `Node`
- Build Command: `npm install`
- Start Command: `npm start`
- Health Check: `/health`
- Env Vars: `MONGO_URI`, `JWT_SECRET`, optional `OMDB_API_KEY`, optional `REDIS_URL`

### Frontend — Vercel
- Root Directory: `client`
- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`
- Env Vars: `VITE_API_URL=https://<your-render-backend>.onrender.com`
- Optional: `client/vercel.json` rewrites `/api/:path*` → backend to avoid CORS.

### Large Files & Git LFS
GitHub blocks files >100 MB. If you need large datasets (e.g., `.tsv.gz`), use Git LFS (`git lfs track "*.tsv.gz"`) or keep datasets outside Git and download at build/runtime.


## License
See LICENSE.
