# Cinephile Hub Frontend

React + Vite + Material-UI with JWT auth and role-based protected routes.

## Local Development
```bash
cd client
npm install
npm run dev
```

### Environment
Create `client/.env` (or set in your shell):
```
VITE_API_URL=http://localhost:4000
```
The app reads the backend base URL from `VITE_API_URL`.

## Production Build
```bash
cd client
npm run build
# Preview locally (optional)
npx serve -s dist
```

## Deploy to Vercel
This repository is a monorepo. Point Vercel to the `client` folder.

1. Import the GitHub repo in Vercel.
2. Root Directory: `client`
3. Framework Preset: `Vite`
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Environment Variables:
	 - `VITE_API_URL=https://<your-render-backend>.onrender.com`

### Optional: Proxy API to avoid CORS
Create `client/vercel.json` to rewrite `/api` to your backend:
```json
{
	"rewrites": [
		{ "source": "/api/:path*", "destination": "https://<your-render-backend>.onrender.com/:path*" }
	]
}
```
Then call `/api/...` in the frontend; Vercel will proxy to Render.

### Troubleshooting Vercel detection
- Ensure `client/package.json` contains Vite scripts:
	- `dev`: `vite`
	- `build`: `vite build`
	- `preview`: `vite preview`
- Ensure `vite` and `@vitejs/plugin-react` are installed.
