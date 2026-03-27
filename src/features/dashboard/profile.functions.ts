import { randomUUID } from 'node:crypto'
import { createServerFn } from '@tanstack/react-start'
import { profileUpdateSchema } from './profile.schemas'
import { runAction } from '../../server/run-action'
import { updateProfileDetails } from './profile.server'

export const updateProfile = createServerFn({ method: 'POST' })
  .inputValidator(profileUpdateSchema)
  .handler(async ({ data }) => {
    const requestId = randomUUID()
    return runAction(requestId, () => updateProfileDetails(data, requestId))
  })
