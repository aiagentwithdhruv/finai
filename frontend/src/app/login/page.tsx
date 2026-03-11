'use client'

import { useState } from 'react'
import { Layers, Mail, Lock, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#0A0A0F] to-[#0F0F1A] relative overflow-hidden font-sans">
      {/* Grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(30,41,59,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(30,41,59,0.04) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      {/* Radial glow */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-[600px] h-[600px] rounded-full bg-[#3B82F6]/[0.03] blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2.5 mb-2">
            <Layers className="w-7 h-7 text-[#94A3B8]" />
            <span className="text-3xl font-semibold tracking-tight text-[#F8FAFC]">
              Fin<span className="text-[#3B82F6]">AI</span>
            </span>
          </div>
          <p className="text-[#94A3B8] text-sm font-medium tracking-wide">
            Financial Document Intelligence
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#16161F] border border-[#1E1E2E] rounded-xl p-8 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-[#F8FAFC]">Sign in to your account</h2>
            <p className="text-sm text-[#94A3B8] mt-1">
              Secure access for authorised personnel only
            </p>
          </div>

          <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label className="block text-[11px] font-medium text-[#94A3B8] uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="analyst@meridianfin.co.uk"
                  className="w-full h-10 bg-[#12121A] border border-[#1E293B] rounded-lg pl-10 pr-4 text-sm text-[#F8FAFC] placeholder:text-[#475569] focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/20 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#94A3B8] uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full h-10 bg-[#12121A] border border-[#1E293B] rounded-lg pl-10 pr-10 text-sm text-[#F8FAFC] placeholder:text-[#475569] focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/20 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#475569] hover:text-[#94A3B8] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex justify-end mt-1.5">
                <button type="button" className="text-xs text-[#3B82F6] hover:text-blue-400 transition-colors">
                  Forgot password?
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full h-10 bg-[#3B82F6] hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-all duration-200 shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.4)] hover:-translate-y-px"
            >
              Sign In
            </button>

            <div className="relative flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-[#1E293B]" />
              <span className="text-xs text-[#475569]">or</span>
              <div className="flex-1 h-px bg-[#1E293B]" />
            </div>

            <button
              type="button"
              className="w-full h-10 bg-[#12121A] border border-[#1E293B] hover:bg-[#1E1E2E] text-[#F8FAFC] text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2.5"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign in with Google
            </button>
          </form>

          <p className="text-center text-xs text-[#475569] mt-6">
            By signing in, you agree to our{' '}
            <button className="text-[#3B82F6] hover:underline">Terms of Service</button>
            {' '}and{' '}
            <button className="text-[#3B82F6] hover:underline">Privacy Policy</button>
          </p>
        </div>

        <p className="text-center text-xs text-[#475569] mt-6">
          Protected by enterprise-grade security. SOC 2 Type II certified.
        </p>
      </div>
    </div>
  )
}
