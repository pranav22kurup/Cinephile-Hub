import React, { useEffect, useState } from 'react'
import { Grid, Pagination, Stack, FormControl, InputLabel, Select, MenuItem } from '@mui/material'
import { api } from '../services/api'
import MovieCard from '../components/MovieCard'

export default function Home() {
  const [movies, setMovies] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState('name')
  const [order, setOrder] = useState('asc')
  const limit = 12

  const fetchMovies = async () => {
    const res = await api.get('/movies/sorted', { params: { page, limit, by: sortBy, order } })
    setMovies(res.data.items || [])
    setTotal(res.data.total || 0)
  }

  useEffect(() => { fetchMovies() }, [page, sortBy, order])

  const pageCount = Math.ceil(total / limit)

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={2}>
        <FormControl size="small">
          <InputLabel id="sort-by-label">Sort By</InputLabel>
          <Select labelId="sort-by-label" value={sortBy} label="Sort By" onChange={(e) => setSortBy(e.target.value)}>
            <MenuItem value="name">Name</MenuItem>
            <MenuItem value="rating">Rating</MenuItem>
            <MenuItem value="releaseDate">Release Date</MenuItem>
            <MenuItem value="duration">Duration</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small">
          <InputLabel id="order-label">Order</InputLabel>
          <Select labelId="order-label" value={order} label="Order" onChange={(e) => setOrder(e.target.value)}>
            <MenuItem value="asc">Ascending</MenuItem>
            <MenuItem value="desc">Descending</MenuItem>
          </Select>
        </FormControl>
      </Stack>
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
