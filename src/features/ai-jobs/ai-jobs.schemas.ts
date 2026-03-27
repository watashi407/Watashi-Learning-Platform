import { z } from 'zod'

export const studyPathRequestSchema = z.object({
  learnerName: z.string().trim().min(1),
  currentCourses: z.array(
    z.object({
      title: z.string().trim().min(1),
      progress: z.number().min(0).max(100),
    }),
  ).min(1),
})

export const courseOutlineRequestSchema = z.object({
  topic: z.string().trim().min(2),
})
