import axios from "axios"
import type { Job } from "@/store/useGigStore"

const API_BASE = "http://localhost:8000"

export type CommunityBenchmark = {
  sample_size: number
  worker_count: number
  median_fare_per_km: number
  median_waiting_rate: number
  median_minimum_fare: number
  reports_this_week: number
  description: string
}

export type WeeklyInsight = {
  summary: string
  highlights: string[]
}

export type SafetyScore = {
  score: number
  label: string
  description: string
  factors: string[]
}

export type SavingsSuggestion = {
  summary: string
  suggestions: string[]
  projected_days_to_goal: number | null
  recommended_weekly_target: number
}

export async function fetchCommunityBenchmark(): Promise<CommunityBenchmark> {
  const { data } = await axios.get(`${API_BASE}/api/community-benchmark`)
  return data
}

export async function checkFairness(job: Omit<Job, "id" | "date" | "underpaid" | "expected_fare">) {
  const { data } = await axios.post(`${API_BASE}/api/fairness`, job)
  return data as {
    underpaid: boolean
    expected_fare: number
    difference: number
    community_adjusted: boolean
  }
}

export async function fetchWeeklyInsights(jobs: Job[]): Promise<WeeklyInsight> {
  const { data } = await axios.post(`${API_BASE}/api/insights/weekly`, { jobs })
  return data
}

export async function fetchSafetyScore(area: string, hour?: number): Promise<SafetyScore> {
  const { data } = await axios.post(`${API_BASE}/api/safety-score`, { area, hour })
  return data
}

export async function fetchSavingsSuggestions(
  jobs: Job[],
  savingsGoal: number,
  currentSavings: number,
): Promise<SavingsSuggestion> {
  const { data } = await axios.post(`${API_BASE}/api/savings/suggestions`, {
    jobs,
    savings_goal: savingsGoal,
    current_savings: currentSavings,
  })
  return data
}
