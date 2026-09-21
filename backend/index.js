// Backend entry point (Express).
// Runs both locally (node index.js) and on Vercel (vercel.json routes to it).

import express from 'express'
import cors from 'cors'

import { pushRouter } from './src/routes/push.js'
import { cloudinaryRouter } from './src/routes/cloudinary.js'
import { birthdayRouter } from './src/routes/birthday.js'
import { requireAdmin } from './src/auth.js'

const app = express()

app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'shivsaydri-mandal-backend', at: new Date().toISOString() })
})

app.use('/api/push/send', requireAdmin, pushRouter)
app.use('/api/cloudinary/delete', requireAdmin, cloudinaryRouter)
app.use('/api/birthday-worker', birthdayRouter)

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// Local development server.
const port = process.env.PORT || 3001
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`shivsaydri-mandal-backend listening on http://localhost:${port}`)
  })
}

export default app