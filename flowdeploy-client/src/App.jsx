import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import PipelineDetail from './pages/PipelineDetail'
import NewPipeline from './pages/NewPipeline'

const PrivateRoute = ({ children }) => {
  return localStorage.getItem('token') ? children : <Navigate to="/login" />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/pipeline/new" element={<PrivateRoute><NewPipeline /></PrivateRoute>} />
        <Route path="/pipeline/:id" element={<PrivateRoute><PipelineDetail /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  )
}