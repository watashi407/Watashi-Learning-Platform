import { z } from 'zod'

export const authPayloadSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().trim().min(1).max(120).optional(),
})

export const oauthStartSchema = z.object({
  provider: z.enum(['google', 'github']),
  next: z.string().optional(),
})

export const roleSwitchSchema = z.object({
  role: z.enum(['learner', 'educator']),
})
