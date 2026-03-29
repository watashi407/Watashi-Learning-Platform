import { createFileRoute } from '@tanstack/react-router'
import { CertificateBuilderPage } from '../modules/creation-lab/presentation/certificate-builder-page'

export const Route = createFileRoute('/_auth/creation-lab/certificate-builder')({
  component: CreationLabCertificateBuilderRoute,
})

function CreationLabCertificateBuilderRoute() {
  return <CertificateBuilderPage />
}
