import { z } from 'zod'

export const profileUpdateSchema = z.object({
  fullName: z.string().trim().min(2, 'Please enter your full name.').max(120, 'Name is too long.'),
})

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>
