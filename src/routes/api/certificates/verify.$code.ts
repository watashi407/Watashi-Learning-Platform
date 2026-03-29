import { createFileRoute } from '@tanstack/react-router'
import { createServiceSupabaseClient } from '../../../lib/supabase/server'
import { jsonResponse } from '../../../lib/backend/responses'
import { hasSupabaseConfig } from '../../../server/env'
import { normalizeError } from '../../../shared/errors'
import type { VerifyCertificateRecord } from '../../../shared/contracts/educator'
import { normalizeVerificationCodeInput } from '../../../features/educator/educator-security'

type VerifyCertificateRow = {
  verification_code: string
  certificate_status: 'issued' | 'reissued'
  issued_at: string
  certificate_title: string
  course_title: string
  learner_name: string
}

export const Route = createFileRoute('/api/certificates/verify/$code')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        try {
          if (!hasSupabaseConfig()) {
            return jsonResponse({ error: 'Certificate verification is unavailable.' }, { status: 503 })
          }

          const normalizedCode = normalizeVerificationCodeInput(params.code)
          if (!normalizedCode) {
            return jsonResponse({ error: 'Invalid certificate code.' }, { status: 400 })
          }

          const supabase = createServiceSupabaseClient()
          const { data, error } = await supabase
            .rpc('verify_certificate_by_code', { code: normalizedCode })
            .single()

          if (error || !data) {
            return jsonResponse({ error: 'Certificate not found.' }, { status: 404 })
          }

          const row = data as VerifyCertificateRow
          const payload: VerifyCertificateRecord = {
            verificationCode: row.verification_code,
            certificateStatus: row.certificate_status,
            issuedAt: row.issued_at,
            certificateTitle: row.certificate_title,
            courseTitle: row.course_title,
            learnerName: row.learner_name,
          }

          return jsonResponse(payload)
        } catch (error) {
          const normalized = normalizeError(error, 'api-certificate-verify')
          return jsonResponse({ error: normalized.message }, { status: normalized.status })
        }
      },
    },
  },
})
