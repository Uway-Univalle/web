import { useState } from 'react'
import ProtectedRoute from './components/ProtectedRoute';
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./routes/Home";
import Login from './routes/Login';
import Register from './routes/Register';
import Dashboard from './routes/Dashboard';
import RegisterPassanger from './routes/register/RegisterPassanger';
import RegisterDriver from './routes/register/RegisterDriver';
import RegisterCollege from './routes/register/RegisterCollege';

function App() {
  const [count, setCount] = useState(0)

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path='/register-passanger' element={<RegisterPassanger />} />
        <Route path='/register-college' element={<RegisterCollege />} />
        <Route path='/register-driver' element={<RegisterDriver />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />


      </Routes>
    </BrowserRouter>
  )
}

export default App
