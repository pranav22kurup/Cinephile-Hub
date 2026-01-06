import React, { useState } from 'react'
import { Alert, Button, Stack, TextField } from '@mui/material'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [msg, setMsg] = useState(null)

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const onSubmit = async (e) => {
    e.preventDefault()
    setMsg(null)
    try {
      const res = await api.post('/auth/login', form)
      login(res.data.token, res.data.user)
      setMsg({ type: 'success', text: 'Logged in' })
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Login failed' })
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <Stack spacing={2}>
        {msg && <Alert severity={msg.type}>{msg.text}</Alert>}
        <TextField label="Email" name="email" value={form.email} onChange={onChange} required />
        <TextField label="Password" name="password" type="password" value={form.password} onChange={onChange} required />
        <Button type="submit" variant="contained">Login</Button>
      </Stack>
    </form>
  )
}
