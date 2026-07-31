import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { checkFairness, fetchCommunityBenchmark, type CommunityBenchmark, type WeeklyInsight, type SavingsSuggestion, fetchWeeklyInsights, fetchSavingsSuggestions } from '@/lib/api'

export type Platform = 'Ola' | 'Uber' | 'Rapido' | 'Namma Yatri' | 'Other'

export type Job = {
  id: string
  platform: Platform
  fare: number
  distance: number
  time: number
  late_night: boolean
  oversized_luggage: boolean
  date: string
  underpaid: boolean
  expected_fare: number
  notes?: string
}

function daysAgo(days: number, hour = 12): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}

const SEED_JOBS: Job[] = [
  { id: '1', platform: 'Uber', fare: 185, distance: 9, time: 8, late_night: false, oversized_luggage: false, date: daysAgo(1, 14), underpaid: false, expected_fare: 175 },
  { id: '2', platform: 'Ola', fare: 52, distance: 3.5, time: 12, late_night: true, oversized_luggage: false, date: daysAgo(1, 23), underpaid: true, expected_fare: 88 },
  { id: '3', platform: 'Rapido', fare: 120, distance: 6, time: 5, late_night: false, oversized_luggage: false, date: daysAgo(2, 10), underpaid: false, expected_fare: 115 },
  { id: '4', platform: 'Namma Yatri', fare: 95, distance: 5, time: 15, late_night: false, oversized_luggage: true, date: daysAgo(3, 16), underpaid: false, expected_fare: 105 },
  { id: '5', platform: 'Ola', fare: 38, distance: 2, time: 8, late_night: true, oversized_luggage: false, date: daysAgo(4, 0), underpaid: true, expected_fare: 72 },
  { id: '6', platform: 'Uber', fare: 210, distance: 11, time: 6, late_night: false, oversized_luggage: false, date: daysAgo(5, 11), underpaid: false, expected_fare: 200 },
  { id: '7', platform: 'Rapido', fare: 65, distance: 4, time: 10, late_night: false, oversized_luggage: false, date: daysAgo(6, 18), underpaid: true, expected_fare: 82 },
  { id: '8', platform: 'Ola', fare: 155, distance: 7.5, time: 4, late_night: false, oversized_luggage: false, date: daysAgo(8, 13), underpaid: false, expected_fare: 145 },
  { id: '9', platform: 'Uber', fare: 48, distance: 2.5, time: 14, late_night: true, oversized_luggage: true, date: daysAgo(9, 22), underpaid: true, expected_fare: 95 },
  { id: '10', platform: 'Namma Yatri', fare: 130, distance: 6.5, time: 7, late_night: false, oversized_luggage: false, date: daysAgo(10, 9), underpaid: false, expected_fare: 125 },
]

interface GigState {
  jobs: Job[]
  savingsGoal: number
  communityBenchmark: CommunityBenchmark | null
  weeklyInsights: WeeklyInsight | null
  savingsSuggestion: SavingsSuggestion | null
  addJob: (job: Omit<Job, 'id' | 'date' | 'underpaid' | 'expected_fare'>) => Promise<void>
  setSavingsGoal: (goal: number) => void
  loadCommunityBenchmark: () => Promise<void>
  loadWeeklyInsights: () => Promise<void>
  loadSavingsSuggestions: (currentSavings: number) => Promise<void>
  triggerAlert: (location: string) => Promise<void>
}

export const useGigStore = create<GigState>()(
  persist(
    (set, get) => ({
      jobs: SEED_JOBS,
      savingsGoal: 3000,
      communityBenchmark: null,
      weeklyInsights: null,
      savingsSuggestion: null,

      addJob: async (jobData) => {
        try {
          const response = await checkFairness(jobData)
          const newJob: Job = {
            ...jobData,
            id: Math.random().toString(36).substring(7),
            date: new Date().toISOString(),
            underpaid: response.underpaid,
            expected_fare: response.expected_fare,
          }
          set((state) => ({ jobs: [newJob, ...state.jobs] }))
        } catch (error) {
          console.error('Failed to check fairness with Python API', error)
          const newJob: Job = {
            ...jobData,
            id: Math.random().toString(36).substring(7),
            date: new Date().toISOString(),
            underpaid: false,
            expected_fare: jobData.fare,
          }
          set((state) => ({ jobs: [newJob, ...state.jobs] }))
        }
      },

      setSavingsGoal: (goal) => set({ savingsGoal: goal }),

      loadCommunityBenchmark: async () => {
        try {
          const data = await fetchCommunityBenchmark()
          set({ communityBenchmark: data })
        } catch (error) {
          console.error('Failed to load community benchmark', error)
        }
      },

      loadWeeklyInsights: async () => {
        try {
          const data = await fetchWeeklyInsights(get().jobs)
          set({ weeklyInsights: data })
        } catch (error) {
          console.error('Failed to load weekly insights', error)
        }
      },

      loadSavingsSuggestions: async (currentSavings) => {
        try {
          const data = await fetchSavingsSuggestions(get().jobs, get().savingsGoal, currentSavings)
          set({ savingsSuggestion: data })
        } catch (error) {
          console.error('Failed to load savings suggestions', error)
        }
      },

      triggerAlert: async (location) => {
        try {
          const axios = (await import('axios')).default
          await axios.post('http://localhost:8000/api/alert', {
            message: 'SOS! I feel unsafe.',
            location,
          })
        } catch (error) {
          console.error('Failed to trigger alert', error)
        }
      },
    }),
    { name: 'gig-storage' },
  ),
)
