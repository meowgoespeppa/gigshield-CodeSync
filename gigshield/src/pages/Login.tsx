import { useState, useRef } from "react"
import { useAuthStore } from "@/store/useAuthStore"
import { motion } from "framer-motion"
import { ShieldCheck, ArrowRight } from "lucide-react"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const login = useAuthStore(state => state.login)

  const containerRef = useRef<HTMLDivElement>(null)
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    containerRef.current.style.setProperty('--mouse-x', `${x}px`)
    containerRef.current.style.setProperty('--mouse-y', `${y}px`)
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      login(email)
    }
  }

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors duration-500"
    >
      
      {/* Ambient White & Yellow Backgrounds */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="blob-yellow top-[-10%] left-[-20%]" />
        <div className="blob-white top-[30%] right-[-30%]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm z-10 flex flex-col items-center"
      >
        <div className="flex flex-col items-center text-center mb-8">
          <div className="bg-primary/20 dark:bg-primary/30 backdrop-blur-xl p-5 rounded-full mb-6 border border-primary/20 shadow-inner">
            <ShieldCheck className="w-12 h-12 text-primary drop-shadow-md" />
          </div>
          <h1 className="text-4xl font-black text-foreground tracking-tighter drop-shadow-sm">GigShield</h1>
          <p className="text-foreground/70 font-medium mt-2">Empowering delivery riders.</p>
        </div>

        <form onSubmit={handleLogin} className="glass-panel glossy-sheen p-8 rounded-[32px] w-full space-y-5">
          <div className="space-y-2">
            <label className="text-[12px] uppercase tracking-wider font-bold text-foreground/70 ml-2">Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full glass-input rounded-2xl p-4 text-foreground placeholder:text-foreground/40 font-medium"
              placeholder="rider@example.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[12px] uppercase tracking-wider font-bold text-foreground/70 ml-2">Password</label>
            <input 
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full glass-input rounded-2xl p-4 text-foreground placeholder:text-foreground/40 font-medium"
              placeholder="••••••••"
            />
          </div>

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit" 
            className="w-full bg-primary text-primary-foreground font-black text-lg rounded-2xl p-4 mt-8 flex justify-center items-center gap-2 shadow-lg hover:shadow-xl transition-all border border-primary/50"
          >
            Sign In <ArrowRight className="w-5 h-5" />
          </motion.button>
        </form>
      </motion.div>
    </div>
  )
}
