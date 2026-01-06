import React from 'react'
import { Card, CardContent, CardMedia, Typography } from '@mui/material'

export default function MovieCard({ movie }) {
  return (
    <Card>
      {movie.posterUrl && (
        <CardMedia component="img" height="300" image={movie.posterUrl} alt={movie.name} />
      )}
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
