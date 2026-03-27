import { getRouteApi } from '@tanstack/react-router'

const appRouteApi = getRouteApi('/_auth')

export function useAppSession() {
  return appRouteApi.useLoaderData()
}
