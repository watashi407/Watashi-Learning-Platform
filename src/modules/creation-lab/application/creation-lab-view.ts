import { CREATION_LAB_ROUTE_DEFINITIONS, ROUTE_PATHS, type CreationLabRouteKey } from '../../../shared/routing/paths'

export function getCreationLabRouteKey(pathname: string): CreationLabRouteKey {
  if (pathname.startsWith(ROUTE_PATHS.creationLabMultimediaEditor)) {
    return 'multimediaEditor'
  }

  if (pathname.startsWith(ROUTE_PATHS.creationLabCourseBuilder)) {
    return 'courseBuilder'
  }

  if (pathname.startsWith(ROUTE_PATHS.creationLabAudio)) {
    return 'video'
  }

  if (pathname.startsWith(ROUTE_PATHS.creationLabCertificateBuilder)) {
    return 'certificateBuilder'
  }

  if (pathname.startsWith(ROUTE_PATHS.creationLabVideo)) {
    return 'video'
  }

  return 'hub'
}

export function getCreationLabNavItems() {
  return [
    CREATION_LAB_ROUTE_DEFINITIONS.hub,
    CREATION_LAB_ROUTE_DEFINITIONS.video,
    CREATION_LAB_ROUTE_DEFINITIONS.certificateBuilder,
    CREATION_LAB_ROUTE_DEFINITIONS.courseBuilder,
  ]
}
