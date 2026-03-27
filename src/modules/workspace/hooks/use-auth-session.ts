import { getRouteApi } from '@tanstack/react-router'

const authRouteApi = getRouteApi('/_auth')

export function useAuthSession() {
  return authRouteApi.useLoaderData()
}
