import { useState, useRef, useEffect } from "react"
import { KeyRound, Send, Mic, MicOff, Bot, Sparkles, Volume2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useLocation } from "react-router-dom"
import { GoogleGenAI } from "@google/genai"

type Message = {
  id: string
  text: string
  sender: 'user' | 'bot'
}

export default function Chatbot() {
  const location = useLocation()
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: "Hi! I'm your GigShield AI. Ask me about your rights, fairness of a fare, or say 'Translate to Spanish' to switch languages.", sender: 'bot' }
  ])
  const [input, setInput] = useState<string>(location.state?.prefill || "")
  const [isListening, setIsListening] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  
  const [localApiKey, setLocalApiKey] = useState(() => localStorage.getItem('GEMINI_API_KEY') || "")
  const [keyInput, setKeyInput] = useState("")
  const isKeyMissing = !import.meta.env.VITE_GEMINI_API_KEY && !localApiKey
  
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    if (SpeechRecognition && !recognitionRef.current) {
      const rec = new SpeechRecognition()
      rec.continuous = true // Keep listening until explicitly stopped
      rec.interimResults = true // Enable partial results if supported
      rec.lang = 'en-US'
      
      rec.onresult = (event: any) => {
        let finalTranscript = ''
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript
          }
        }
        if (finalTranscript) {
          setInput(prev => prev ? prev + ' ' + finalTranscript : finalTranscript)
        }
      }

      rec.onend = () => setIsListening(false)
      rec.onerror = (e: any) => {
        console.error("Speech error", e)
        setIsListening(false)
      }

      recognitionRef.current = rec
    }
  }, [SpeechRecognition])

  const toggleListen = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser.")
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      try {
        recognitionRef.current.start()
        setIsListening(true)
      } catch (e) {
        console.error(e)
        setIsListening(false)
      }
    }
  }

  const readOutLoud = (text: string) => {
    window.speechSynthesis.cancel() // Stop any current speech
    const utterance = new SpeechSynthesisUtterance(text)
    window.speechSynthesis.speak(utterance)
  }

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim()) return

    const userMsg = input
    setInput("")
    setMessages(prev => [...prev, { id: Date.now().toString(), text: userMsg, sender: 'user' }])
    setIsTyping(true)

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || localApiKey
      if (!apiKey) {
         setMessages(prev => [...prev, { id: Date.now().toString(), text: "I need an API key to think! Please provide one below.", sender: 'bot' }])
         setIsTyping(false)
         return
      }

      const ai = new GoogleGenAI({ apiKey })
      
      const chatHistory = messages
        .filter(m => m.id !== '1') // skip default greeting
        .slice(-6) // keep only last few messages for context window
        .map(m => `${m.sender === 'user' ? 'User' : 'You'}: ${m.text}`)
        .join('\n')
        
      const promptContext = `You are GigShield AI, a helpful financial and rights advisor for gig workers (like Uber, Ola, Rapido drivers in India/Global). Answer concisely. Keep answers short, simple, and actionable. Do not use formatting like bolding or bullet points unless absolutely necessary for readability.
      
Chat History:
${chatHistory}
User: ${userMsg}
You: `

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: promptContext,
      })

      const botResponse = response.text || "Sorry, I didn't quite get that."
      
      setMessages(prev => [...prev, { id: Date.now().toString(), text: botResponse, sender: 'bot' }])
    } catch (err: any) {
      console.error(err)
      setMessages(prev => [...prev, { id: Date.now().toString(), text: "I encountered an error trying to respond. Please try again.", sender: 'bot' }])
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <div className="flex flex-col flex-1 -mx-6 -mt-6 relative bg-transparent">
      
      {/* Header */}
      <div className="bg-transparent dark:bg-black/40 backdrop-blur-3xl border-b border-black/5 dark:border-white/10 p-5 sticky top-0 z-10 flex items-center gap-4 shadow-sm">
        <div className="bg-primary p-2.5 rounded-2xl text-primary-foreground shadow-md">
          <Bot className="w-6 h-6" />
        </div>
        <div>
          <h2 className="font-black text-lg text-foreground tracking-tight flex items-center gap-2 drop-shadow-sm">
            GigShield AI <Sparkles className="w-4 h-4 text-primary" />
          </h2>
          <p className="text-[11px] uppercase tracking-wider font-bold text-foreground/60 mt-0.5">Financial & Rights Advisor</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 pb-28">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              key={msg.id} 
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[85%] p-4 text-[15px] leading-relaxed whitespace-pre-wrap relative ${
                  msg.sender === 'user' 
                    ? 'bg-primary text-primary-foreground rounded-[24px] rounded-br-[8px] shadow-lg backdrop-blur-md' 
                    : 'glass-panel text-foreground rounded-[24px] rounded-bl-[8px]'
                }`}
              >
                {msg.text}
                {msg.sender === 'bot' && (
                  <button 
                    onClick={() => readOutLoud(msg.text)}
                    className="ml-2 inline-flex items-center justify-center p-1.5 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-foreground/70 hover:text-foreground transition-colors align-middle shadow-inner border border-white/20 dark:border-white/10"
                    title="Read out loud"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
          {isTyping && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-start"
            >
              <div className="glass-panel text-foreground/60 p-4 rounded-[24px] rounded-bl-[8px] flex gap-1.5 items-center">
                <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 w-full bg-transparent dark:bg-black/40 backdrop-blur-3xl border-t border-black/5 dark:border-white/10 p-5 pb-8 sm:pb-5 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        
        {isKeyMissing ? (
          <form 
            onSubmit={(e) => {
              e.preventDefault()
              if (keyInput.trim()) {
                localStorage.setItem('GEMINI_API_KEY', keyInput.trim())
                setLocalApiKey(keyInput.trim())
              }
            }}
            className="flex flex-col gap-3 glass-panel p-4 rounded-2xl border-yellow-500/30"
          >
            <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 text-sm font-bold drop-shadow-sm">
              <KeyRound className="w-4 h-4" /> Please set your Gemini API Key
            </div>
            <div className="flex gap-2">
              <input 
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="flex-1 glass-input rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/50"
              />
              <button type="submit" className="bg-yellow-500 text-black px-4 py-2.5 rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(234,179,8,0.3)]">
                Save
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSend} className="flex items-center gap-3">
            
            {SpeechRecognition && (
              <motion.button 
                whileTap={{ scale: 0.9 }}
                type="button" 
                onClick={toggleListen}
                className={`p-3.5 rounded-full flex-shrink-0 transition-all shadow-inner border border-white/20 dark:border-white/10 ${
                  isListening ? 'bg-red-500/20 text-red-600 dark:text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'bg-black/5 dark:bg-white/10 text-foreground/70 hover:text-foreground hover:bg-black/10 dark:hover:bg-white/20'
                }`}
              >
                {isListening ? <Mic className="w-5 h-5 animate-pulse" /> : <MicOff className="w-5 h-5" />}
              </motion.button>
            )}

            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your rights..."
              className="flex-1 glass-input rounded-full px-5 py-3.5 text-sm text-foreground placeholder:text-foreground/50 font-medium"
            />
            
            <motion.button 
              whileTap={{ scale: 0.9 }}
              type="submit"
              disabled={!input.trim() || isTyping}
              className="bg-primary hover:opacity-90 text-primary-foreground p-3.5 rounded-full flex-shrink-0 disabled:opacity-50 transition-opacity shadow-lg"
            >
              <Send className="w-5 h-5 ml-0.5" />
            </motion.button>

          </form>
        )}
      </div>

    </div>
  )
}
