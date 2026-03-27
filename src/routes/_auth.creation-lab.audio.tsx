import { createFileRoute, redirect } from '@tanstack/react-router'
import { ROUTE_PATHS } from '../shared/routing/paths'

export const Route = createFileRoute('/_auth/creation-lab/audio')({
  beforeLoad: () => {
    throw redirect({ to: ROUTE_PATHS.creationLabVideo })
  },
  component: () => null,
})
