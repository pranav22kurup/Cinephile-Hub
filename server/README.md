# Cinephile Hub Backend

Express.js + MongoDB API with JWT auth and admin role. Provides movie endpoints, sorting, searching, and a distributed queue for lazy insertion using BullMQ (Redis), with an in-memory fallback for local development.

## Endpoints
- GET /movies
- GET /movies/sorted?by=name|rating|releaseDate|duration&order=asc|desc
- GET /movies/search?q=term
- GET /movies/:id
- POST /movies (admin)
- PUT /movies/:id (admin)
- DELETE /movies/:id (admin)
- POST /auth/login

## Setup
1. Copy `.env.example` to `.env` and set values.
2. Ensure MongoDB is running.
3. Optional: Set `REDIS_URL` for distributed queue (BullMQ). Without Redis, an in-memory queue is used.

### Install & Run
```bash
cd server
npm install
npm run seed:admin
npm run dev
```

### Notes on Top 250 data
To respect content policies and copyrights, this project does not scrape IMDb directly. Use a legally permissible API (e.g., OMDb with an API key) or curated datasets to seed movies. You can adapt a separate importer script to enqueue movies via `POST /movies`.
