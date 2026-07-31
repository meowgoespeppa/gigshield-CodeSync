import { useState } from "react"
import { useGigStore, type Platform } from "@/store/useGigStore"
import { useNavigate } from "react-router-dom"
import { Camera, Loader2, PlusCircle } from "lucide-react"
import Tesseract from 'tesseract.js'
import { motion } from "framer-motion"

export default function LogJob() {
  const addJob = useGigStore(state => state.addJob)
  const navigate = useNavigate()
  
  const [platform, setPlatform] = useState<Platform>('Uber')
  const [fare, setFare] = useState('')
  const [distance, setDistance] = useState('')
  const [time, setTime] = useState('')
  const [lateNight, setLateNight] = useState(false)
  const [oversizedLuggage, setOversizedLuggage] = useState(false)
  
  const [isScanning, setIsScanning] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await addJob({
      platform,
      fare: parseFloat(fare),
      distance: parseFloat(distance),
      time: parseFloat(time),
      late_night: lateNight,
      oversized_luggage: oversizedLuggage,
    })
    navigate("/history")
  }

  const handleScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsScanning(true)
    try {
      const result = await Tesseract.recognize(file, 'eng')
      const text = result.data.text
      
      const fareMatch = text.match(/(?:₹|Rs\.?\s?|\$|€|\?|z|F|=)?\s*([0-9]+\.[0-9]{2})/i)
      if (fareMatch) {
        let parsedFare = fareMatch[1]
        if (/^[27][0-9]{3,}\./.test(parsedFare)) {
          parsedFare = parsedFare.substring(1)
        }
        setFare(parsedFare)
      }
        
      const distMatch = text.match(/([0-9]+\.[0-9]+)\s*(?:km|kilometers?)/i)
        ?? text.match(/([0-9]+\.[0-9]+)\s*mi/i)
      if (distMatch) {
        const value = parseFloat(distMatch[1])
        setDistance(text.match(/mi/i) ? (value * 1.60934).toFixed(1) : distMatch[1])
      }
        
      const timeMatch = text.match(/([0-9]+)\s*min/i)
      if (timeMatch) setTime(timeMatch[1])
      
      alert("Scan complete! We pre-filled what we could find.")
    } catch (error) {
      console.error(error)
      alert("Failed to scan screenshot.")
    } finally {
      setIsScanning(false)
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pt-2 pb-10"
    >
      <div>
        <h2 className="text-3xl font-black tracking-tighter text-foreground drop-shadow-sm">Log a Job</h2>
        <p className="text-foreground/70 font-medium text-sm mt-1">Extract from screenshot or enter manually.</p>
      </div>

      {/* OCR Scanner */}
      <motion.div 
        whileHover={{ scale: 0.98 }}
        className="glass-panel border-dashed p-8 rounded-[32px] flex flex-col items-center justify-center text-center relative overflow-hidden transition-transform"
      >
        <input 
          type="file" 
          accept="image/*" 
          className="hidden" 
          id="screenshot-upload" 
          onChange={handleScan}
          disabled={isScanning}
        />
        <label 
          htmlFor="screenshot-upload" 
          className={`cursor-pointer flex flex-col items-center gap-4 z-10 ${isScanning ? 'opacity-50' : 'hover:opacity-80 transition-opacity'}`}
        >
          <div className="bg-primary/10 dark:bg-primary/20 backdrop-blur-md p-5 rounded-3xl border border-primary/20 shadow-inner">
            {isScanning ? <Loader2 className="w-10 h-10 text-primary animate-spin drop-shadow-md" /> : <Camera className="w-10 h-10 text-primary drop-shadow-md" />}
          </div>
          <div>
            <p className="font-black text-foreground text-lg drop-shadow-sm">{isScanning ? 'Analyzing Image...' : 'Scan Screenshot'}</p>
            <p className="text-[13px] text-foreground/60 mt-1 font-medium">Auto-extract fare, distance & time</p>
          </div>
        </label>
      </motion.div>

      <div className="relative py-2">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-white/20 dark:border-white/10" />
        </div>
        <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest">
          <span className="bg-white/50 dark:bg-black/50 backdrop-blur-xl px-4 py-1 rounded-full text-foreground/60 shadow-sm border border-white/20 dark:border-white/10">Or enter manually</span>
        </div>
      </div>

      {/* Manual Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        
        <div className="space-y-2">
          <label className="text-[13px] uppercase tracking-wider font-bold text-foreground/70 ml-2">Platform</label>
          <select 
            className="w-full glass-input rounded-2xl p-4 text-foreground appearance-none shadow-sm font-medium"
            value={platform}
            onChange={(e) => setPlatform(e.target.value as any)}
          >
            <option className="text-black">Ola</option>
            <option className="text-black">Uber</option>
            <option className="text-black">Rapido</option>
            <option className="text-black">Namma Yatri</option>
            <option className="text-black">Other</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[13px] uppercase tracking-wider font-bold text-foreground/70 ml-2">Fare (₹)</label>
            <input 
              type="number" step="0.01" required
              value={fare} onChange={(e) => setFare(e.target.value)}
              className="w-full glass-input rounded-2xl p-4 text-foreground placeholder:text-foreground/30 font-medium"
              placeholder="0.00"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-[13px] uppercase tracking-wider font-bold text-foreground/70 ml-2">Distance (km)</label>
            <input 
              type="number" step="0.1" required
              value={distance} onChange={(e) => setDistance(e.target.value)}
              className="w-full glass-input rounded-2xl p-4 text-foreground placeholder:text-foreground/30 font-medium"
              placeholder="0.0"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[13px] uppercase tracking-wider font-bold text-foreground/70 ml-2">Duration (mins)</label>
          <input 
            type="number" required
            value={time} onChange={(e) => setTime(e.target.value)}
            className="w-full glass-input rounded-2xl p-4 text-foreground placeholder:text-foreground/30 font-medium"
            placeholder="0"
          />
        </div>

        <div className="space-y-3">
          <label className="text-[13px] uppercase tracking-wider font-bold text-foreground/70 ml-2">Surcharges</label>
          <label className="flex items-center gap-4 glass-panel p-5 rounded-2xl cursor-pointer hover:bg-white/50 dark:hover:bg-black/50 transition-colors">
            <input
              type="checkbox"
              checked={lateNight}
              onChange={(e) => setLateNight(e.target.checked)}
              className="w-5 h-5 rounded border-white/30 text-primary focus:ring-primary shadow-inner"
            />
            <div>
              <p className="text-foreground font-bold text-[15px] drop-shadow-sm">Late-night trip (11 PM – 5 AM)</p>
              <p className="text-xs text-foreground/60 font-medium mt-0.5">+25% on base fare</p>
            </div>
          </label>
          <label className="flex items-center gap-4 glass-panel p-5 rounded-2xl cursor-pointer hover:bg-white/50 dark:hover:bg-black/50 transition-colors">
            <input
              type="checkbox"
              checked={oversizedLuggage}
              onChange={(e) => setOversizedLuggage(e.target.checked)}
              className="w-5 h-5 rounded border-white/30 text-primary focus:ring-primary shadow-inner"
            />
            <div>
              <p className="text-foreground font-bold text-[15px] drop-shadow-sm">Oversized luggage</p>
              <p className="text-xs text-foreground/60 font-medium mt-0.5">+₹25 flat fee</p>
            </div>
          </label>
        </div>

        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit" 
          className="w-full bg-primary text-primary-foreground font-black text-lg rounded-2xl p-4 mt-8 flex justify-center items-center gap-2 shadow-lg hover:shadow-xl transition-all border border-primary/50"
        >
          <PlusCircle className="w-5 h-5" /> Log Job 
        </motion.button>

      </form>
    </motion.div>
  )
}
