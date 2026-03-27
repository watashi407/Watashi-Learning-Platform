export function getClientIp(request: Request) {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || null
  }

  const realIp = request.headers.get('x-real-ip')
  return realIp?.trim() || null
}
