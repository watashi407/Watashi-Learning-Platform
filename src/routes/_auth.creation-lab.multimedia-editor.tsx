import { createFileRoute } from '@tanstack/react-router'
import { MultimediaEditorPage } from '../modules/creation-lab/presentation/creation-lab-pages'

export const Route = createFileRoute('/_auth/creation-lab/multimedia-editor')({
  component: CreationLabMultimediaEditorRoute,
})

function CreationLabMultimediaEditorRoute() {
  return <MultimediaEditorPage />
}
