import React from 'react'
import { Card, CardContent, CardMedia, Typography } from '@mui/material'

export default function MovieCard({ movie }) {
  const poster = movie.posterUrl && movie.posterUrl !== 'N/A'
    ? movie.posterUrl
    : 'https://via.placeholder.com/300x450?text=No+Poster'

  return (
    <Card>
      <CardMedia component="img" height="300" image={poster} alt={movie.name} />
      <CardContent>
        <Typography variant="h6">{movie.name}</Typography>
        <Typography variant="body2" color="text.secondary">
          Rating: {movie.rating ?? 'N/A'} | Duration: {movie.duration ?? 'N/A'} mins
        </Typography>
        {movie.releaseDate && (
          <Typography variant="caption" color="text.secondary">
            Released: {new Date(movie.releaseDate).toLocaleDateString()}
          </Typography>
        )}
        {movie.description && (
          <Typography sx={{ mt: 1 }} variant="body2">{movie.description}</Typography>
        )}
      </CardContent>
    </Card>
  )
}
