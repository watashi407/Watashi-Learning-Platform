import { createFileRoute } from '@tanstack/react-router'
import { LandingPage } from '../features/public/landing-page'

export const Route = createFileRoute('/')({
  component: HomeRoute,
})

function HomeRoute() {
  return <LandingPage />
}
