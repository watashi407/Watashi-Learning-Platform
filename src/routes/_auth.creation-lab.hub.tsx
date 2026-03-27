import { createFileRoute } from '@tanstack/react-router'
import { CreationLabHubPage } from '../modules/creation-lab/presentation/creation-lab-pages'

export const Route = createFileRoute('/_auth/creation-lab/hub')({
  component: CreationLabHubRoute,
})

function CreationLabHubRoute() {
  return <CreationLabHubPage />
}
