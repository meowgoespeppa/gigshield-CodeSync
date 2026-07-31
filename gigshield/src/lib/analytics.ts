import type { Job, Platform } from "@/store/useGigStore"

export function estimateWorkMinutes(job: Job): number {
  const drivingMinutes = (job.distance / 20) * 60
  return job.time + drivingMinutes
}

export function getJobsInRange(jobs: Job[], start: Date, end: Date): Job[] {
  return jobs.filter((job) => {
    const d = new Date(job.date)
    return d >= start && d < end
  })
}

export function getRollingWeekBounds(weeksAgo = 0): { start: Date; end: Date } {
  const end = new Date()
  end.setHours(23, 59, 59, 999)
  end.setDate(end.getDate() - weeksAgo * 7)

  const start = new Date(end)
  start.setDate(start.getDate() - 6)
  start.setHours(0, 0, 0, 0)

  return { start, end }
}

export function summarizePeriod(jobs: Job[]) {
  const earnings = jobs.reduce((sum, job) => sum + job.fare, 0)
  const workMinutes = jobs.reduce((sum, job) => sum + estimateWorkMinutes(job), 0)
  const underpaidCount = jobs.filter((job) => job.underpaid).length
  const underpaidAmount = jobs
    .filter((job) => job.underpaid)
    .reduce((sum, job) => sum + Math.max(0, job.expected_fare - job.fare), 0)

  return {
    earnings,
    hoursWorked: workMinutes / 60,
    jobCount: jobs.length,
    underpaidCount,
    underpaidAmount,
    avgPerHour: workMinutes > 0 ? earnings / (workMinutes / 60) : 0,
  }
}

export function earningsByPlatform(jobs: Job[]): Record<Platform, number> {
  const totals = {} as Record<Platform, number>
  for (const job of jobs) {
    totals[job.platform] = (totals[job.platform] ?? 0) + job.fare
  }
  return totals
}

export function percentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

export function daysUntilGoal(current: number, goal: number, dailyAvg: number): number | null {
  if (current >= goal) return 0
  if (dailyAvg <= 0) return null
  return Math.ceil((goal - current) / dailyAvg)
}
