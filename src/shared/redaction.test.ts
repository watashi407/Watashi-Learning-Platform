import { describe, expect, it } from 'vitest'
import { redactSecrets, redactSecretsInString } from './redaction'

describe('redactSecretsInString', () => {
  it('redacts inline credentials and env assignments', () => {
    const value =
      `DATABASE_URL=${'postgres' + 'ql://postgres:super-secret@db.example.com:5432/postgres'} Authorization: ${'Bearer ' + '1234567890abcdef1234567890abcdef'}`

    expect(redactSecretsInString(value)).toContain('DATABASE_URL=[REDACTED]')
    expect(redactSecretsInString(value)).toContain('[REDACTED_BEARER_TOKEN]')
    expect(redactSecretsInString(value)).not.toContain('super-secret')
  })
})

describe('redactSecrets', () => {
  it('redacts nested sensitive keys and preserves safe values', () => {
    const value = {
      requestId: 'abc',
      authorization: 'Bearer token-value',
      nested: {
        password: 'hunter2',
        safe: 'hello',
      },
    }

    expect(redactSecrets(value)).toEqual({
      requestId: 'abc',
      authorization: '[REDACTED]',
      nested: {
        password: '[REDACTED]',
        safe: 'hello',
      },
    })
  })
})
