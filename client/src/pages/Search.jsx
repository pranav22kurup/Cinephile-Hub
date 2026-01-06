import React, { useEffect, useState } from 'react'
import { Grid, Pagination, Stack, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material'
import { api } from '../services/api'
import MovieCard from '../components/MovieCard'

export default function Search() {
  const [movies, setMovies] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const limit = 12

  useEffect(() => {
    const id = setTimeout(() => setDebounced(query), 400)
    return () => clearTimeout(id)
  }, [query])

  const searchMovies = async () => {
    if (!debounced) { setMovies([]); setTotal(0); return }
    const res = await api.get('/movies/search', { params: { page, limit, q: debounced } })
    setMovies(res.data.items || [])
    setTotal(res.data.total || 0)
  }

  useEffect(() => { searchMovies() }, [page, debounced])

  const pageCount = Math.ceil(total / limit)

  return (
    <Stack spacing={2}>
      <TextField label="Search by name or description" value={query} onChange={(e) => setQuery(e.target.value)} />
      <Grid container spacing={2}>
        {movies.map((m) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={m._id}>
            <MovieCard movie={m} />
          </Grid>
        ))}
      </Grid>
      {pageCount > 1 && (
        <Pagination count={pageCount} page={page} onChange={(e, p) => setPage(p)} />
      )}
    </Stack>
  )
}
