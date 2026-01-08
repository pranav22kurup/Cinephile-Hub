# Import IMDb Top 250

This script imports Top-250-like movies using IMDb public datasets and optionally enriches details via OMDb.

- Source datasets (official, public): https://datasets.imdbws.com/
  - `title.basics.tsv.gz` (titles)
  - `title.ratings.tsv.gz` (ratings + votes)
- We filter type=`movie`, non-adult, and require a vote threshold (50k) and then take the top 250 by rating (tie-breaker: votes).
- Optional enrichment using OMDb if `OMDB_API_KEY` is set.

## Usage
```bash
cd server

npm run import:imdb:top250
```

Fields mapped to Movie:
- imdbId → `imdbId` (unique upsert key)
- primaryTitle → `name`
- startYear → `releaseDate` (Jan 1 fallback)
- runtimeMinutes → `duration`
- genres → `genres`
- averageRating → `rating`
- OMDb: `Plot` → `description`, `Poster` → `posterUrl`, `Director` → `director`

Notes:
- The official IMDb "Top 250" list is curated; this import approximates it based on datasets.
- No scraping is performed; only public datasets + optional OMDb API are used.
