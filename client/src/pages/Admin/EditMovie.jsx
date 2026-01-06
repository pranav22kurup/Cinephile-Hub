import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Alert, Button, Stack, TextField } from '@mui/material'
import { useAuthorizedApi } from '../../services/api'

export default function EditMovie() {
  const { id } = useParams()
  const api = useAuthorizedApi()
  const [form, setForm] = useState({ name: '', description: '', rating: '', releaseDate: '', duration: '', director: '', posterUrl: '' })
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    (async () => {
      const res = await api.get(`/movies/${id}`)
      const m = res.data
      setForm({
        name: m.name || '',
        description: m.description || '',
        rating: m.rating?.toString() || '',
        releaseDate: m.releaseDate ? new Date(m.releaseDate).toISOString().slice(0, 10) : '',
        duration: m.duration?.toString() || '',
        director: m.director || '',
        posterUrl: m.posterUrl || ''
      })
    })()
  }, [id])

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const onSubmit = async (e) => {
    e.preventDefault()
    setMsg(null)
    const payload = { ...form, rating: Number(form.rating) || 0, duration: Number(form.duration) || 0, releaseDate: form.releaseDate ? new Date(form.releaseDate) : undefined }
    await api.put(`/movies/${id}`, payload)
    setMsg({ type: 'success', text: 'Movie updated' })
  }

  const onDelete = async () => {
    await api.delete(`/movies/${id}`)
    setMsg({ type: 'success', text: 'Movie deleted' })
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
        <Stack direction="row" spacing={2}>
          <Button type="submit" variant="contained">Save</Button>
          <Button color="error" variant="outlined" onClick={onDelete}>Delete</Button>
        </Stack>
      </Stack>
    </form>
  )
}
