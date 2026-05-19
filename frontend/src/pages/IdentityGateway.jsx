import React, { useState } from 'react';
import { Mail, KeyRound, ArrowRight, Briefcase, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';

export default function IdentityGateway() {
  const [role, setRole] = useState('candidate'); // 'candidate' | 'hr'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState('email'); // 'email' | 'otp' | 'password' | 'login'
  const navigate = useNavigate();

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    // Simulate checking MongoDB. For now, assume new user -> Trigger OTP
    setStep('otp');
  };

  const handleOtpSubmit = (e) => {
    e.preventDefault();
    // Simulate OTP verification success
    setStep('password');
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    // Simulate password setup and auto-login
    navigate(role === 'hr' ? '/recruiter' : '/onboarding');
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        console.log('Fetching Google profile...');
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const userInfo = await res.json();
        
        console.log('Sending to backend database...', userInfo.email);
        const backendRes = await fetch('http://localhost:8000/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: userInfo.email, name: userInfo.name })
        });
        
        if (!backendRes.ok) throw new Error('Backend failed to save user');
        
        const data = await backendRes.json();
        console.log('Successfully saved to DB!', data);
        
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('user_name', userInfo.name);
        localStorage.setItem('user_id', userInfo.email); // Store for header
        if (userInfo.picture) {
          localStorage.setItem('user_picture', userInfo.picture);
        }
        
        if (role === 'hr') {
          if (data.status === 'incomplete_profile') {
            navigate('/recruiter-onboarding');
          } else {
            navigate('/recruiter');
          }
        } else {
          navigate('/onboarding', { state: { googleName: userInfo.name } });
        }
      } catch (err) {
        console.error('Login Pipeline Failed:', err);
        alert('Failed to save your profile. Is the backend running?');
      }
    },
    onError: () => {
      console.error('Google Login Failed');
      alert("Google login failed or was cancelled.");
    }
  });

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center overflow-hidden">
      {/* World-Class Mesh Gradient Background */}
      <div className="absolute inset-0 flex flex-col md:flex-row overflow-hidden">
        {/* Noise Overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] z-20"></div>

        {/* Dynamic Mesh Orbs */}
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[150px] animate-pulse duration-7000"></div>
        <div className="absolute top-[20%] right-[10%] w-64 h-64 bg-purple-500/10 rounded-full blur-[100px] animate-bounce duration-10000"></div>

        {/* Recruiter Side - Left */}
        <div className={`flex-1 flex flex-col items-center justify-center p-12 transition-all duration-1000 ${role === 'hr' ? 'bg-[#020617]' : 'bg-[#0f172a]'}`}>
          <div className={`max-w-xs text-center transition-all duration-1000 ${role === 'hr' ? 'opacity-100 translate-y-0 scale-110 rotate-0' : 'opacity-5 scale-75 translate-x-[-100px] rotate-[-5deg]'}`}>
            <div className="relative group">
              <div className="absolute -inset-4 bg-blue-500/20 rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative w-24 h-24 bg-white/5 backdrop-blur-2xl rounded-[2rem] flex items-center justify-center mb-10 mx-auto border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:border-blue-400/30 transition-all duration-500">
                <Briefcase className="w-12 h-12 text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.5)]" />
              </div>
            </div>
            <h2 className="text-6xl font-black mb-8 tracking-tighter leading-none">
              <span className="block text-white/20 uppercase text-lg tracking-[0.3em] font-bold mb-2">Platform</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/30 drop-shadow-[0_10px_30px_rgba(255,255,255,0.2)] uppercase">RECRUITERS</span>
            </h2>
            <div className="w-12 h-1 bg-gradient-to-r from-blue-500 to-transparent mx-auto mb-6 rounded-full"></div>
            <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[9px] leading-relaxed max-w-[200px] mx-auto">
              Precision sourcing powered by neural matching
            </p>
          </div>
        </div>

        {/* Job Seeker Side - Right */}
        <div className={`flex-1 flex flex-col items-center justify-center p-12 transition-all duration-1000 ${role === 'candidate' ? 'bg-[#004ac6]' : 'bg-[#1e3a8a]'}`}>
          <div className={`max-w-xs text-center transition-all duration-1000 ${role === 'candidate' ? 'opacity-100 translate-y-0 scale-110 rotate-0' : 'opacity-5 scale-75 translate-x-[100px] rotate-[5deg]'}`}>
            <div className="relative group">
              <div className="absolute -inset-4 bg-white/20 rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative w-24 h-24 bg-white/10 backdrop-blur-2xl rounded-[2rem] flex items-center justify-center mb-10 mx-auto border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.2)] hover:border-white/40 transition-all duration-500">
                <UserRound className="w-12 h-12 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
              </div>
            </div>
            <h2 className="text-6xl font-black mb-8 tracking-tighter leading-none">
              <span className="block text-white/40 uppercase text-lg tracking-[0.3em] font-bold mb-2">Connect</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/40 drop-shadow-[0_10px_30px_rgba(255,255,255,0.2)] uppercase">SEEKERS</span>
            </h2>
            <div className="w-12 h-1 bg-gradient-to-r from-white to-transparent mx-auto mb-6 rounded-full"></div>
            <p className="text-blue-200 font-bold uppercase tracking-[0.2em] text-[9px] leading-relaxed max-w-[200px] mx-auto">
              Auto-fetch your path to global engineering roles
            </p>
          </div>
        </div>
      </div>

      {/* Floating Login Card with Rim-Light & Glass Aesthetics */}
      <div className="relative z-30 max-w-[400px] w-full bg-white/90 backdrop-blur-[40px] rounded-[2.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.4)] border border-white/40 overflow-hidden animate-fadeIn m-4 group">
        {/* Card Rim Light Effect */}
        <div className="absolute inset-0 border-[1px] border-white/60 rounded-[2.5rem] pointer-events-none"></div>
        
        {/* Header - Advanced Gradient with Light Sweep */}
        <div className="relative p-10 text-center bg-gradient-to-br from-primary via-[#1e40af] to-[#1e3a8a] overflow-hidden">
          <div className="absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-30deg] animate-sweep"></div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase drop-shadow-lg">TALENT VECTOR</h1>
          <p className="text-white/70 font-black text-[9px] uppercase tracking-[0.4em] mt-2 drop-shadow-sm">Next-Generation Talent Acquisition</p>
        </div>

        <div className="p-8 space-y-8">
          {/* Physical Sliding Role Toggle */}
          <div className="relative flex bg-surface-container/50 p-1 rounded-2xl border border-outline-variant/30 backdrop-blur-md h-12">
            {/* Sliding Background */}
            <div 
              className="absolute top-1 bottom-1 bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.1)] border border-outline-variant/10 transition-all duration-500 ease-out z-0"
              style={{ 
                left: role === 'hr' ? '4px' : 'calc(50% + 2px)', 
                width: 'calc(50% - 6px)' 
              }}
            ></div>
            
            <button
              onClick={() => setRole('hr')}
              className={`flex-1 relative z-10 flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest transition-all duration-300 ${
                role === 'hr' ? 'text-primary' : 'text-outline hover:text-on-surface'
              }`}
            >
              <Briefcase className={`w-3.5 h-3.5 transition-transform duration-300 ${role === 'hr' ? 'scale-110' : 'scale-100'}`} /> Recruiter
            </button>
            <button
              onClick={() => setRole('candidate')}
              className={`flex-1 relative z-10 flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest transition-all duration-300 ${
                role === 'candidate' ? 'text-primary' : 'text-outline hover:text-on-surface'
              }`}
            >
              <UserRound className={`w-3.5 h-3.5 transition-transform duration-300 ${role === 'candidate' ? 'scale-110' : 'scale-100'}`} /> Job Seeker
            </button>
          </div>

          {/* Elite Compact Form */}
          {step === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-outline uppercase tracking-[0.2em] ml-1 opacity-70">Email Access</label>
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-transparent rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-4 w-4.5 h-4.5 text-outline transition-colors group-focus-within:text-primary" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-outline-variant/40 bg-white/50 backdrop-blur-sm focus:bg-white focus:ring-[3px] focus:ring-primary/5 focus:border-primary transition-all outline-none text-sm font-bold placeholder:text-outline/50 shadow-inner"
                      placeholder="name@example.com"
                    />
                  </div>
                </div>
              </div>
              
              <button 
                type="submit" 
                className="group relative w-full py-4 bg-[#111] overflow-hidden rounded-2xl transition-all duration-500 hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)] hover:scale-[1.01] active:scale-[0.98]"
              >
                {/* Spotlight Hover Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/30 via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                <div className="relative flex items-center justify-center gap-3">
                  <span className="text-white font-black uppercase tracking-[0.2em] text-[10px]">Continue with Email</span>
                  <ArrowRight className="w-4 h-4 text-white transition-transform group-hover:translate-x-1" />
                </div>
              </button>

              <div className="relative flex items-center justify-center py-2">
                <div className="absolute inset-0 flex items-center px-2">
                  <div className="w-full border-t border-outline-variant/20"></div>
                </div>
                <span className="relative px-4 bg-white text-[9px] font-black text-outline/40 uppercase tracking-[0.3em]">Identity Protocol</span>
              </div>

              {/* Crystal Google Button */}
              <button 
                type="button"
                onClick={() => loginWithGoogle()}
                className="group relative w-full py-4 bg-white border border-outline-variant/40 rounded-2xl flex items-center justify-center gap-4 transition-all duration-500 hover:bg-surface-container-lowest hover:shadow-[0_15px_35px_rgba(0,0,0,0.08)] active:scale-[0.98]"
              >
                <div className="absolute inset-0 rounded-2xl border-[1px] border-primary/0 group-hover:border-primary/10 transition-colors duration-500"></div>
                <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="text-on-surface font-black uppercase tracking-[0.2em] text-[10px]">Continue with Google</span>
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleOtpSubmit} className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-slate-900">Check your email</h3>
                <p className="text-sm text-slate-500 mt-1">We sent a 6-digit code to {email}</p>
              </div>
              <div>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full px-4 py-4 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-center text-2xl font-black tracking-[0.5em]"
                  placeholder="------"
                />
              </div>
              <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-200">
                Verify Code
              </button>
              <button type="button" onClick={() => setStep('email')} className="w-full py-3 text-slate-500 font-semibold text-sm hover:text-slate-700">
                Back to email
              </button>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-slate-900">Create Password</h3>
                <p className="text-sm text-slate-500 mt-1">Secure your new account</p>
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-1.5">New Password</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <button type="submit" className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2">
                Create Account & Continue <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
