import { useGigStore } from "@/store/useGigStore"
import { AlertTriangle, CheckCircle2, FileText } from "lucide-react"
import { useState } from "react"
import { motion } from "framer-motion"

export default function JobsList() {
  const jobs = useGigStore(state => state.jobs)
  const [draftingId, setDraftingId] = useState<string | null>(null)

  const handleDraftComplaint = (jobId: string) => {
    setDraftingId(jobId)
    setTimeout(() => {
      alert("Draft generated and copied to clipboard! (Mocked for demo)")
      setDraftingId(null)
    }, 1500)
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const item = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  }

  return (
    <div className="space-y-6 pt-2 pb-10">
      <div>
        <h2 className="text-3xl font-black tracking-tighter text-foreground drop-shadow-sm">Job History</h2>
        <p className="text-foreground/70 text-sm mt-1 font-medium">Review your logged jobs and flagged underpayments.</p>
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-5"
      >
        {jobs.map((job) => (
          <motion.div 
            variants={item}
            key={job.id} 
            className="glass-panel p-5 relative overflow-hidden rounded-[28px]"
          >
            {/* Edge color indicator */}
            <div className={`absolute left-0 top-0 bottom-0 w-2 ${job.underpaid ? 'bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.6)]' : 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)]'}`} />

            <div className="flex justify-between items-start pl-4">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-foreground text-lg drop-shadow-sm">{job.platform}</h3>
                  <span className="text-[10px] uppercase tracking-wider text-foreground/70 font-bold bg-white/40 dark:bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full shadow-inner border border-white/20 dark:border-white/10">
                    {new Date(job.date).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-sm text-foreground/60 mt-3 flex flex-wrap gap-x-4 gap-y-2 font-medium">
                  <span className="flex items-center gap-1">{job.distance} km</span>
                  <span className="flex items-center gap-1">{job.time} min wait</span>
                  {job.late_night && (
                    <span className="text-primary text-[11px] font-bold bg-primary/10 dark:bg-primary/20 backdrop-blur-md px-2 py-0.5 rounded-full border border-primary/20">Late-night</span>
                  )}
                  {job.oversized_luggage && (
                    <span className="text-accent text-[11px] font-bold bg-accent/10 dark:bg-accent/20 backdrop-blur-md px-2 py-0.5 rounded-full border border-accent/20">Luggage</span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="font-black text-3xl text-foreground tracking-tighter drop-shadow-sm">₹{job.fare.toFixed(2)}</div>
                <div className="text-xs text-foreground/50 font-bold mt-1">
                  ₹{(job.fare / job.distance).toFixed(2)}/km
                </div>
              </div>
            </div>

            {/* Fairness Status Area */}
            <div className="mt-5 pt-5 border-t border-white/20 dark:border-white/10 pl-4">
              {job.underpaid ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 text-sm font-black drop-shadow-sm">
                    <AlertTriangle className="w-5 h-5" /> 
                    Flagged as underpaid
                  </div>
                  <motion.button 
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleDraftComplaint(job.id)}
                    disabled={draftingId === job.id}
                    className="w-full bg-white/40 dark:bg-black/40 text-orange-600 dark:text-orange-400 border border-orange-500/30 hover:bg-orange-500/10 py-3.5 rounded-2xl text-sm font-bold flex justify-center items-center gap-2 transition-colors shadow-sm backdrop-blur-md"
                  >
                    {draftingId === job.id ? (
                      <span className="animate-pulse">Drafting with AI...</span>
                    ) : (
                      <>
                        <FileText className="w-4 h-4" /> Draft Complaint
                      </>
                    )}
                  </motion.button>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm font-black drop-shadow-sm">
                  <CheckCircle2 className="w-5 h-5" /> 
                  Fair payout verified
                </div>
              )}
            </div>

          </motion.div>
        ))}

        {jobs.length === 0 && (
          <div className="text-center text-foreground/50 py-10 font-bold">
            No jobs logged yet.
          </div>
        )}
      </motion.div>
    </div>
  )
}
