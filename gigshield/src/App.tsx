import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import MobileLayout from "@/components/layout/MobileLayout"
import Dashboard from "@/pages/Dashboard"
import LogJob from "@/pages/LogJob"
import JobsList from "@/pages/JobsList"
import Chatbot from "@/pages/Chatbot"
import Login from "@/pages/Login"
import { useAuthStore } from "@/store/useAuthStore"

function App() {
  const user = useAuthStore(state => state.user)

  if (!user) {
    return <Login />
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MobileLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="log" element={<LogJob />} />
          <Route path="history" element={<JobsList />} />
          <Route path="chat" element={<Chatbot />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
