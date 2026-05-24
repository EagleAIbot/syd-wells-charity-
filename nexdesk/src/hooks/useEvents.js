import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { clientDemo } from '../lib/clientDemo'
import { demoOrApi, demoScope } from '../lib/clientDemo/queries'

export function useEvents(params = {}) {
  return useQuery({
    queryKey: ['events', params, demoScope()],
    queryFn: demoOrApi(clientDemo?.data.events, () => api.getEvents(params)),
    placeholderData: [],
  })
}

export function useCreateEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => api.createEvent(data),
    onSuccess: () => qc.refetchQueries({ queryKey: ['events'] }),
  })
}

export function useDeleteEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.deleteEvent(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  })
}
