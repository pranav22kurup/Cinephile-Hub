import React, { useState } from 'react'
import { Alert, Button, Stack, TextField } from '@mui/material'
import { useAuthorizedApi } from '../../services/api'

export default function AddMovie() {
  const api = useAuthorizedApi()
  const [form, setForm] = useState({ name: '', description: '', rating: '', releaseDate: '', duration: '', director: '', posterUrl: '' })
  const [msg, setMsg] = useState(null)

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const onSubmit = async (e) => {
    e.preventDefault()
    setMsg(null)
    const payload = { ...form, rating: Number(form.rating) || 0, duration: Number(form.duration) || 0, releaseDate: form.releaseDate ? new Date(form.releaseDate) : undefined }
    const res = await api.post('/movies', payload)
    setMsg({ type: 'success', text: `Queued insertion. Job ID: ${res.data?.jobId || 'n/a'}` })
    setForm({ name: '', description: '', rating: '', releaseDate: '', duration: '', director: '', posterUrl: '' })
  }

  return (
    <form onSubmit={onSubmit}>
      <Stack spacing={2}>
        {msg && <Alert severity={msg.type}>{msg.text}</Alert>}
        <TextField label="Name" name="name" value={form.name} onChange={onChange} required />
        <TextField label="Description" name="description" minRows={3} multiline value={form.description} onChange={onChange} />
        <TextField label="Rating" name="rating" value={form.rating} onChange={onChange} />
        <TextField label="Release Date" name="releaseDate" type="date" value={form.releaseDate} onChange={onChange} InputLabelProps={{ shrink: true }} />
        <TextField label="Duration (mins)" name="duration" value={form.duration} onChange={onChange} />
        <TextField label="Director" name="director" value={form.director} onChange={onChange} />
        <TextField label="Poster URL" name="posterUrl" value={form.posterUrl} onChange={onChange} />
        <Button type="submit" variant="contained">Add Movie</Button>
      </Stack>
    </form>
  )
}
