import {
  BookOpen,
  Clapperboard,
  CirclePlay,
  FlaskConical,
  LayoutDashboard,
  type LucideIcon,
  UserRound,
  Users,
  Workflow,
} from 'lucide-react'
import type { AuthSession } from '../contracts/auth'

export const ROUTE_PATHS = {
  home: '/',
  login: '/login',
  register: '/register',
  dashboard: '/dashboard',
  courses: '/courses',
  creationLab: '/creation-lab',
  creationLabHub: '/creation-lab/hub',
  creationLabVideo: '/creation-lab/video',
  creationLabAudio: '/creation-lab/audio',
  creationLabCourseBuilder: '/creation-lab/course-builder',
  creationLabCertificateBuilder: '/creation-lab/certificate-builder',
  creationLabMultimediaEditor: '/creation-lab/multimedia-editor',
  legacyCreationLabs: '/creation-labs',
  community: '/community',
  focus: '/focus',
  profile: '/profile',
} as const

export type AppRouteKey =
  | 'dashboard'
  | 'courses'
  | 'creationLab'
  | 'community'
  | 'focus'
  | 'profile'

export type AppUserRole = AuthSession['role']

export type AppRouteDefinition = {
  key: AppRouteKey
  path: string
  label: string
  icon: LucideIcon
  allowedRoles: AppUserRole[]
}

export const APP_ROUTE_DEFINITIONS: Record<AppRouteKey, AppRouteDefinition> = {
  dashboard: {
    key: 'dashboard',
    path: ROUTE_PATHS.dashboard,
    label: 'Dashboard',
    icon: LayoutDashboard,
    allowedRoles: ['learner', 'educator', 'admin'],
  },
  courses: {
    key: 'courses',
    path: ROUTE_PATHS.courses,
    label: 'Courses',
    icon: BookOpen,
    allowedRoles: ['learner', 'educator', 'admin'],
  },
  creationLab: {
    key: 'creationLab',
    path: ROUTE_PATHS.creationLab,
    label: 'Creation Lab',
    icon: FlaskConical,
    allowedRoles: ['educator'],
  },
  community: {
    key: 'community',
    path: ROUTE_PATHS.community,
    label: 'Community',
    icon: Users,
    allowedRoles: ['learner', 'educator', 'admin'],
  },
  focus: {
    key: 'focus',
    path: ROUTE_PATHS.focus,
    label: 'Focus',
    icon: CirclePlay,
    allowedRoles: ['learner'],
  },
  profile: {
    key: 'profile',
    path: ROUTE_PATHS.profile,
    label: 'Profile',
    icon: UserRound,
    allowedRoles: ['learner', 'educator', 'admin'],
  },
}

export function canAccessAppRoute(role: AppUserRole, routeKey: AppRouteKey) {
  return APP_ROUTE_DEFINITIONS[routeKey].allowedRoles.includes(role)
}

export function getVisibleAppRoutes(role: AppUserRole) {
  return Object.values(APP_ROUTE_DEFINITIONS).filter((route) => canAccessAppRoute(role, route.key))
}

export function getDefaultAppPath(_role: AppUserRole) {
  return ROUTE_PATHS.dashboard
}

export function getPrimaryAppPath(role: AppUserRole) {
  if (role === 'educator') {
    return ROUTE_PATHS.creationLab
  }

  if (role === 'learner') {
    return ROUTE_PATHS.focus
  }

  return ROUTE_PATHS.community
}

export function isCreationLabPath(pathname: string) {
  return (
    pathname === ROUTE_PATHS.creationLab
    || pathname.startsWith(`${ROUTE_PATHS.creationLab}/`)
    || pathname === ROUTE_PATHS.legacyCreationLabs
    || pathname.startsWith(`${ROUTE_PATHS.legacyCreationLabs}/`)
  )
}

export function normalizeWorkspacePath(pathname: string) {
  if (pathname === ROUTE_PATHS.legacyCreationLabs) {
    return ROUTE_PATHS.creationLab
  }

  if (pathname.startsWith(`${ROUTE_PATHS.legacyCreationLabs}/`)) {
    return pathname.replace(ROUTE_PATHS.legacyCreationLabs, ROUTE_PATHS.creationLab)
  }

  return pathname
}

export function canAccessPathForRole(role: AppUserRole, pathname: string) {
  const normalizedPath = normalizeWorkspacePath(pathname)

  if (isCreationLabPath(normalizedPath)) {
    return role === 'educator'
  }

  const matchedRoute = Object.values(APP_ROUTE_DEFINITIONS).find((route) => route.path === normalizedPath)

  if (!matchedRoute) {
    return false
  }

  return canAccessAppRoute(role, matchedRoute.key)
}

export function resolveRoleSwitchPath(role: AppUserRole, currentPathname: string) {
  const normalizedPath = normalizeWorkspacePath(currentPathname)

  if (canAccessPathForRole(role, normalizedPath)) {
    return normalizedPath
  }

  return getPrimaryAppPath(role)
}

export type CreationLabRouteKey =
  | 'hub'
  | 'video'
  | 'courseBuilder'
  | 'certificateBuilder'
  | 'multimediaEditor'

export type CreationLabRouteDefinition = {
  key: CreationLabRouteKey
  path: string
  label: string
  icon: LucideIcon
}

export const CREATION_LAB_ROUTE_DEFINITIONS: Record<CreationLabRouteKey, CreationLabRouteDefinition> = {
  hub: {
    key: 'hub',
    path: ROUTE_PATHS.creationLab,
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  video: {
    key: 'video',
    path: ROUTE_PATHS.creationLabVideo,
    label: 'Video Creation',
    icon: Clapperboard,
  },
  certificateBuilder: {
    key: 'certificateBuilder',
    path: ROUTE_PATHS.creationLabCertificateBuilder,
    label: 'Certificate Builder',
    icon: Workflow,
  },
  courseBuilder: {
    key: 'courseBuilder',
    path: ROUTE_PATHS.creationLabCourseBuilder,
    label: 'Course Builder',
    icon: BookOpen,
  },
  multimediaEditor: {
    key: 'multimediaEditor',
    path: ROUTE_PATHS.creationLabMultimediaEditor,
    label: 'Multimedia Editor',
    icon: FlaskConical,
  },
}
