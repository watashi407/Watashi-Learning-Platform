import { describe, expect, it } from 'vitest'
import { isDatabaseUniqueViolation, normalizeVerificationCodeInput } from './educator-security'

describe('educator-security', () => {
  it('normalizes public verification codes defensively', () => {
    expect(normalizeVerificationCodeInput('  abcd1234efgh5678  ')).toBe('ABCD1234EFGH5678')
    expect(normalizeVerificationCodeInput('bad-code')).toBeNull()
    expect(normalizeVerificationCodeInput('short')).toBeNull()
  })

  it('detects unique-violation database errors', () => {
    expect(isDatabaseUniqueViolation({
      code: '23505',
      details: 'Key (certificate_template_id, learner_id, course_id) already exists.',
    })).toBe(true)

    expect(isDatabaseUniqueViolation({
      code: '23505',
      details: 'Key (certificate_template_id, learner_id, course_id) already exists.',
    }, 'certificate_template_id')).toBe(true)

    expect(isDatabaseUniqueViolation({
      code: '22001',
      details: 'value too long',
    })).toBe(false)
  })
})
