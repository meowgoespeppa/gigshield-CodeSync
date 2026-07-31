import { useGigStore } from "@/store/useGigStore"
import { DollarSign, Clock, AlertTriangle, TrendingUp, ShieldCheck, Users, Sparkles, PieChart, Info } from "lucide-react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { fetchSafetyScore, type SafetyScore } from "@/lib/api"

export default function Dashboard() {
  const navigate = useNavigate()
  const { 
    jobs, savingsGoal, 
    communityBenchmark, weeklyInsights, savingsSuggestion,
    loadCommunityBenchmark, loadWeeklyInsights, loadSavingsSuggestions
  } = useGigStore()

  const [route, setRoute] = useState("")
  const [safetyScore, setSafetyScore] = useState<SafetyScore | null>(null)
  const [isScanningSafety, setIsScanningSafety] = useState(false)
  
  useEffect(() => {
    loadCommunityBenchmark()
    loadWeeklyInsights()
    
    // Calculate current savings from all jobs
    const currentSavings = jobs.reduce((sum, job) => sum + job.fare, 0)
    loadSavingsSuggestions(currentSavings)
  }, [jobs, loadCommunityBenchmark, loadWeeklyInsights, loadSavingsSuggestions])

  const checkSafety = async () => {
    if (!route) return
    setIsScanningSafety(true)
    try {
      const result = await fetchSafetyScore(route)
      setSafetyScore(result)
    } catch (e) {
      console.error(e)
    } finally {
      setIsScanningSafety(false)
    }
  }

  // Weekly Stats Calculation
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const weeklyJobs = jobs.filter(j => new Date(j.date) >= weekAgo)
  
  const totalEarnings = jobs.reduce((sum, job) => sum + job.fare, 0)
  const weeklyEarnings = weeklyJobs.reduce((sum, job) => sum + job.fare, 0)
  const weeklyTime = weeklyJobs.reduce((sum, job) => sum + job.time, 0) / 60 
  const underpaidCount = weeklyJobs.filter(j => j.underpaid).length

  // Platform Breakdown (Weekly)
  const platformEarnings = weeklyJobs.reduce((acc, job) => {
    acc[job.platform] = (acc[job.platform] || 0) + job.fare
    return acc
  }, {} as Record<string, number>)

  const progress = Math.min((totalEarnings / savingsGoal) * 100, 100)
  
  // Fatigue Alert: More than 8 hours today
  const todayJobs = jobs.filter(j => new Date(j.date).toDateString() === new Date().toDateString())
  const todayTime = todayJobs.reduce((sum, job) => sum + job.time, 0) / 60
  const isFatigued = todayTime >= 8

  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  }

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
      className="space-y-6 pt-2 pb-10"
    >
      {/* 5. Fatigue / Burnout Detector */}
      {isFatigued && (
        <motion.div variants={cardVariants} className="glass-panel glossy-sheen !bg-red-500/20 dark:!bg-red-500/10 !border-red-400/30 text-red-700 dark:text-red-300 p-6 rounded-3xl flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-lg">Fatigue Alert</h3>
            <p className="text-sm opacity-90 mt-1 leading-relaxed">You've logged over {todayTime.toFixed(1)} hours today. AI Safety Check strongly suggests taking a 30-minute break for your wellbeing and safety on the road.</p>
            <button 
              onClick={() => navigate('/chat', { state: { prefill: "I've been driving for over 8 hours today and I'm feeling exhausted. What are my rights regarding breaks, and how can I manage this burnout safely?" } })}
              className="mt-4 bg-red-600 text-white shadow-md hover:bg-red-700 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" /> Chat with AI about burnout
            </button>
          </div>
        </motion.div>
      )}

      {/* 3. AI-Generated Weekly Insight Summary */}
      {weeklyInsights && (
        <motion.div variants={cardVariants} className="glass-panel glossy-sheen p-6 rounded-3xl">
          <div className="flex items-start gap-4">
            <div className="bg-primary/10 dark:bg-primary/20 backdrop-blur-md p-3 rounded-2xl border border-primary/20 shrink-0">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-lg">AI Weekly Insight</h3>
              <p className="text-sm text-foreground/90 mt-2 font-medium leading-relaxed">
                "{weeklyInsights.summary}"
              </p>
              <ul className="mt-4 space-y-1.5">
                {weeklyInsights.highlights.map((h, i) => (
                  <li key={i} className="text-[13px] text-foreground/70 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary/60 rounded-full shrink-0" /> 
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      )}

      {/* 1. Dashboard summarizing weekly earnings */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div variants={cardVariants} className="glass-panel glossy-sheen p-6 rounded-3xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-accent/10 p-2 rounded-xl border border-accent/20 text-accent">
              <DollarSign className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-foreground/70 text-sm">Earnings</h3>
          </div>
          <div className="text-3xl font-black text-foreground tracking-tighter drop-shadow-sm">₹{weeklyEarnings.toFixed(0)}</div>
          <div className="text-xs text-foreground/50 mt-1 font-medium">Total: ₹{totalEarnings.toFixed(0)}</div>
        </motion.div>
        
        <motion.div variants={cardVariants} className="glass-panel glossy-sheen p-6 rounded-3xl">
          <div className="flex items-center gap-2 mb-4 text-foreground/70 text-sm font-bold">
            <div className="bg-blue-500/10 p-2 rounded-xl border border-blue-500/20 text-blue-500">
              <Clock className="w-5 h-5" />
            </div>
            Hours
          </div>
          <div className="text-3xl font-black text-foreground tracking-tighter drop-shadow-sm">{weeklyTime.toFixed(1)}h</div>
        </motion.div>
      </div>

      {/* 2. Multi-platform earnings aggregator */}
      <motion.div variants={cardVariants} className="glass-panel glossy-sheen p-6 rounded-3xl">
        <h3 className="font-bold text-lg flex items-center gap-2 text-foreground mb-5 drop-shadow-sm">
          <PieChart className="w-5 h-5 text-accent" /> Platform Breakdown
        </h3>
        {Object.keys(platformEarnings).length > 0 ? (
          <div className="space-y-4">
            {Object.entries(platformEarnings)
              .sort(([, a], [, b]) => b - a)
              .map(([platform, amount]) => (
                <div key={platform}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-foreground/80 font-bold">{platform}</span>
                    <span className="text-foreground font-black drop-shadow-sm">₹{amount.toFixed(0)}</span>
                  </div>
                  <div className="h-2 w-full bg-black/10 dark:bg-white/10 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-accent rounded-full" 
                      style={{ width: `${(amount / weeklyEarnings) * 100}%` }}
                    />
                  </div>
                </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-foreground/60">No jobs logged this week yet.</p>
        )}
      </motion.div>

      {/* 6. Savings goal tracker (AI adjusted) */}
      <motion.div variants={cardVariants} className="glass-panel glossy-sheen p-6 rounded-3xl">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h3 className="font-bold text-lg flex items-center gap-2 text-foreground drop-shadow-sm">
              <TrendingUp className="w-5 h-5 text-green-500" /> Goal Progress
            </h3>
            <p className="text-sm text-foreground/60 mt-1 font-medium">Target: ₹{savingsGoal}</p>
          </div>
          <div className="text-3xl font-black text-foreground drop-shadow-sm">{Math.round(progress)}%</div>
        </div>
        <div className="h-4 w-full bg-black/10 dark:bg-white/10 rounded-full overflow-hidden shadow-inner">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-green-400 to-emerald-600 rounded-full relative overflow-hidden shadow-sm"
          />
        </div>
        
        {savingsSuggestion && (
          <div className="mt-6 bg-white/30 dark:bg-black/30 backdrop-blur-md rounded-2xl p-5 border border-white/20 dark:border-white/10 shadow-inner">
            <p className="text-[15px] text-foreground font-black mb-3 drop-shadow-sm">{savingsSuggestion.summary}</p>
            <ul className="space-y-2.5">
              {savingsSuggestion.suggestions.map((s, i) => (
                <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                  <Info className="w-4 h-4 text-primary shrink-0 mt-0.5 drop-shadow-sm" />
                  <span className="leading-relaxed font-medium">{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </motion.div>

      {/* 7. Community fairness benchmark */}
      {communityBenchmark && (
        <motion.div variants={cardVariants} className="glass-panel glossy-sheen p-6 rounded-3xl">
          <h3 className="font-bold text-lg flex items-center gap-2 text-foreground mb-2 drop-shadow-sm">
            <Users className="w-5 h-5 text-accent" /> Community Benchmark
          </h3>
          <p className="text-sm text-foreground/70 mb-5 font-medium">{communityBenchmark.description}</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/30 dark:bg-black/30 backdrop-blur-md border border-white/20 dark:border-white/10 p-4 rounded-2xl shadow-sm">
              <div className="text-[11px] text-foreground/60 mb-1 font-bold uppercase tracking-wider">Median Fare / km</div>
              <div className="text-2xl font-black text-foreground drop-shadow-sm">₹{communityBenchmark.median_fare_per_km}</div>
            </div>
            <div className="bg-white/30 dark:bg-black/30 backdrop-blur-md border border-white/20 dark:border-white/10 p-4 rounded-2xl shadow-sm">
              <div className="text-[11px] text-foreground/60 mb-1 font-bold uppercase tracking-wider">Median Wait / min</div>
              <div className="text-2xl font-black text-foreground drop-shadow-sm">₹{communityBenchmark.median_waiting_rate}</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Underpayment Alert (Weekly) */}
      {underpaidCount > 0 && (
        <motion.div variants={cardVariants} className="glass-panel glossy-sheen !bg-orange-500/10 !border-orange-500/20 p-6 rounded-3xl">
          <div className="flex items-start gap-4">
            <div className="bg-orange-500/20 backdrop-blur-md p-3 rounded-2xl border border-orange-500/30">
              <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h3 className="font-bold text-orange-600 dark:text-orange-400 text-lg">Fairness Alert</h3>
              <p className="text-sm text-foreground/80 mt-1.5 leading-relaxed font-medium">
                <span className="font-black drop-shadow-sm">{underpaidCount} jobs</span> flagged as potentially underpaid this week based on community benchmarks. 
              </p>
            </div>
          </div>
        </motion.div>
      )}
      
      {/* 4. AI-Generated Route Safety Checker */}
      <motion.div variants={cardVariants} className="glass-panel glossy-sheen p-6 rounded-3xl space-y-5">
        <h3 className="font-bold text-lg flex items-center gap-2 text-foreground drop-shadow-sm">
          <ShieldCheck className="w-5 h-5 text-primary" /> AI Route Safety
        </h3>
        <div className="flex gap-3">
          <input 
            type="text" 
            placeholder="e.g. Indiranagar, 11 PM" 
            value={route}
            onChange={(e) => setRoute(e.target.value)}
            className="flex-1 glass-input rounded-2xl px-5 text-sm text-foreground placeholder:text-foreground/40"
          />
          <button 
            onClick={checkSafety}
            disabled={isScanningSafety}
            className="bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:opacity-90 disabled:opacity-50 px-6 py-3 rounded-2xl text-sm font-black transition-all flex shrink-0 justify-center items-center"
          >
            {isScanningSafety ? 'Scan...' : 'Scan'}
          </button>
        </div>
        {safetyScore && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/30 dark:bg-black/30 backdrop-blur-md border border-white/20 dark:border-white/10 p-5 rounded-2xl space-y-4 shadow-sm"
          >
            <div className="flex gap-4 items-center">
              <div className={`text-2xl font-black p-4 rounded-2xl shadow-inner ${safetyScore.score >= 7 ? 'bg-green-500/20 text-green-700 dark:text-green-400 border border-green-500/20' : safetyScore.score >= 5 ? 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border border-yellow-500/20' : 'bg-red-500/20 text-red-700 dark:text-red-400 border border-red-500/20'}`}>
                {safetyScore.score}
              </div>
              <div>
                <div className={`font-black text-lg drop-shadow-sm ${safetyScore.score >= 7 ? 'text-green-700 dark:text-green-400' : safetyScore.score >= 5 ? 'text-yellow-700 dark:text-yellow-400' : 'text-red-700 dark:text-red-400'}`}>{safetyScore.label}</div>
                <p className="text-[13px] text-foreground/80 font-medium leading-relaxed mt-1">{safetyScore.description}</p>
              </div>
            </div>
            {safetyScore.factors && safetyScore.factors.length > 0 && (
              <div className="pt-3 border-t border-white/20 dark:border-white/10 mt-4">
                <div className="text-[10px] text-foreground/60 font-black mb-2 uppercase tracking-widest">Risk Factors</div>
                <ul className="space-y-2">
                  {safetyScore.factors.map((factor, i) => (
                    <li key={i} className="text-[13px] text-foreground font-medium flex items-start gap-2.5">
                      <div className="w-1.5 h-1.5 bg-foreground/40 rounded-full mt-[6px] shrink-0" /> {factor}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>

    </motion.div>
  )
}
