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

## Deploy to Render
This repository is a monorepo. Point Render to the `server` folder.

### Dashboard Configuration (no render.yaml required)
- Root Directory: `server`
- Environment: `Node`
- Build Command: `npm install`
- Start Command: `npm start`
- Health Check Path: `/health` (exposed in `src/app.js`)
- Environment Variables:
	- `MONGO_URI`: e.g., Atlas SRV URI
	- `JWT_SECRET`: strong random value
	- `OMDB_API_KEY`: optional
	- `REDIS_URL`: optional; enables BullMQ workers

Render automatically provides `PORT`; the server reads `process.env.PORT`.

### Optional render.yaml (at repo root)
```yaml
services:
	- type: web
		name: cinephile-hub-api
		rootDir: server
		env: node
		plan: free
		buildCommand: npm install
		startCommand: npm start
		healthCheckPath: /health
		autoDeploy: true
		envVars:
			- key: MONGO_URI
				value: mongodb+srv://<user>:<password-URL-encoded>@<cluster>.mongodb.net/cinephile_hub?retryWrites=true&w=majority
			- key: JWT_SECRET
				generateValue: true
			- key: OMDB_API_KEY
				value: ""
			- key: REDIS_URL
				value: ""
```

### Security & Secrets
- Do not commit `server/.env` to GitHub. Configure secrets in Render.
- Consider rotating any previously committed credentials.

### Large Data Files & Git LFS
If you work with large datasets (e.g., `.tsv.gz` over 100 MB), GitHub blocks pushes unless stored via Git LFS.

Options:
- Track large files in LFS:
	1) `git lfs install`
	2) `git lfs track "*.tsv.gz"`
	3) Commit `.gitattributes`
	4) `git lfs migrate import --include="server/data/title.basics.tsv.gz"`
- Or remove large files from history:
	- Use `git filter-repo --invert-paths --path "server/data/title.basics.tsv.gz"` and force-push.

### Notes on Top 250 data
To respect content policies and copyrights, this project does not scrape IMDb directly. Use a legally permissible API (e.g., OMDb with an API key) or curated datasets to seed movies. You can adapt a separate importer script to enqueue movies via `POST /movies`.
