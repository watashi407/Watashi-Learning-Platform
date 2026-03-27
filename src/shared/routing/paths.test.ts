import { describe, expect, it } from 'vitest'
import { ROUTE_PATHS, resolveRoleSwitchPath } from './paths'

describe('resolveRoleSwitchPath', () => {
  it('keeps the current route when the target role can still access it', () => {
    expect(resolveRoleSwitchPath('educator', ROUTE_PATHS.courses)).toBe(ROUTE_PATHS.courses)
    expect(resolveRoleSwitchPath('learner', ROUTE_PATHS.community)).toBe(ROUTE_PATHS.community)
  })

  it('moves learners and educators to their primary workspace when the current route becomes unauthorized', () => {
    expect(resolveRoleSwitchPath('educator', ROUTE_PATHS.focus)).toBe(ROUTE_PATHS.creationLab)
    expect(resolveRoleSwitchPath('learner', ROUTE_PATHS.creationLabVideo)).toBe(ROUTE_PATHS.focus)
  })

  it('normalizes legacy creation lab URLs during role transitions', () => {
    expect(resolveRoleSwitchPath('educator', ROUTE_PATHS.legacyCreationLabs)).toBe(ROUTE_PATHS.creationLab)
  })
})
