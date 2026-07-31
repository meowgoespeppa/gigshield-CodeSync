import { NavLink, Outlet, useLocation } from "react-router-dom"
import { Home, PlusCircle, List, MessageSquare, ShieldAlert } from "lucide-react"
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion"
import { useGigStore } from "@/store/useGigStore"
import { useState, useEffect, useRef } from "react"

export default function MobileLayout() {
  const location = useLocation()
  const triggerAlert = useGigStore(state => state.triggerAlert)

  // Enforce dark mode
  useEffect(() => {
    document.documentElement.classList.add('dark')
    localStorage.setItem('theme', 'dark')
  }, [])

  // Scroll behavior for dock
  const { scrollY } = useScroll()
  const [hidden, setHidden] = useState(false)
  
  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious()
    if (latest > previous! && latest > 50) {
      setHidden(true)
    } else {
      setHidden(false)
    }
  })

  // Mouse tracking for dynamic glossy sheen lighting
  const containerRef = useRef<HTMLDivElement>(null)
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    // Set custom properties for children with .glossy-sheen
    containerRef.current.style.setProperty('--mouse-x', `${x}px`)
    containerRef.current.style.setProperty('--mouse-y', `${y}px`)
  }

  const navItems = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/log", icon: PlusCircle, label: "Log" },
    { to: "/history", icon: List, label: "History" },
    { to: "/chat", icon: MessageSquare, label: "Chat" },
  ]

  const handleSOS = () => {
    triggerAlert("Latitude: 40.7128, Longitude: -74.0060 (Mocked)")
    alert("SOS Triggered! Alert sent via Twilio (mocked).")
  }

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="flex flex-col h-screen max-w-md mx-auto bg-background text-foreground relative overflow-hidden sm:border sm:border-border sm:rounded-[40px] sm:h-[90vh] sm:mt-[5vh] shadow-2xl transition-colors duration-500"
    >
      
      {/* Ambient White & Yellow Backgrounds */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="blob-yellow top-[-10%] left-[-20%]" />
        <div className="blob-white top-[30%] right-[-30%]" />
      </div>

      {/* Header */}
      <header className="px-6 py-5 flex justify-between items-center z-10">
        <h1 className="text-2xl font-black tracking-tighter text-foreground drop-shadow-sm relative">
          GigShield
        </h1>
        
        <div className="flex items-center gap-4">
          
          {/* SOS Button */}
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={handleSOS}
            className="bg-red-500/80 backdrop-blur-xl text-white hover:opacity-90 p-2 rounded-full transition-colors flex items-center gap-2 text-sm font-bold px-4 shadow-lg border border-red-400/50"
          >
            <ShieldAlert className="w-4 h-4" />
            SOS
          </motion.button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto px-6 pb-32 z-10 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 1.02, filter: "blur(4px)" }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="min-h-full flex flex-col"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Floating Glass Dock Navigation with Scroll Morphing */}
      <motion.div 
        animate={{ 
          y: hidden ? 100 : 0,
          scale: hidden ? 0.9 : 1,
          opacity: hidden ? 0 : 1
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="absolute bottom-6 left-6 right-6 z-20"
      >
        <nav className="glass-dock px-6 py-4 rounded-3xl">
          <ul className="flex justify-between items-center">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink 
                  to={item.to}
                  className={({ isActive }) => 
                    `flex flex-col items-center gap-1.5 transition-colors relative ${isActive ? 'text-primary' : 'text-foreground/50 hover:text-foreground/80'}`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5px] drop-shadow-md' : 'stroke-[1.5px]'}`} />
                      <span className={`text-[10px] font-bold tracking-wide ${isActive ? 'opacity-100' : 'opacity-0'} transition-opacity`}>
                        {item.label}
                      </span>
                      {isActive && (
                        <motion.div 
                          layoutId="nav-pill"
                          className="absolute -bottom-2 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(255,183,0,0.8)]"
                          transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        />
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </motion.div>
      
    </div>
  )
}
