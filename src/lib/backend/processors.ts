import { z } from 'zod'
import type {
  CommunityModerationRequest,
  CommunityModerationResult,
  CourseOutlineRequest,
  CourseOutlineResult,
  NotificationTestRequest,
  NotificationTestResult,
  StudyPathRequest,
  StudyPathResult,
} from '../../shared/contracts/jobs'
import { AppError } from '../../shared/errors'
import { hasGeminiConfig, getRequiredServerValue } from '../../server/env'

const geminiEnvelopeSchema = z.object({
  candidates: z.array(
    z.object({
      content: z.object({
        parts: z.array(
          z.object({
            text: z.string().optional(),
          }),
        ).optional(),
      }).optional(),
    }),
  ).optional(),
})

async function callGemini<T>(prompt: string, fallback: T, systemPrompt: string, responseSchema: z.ZodType<T>) {
  if (!hasGeminiConfig()) {
    return fallback
  }

  let lastError: unknown = null

  for (const delay of [0, 400, 1200]) {
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay))
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10_000)

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${getRequiredServerValue('GEMINI_API_KEY')}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] },
          }),
          signal: controller.signal,
        },
      )

      if (!response.ok) {
        throw new AppError('UPSTREAM_FAILURE', 'The AI service could not finish your request right now. Please try again.', {
          details: { status: response.status },
        })
      }

      const envelope = geminiEnvelopeSchema.parse(await response.json())
      const text = envelope.candidates?.[0]?.content?.parts?.[0]?.text
      if (!text) {
        return fallback
      }

      return responseSchema.parse(JSON.parse(text))
    } catch (error) {
      lastError = error
    } finally {
      clearTimeout(timeout)
    }
  }

  throw new AppError('UPSTREAM_FAILURE', 'The AI service is still unavailable. Please try again shortly.', {
    cause: lastError,
  })
}

export async function generateStudyPathResult(input: StudyPathRequest): Promise<StudyPathResult> {
  return callGemini<StudyPathResult>(
    `Based on this learner profile ${JSON.stringify(input)}, return JSON with {"pivot":"...","tip":"..."}. Keep it concise and practical.`,
    {
      pivot: `Move ${input.learnerName} toward advanced React patterns after consolidating the current styling and design foundation.`,
      tip: 'Protect one uninterrupted 25-minute block and finish one module milestone before switching context.',
    },
    'You are an AI learning coach for Watashi. Return valid JSON only.',
    z.object({
      pivot: z.string().min(1),
      tip: z.string().min(1),
    }),
  )
}

export async function generateCourseOutlineResult(input: CourseOutlineRequest): Promise<CourseOutlineResult> {
  return callGemini<CourseOutlineResult>(
    `Generate a course outline for ${input.topic}. Return strict JSON with {"title":"...","desc":"...","modules":[{"name":"...","detail":"..."}]}.`,
    {
      title: `${input.topic} Intensive`,
      desc: `A practical course outline for ${input.topic} focused on real-world application and publish-ready structure.`,
      modules: [
        { name: 'Foundations', detail: 'Establish the core concepts, vocabulary, and expected outcomes.' },
        { name: 'Core Workflow', detail: 'Teach the default day-to-day workflow and major technical decisions.' },
        { name: 'Applied Practice', detail: 'Turn the concepts into a guided exercise or implementation project.' },
        { name: 'Advanced Path', detail: 'Close with scaling, optimization, and next-step specializations.' },
      ],
    },
    'You are a curriculum architect. Return valid JSON only.',
    z.object({
      title: z.string().min(1),
      desc: z.string().min(1),
      modules: z.array(
        z.object({
          name: z.string().min(1),
          detail: z.string().min(1),
        }),
      ).min(1),
    }),
  )
}

export async function moderateCommunityContent(input: CommunityModerationRequest): Promise<CommunityModerationResult> {
  const lowered = input.content.toLowerCase()
  const flaggedTerms = ['hate', 'violence', 'scam', 'abuse']
  const reasons = flaggedTerms.filter((term) => lowered.includes(term))

  if (reasons.length > 0) {
    return {
      verdict: 'flagged',
      summary: 'The content should be reviewed before publication.',
      reasons,
    }
  }

  return {
    verdict: 'approved',
    summary: 'The content looks safe to publish.',
    reasons: [],
  }
}

export async function sendNotificationTest(input: NotificationTestRequest): Promise<NotificationTestResult> {
  return {
    accepted: true,
    channel: 'test',
    recipient: input.recipient,
    message: input.message,
  }
}
