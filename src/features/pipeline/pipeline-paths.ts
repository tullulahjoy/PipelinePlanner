/** Live editing stays over Live Pipeline; alternatives stay over the saved list. */
export function editPlanPath(base: string, id?: string, liveId?: string) {
  return `${base}/${id && id !== liveId ? `saved-pipelines/${id}` : 'pipeline'}?edit=1`
}

export function editingPlanId(location: { pathname: string; search: string }, base: string, liveId?: string): string | null | undefined {
  if (new URLSearchParams(location.search).get('edit') !== '1') return undefined
  if (location.pathname === `${base}/pipeline`) return liveId ?? null
  for (const section of ['pipeline', 'saved-pipelines']) {
    const prefix = `${base}/${section}/`
    if (location.pathname.startsWith(prefix)) return location.pathname.slice(prefix.length)
  }
  return undefined
}
