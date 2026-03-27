import { createFileRoute } from '@tanstack/react-router'
import { VideoCreationPage } from '../modules/video-creation/pages/VideoCreationPage'

export const Route = createFileRoute('/_auth/creation-lab/video')({
  component: CreationLabVideoRoute,
})

function CreationLabVideoRoute() {
  return <VideoCreationPage />
}
