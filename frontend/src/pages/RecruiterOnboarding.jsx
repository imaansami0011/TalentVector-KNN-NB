import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function RecruiterOnboarding() {
  const [companyName, setCompanyName] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');
  const [hqLocation, setHqLocation] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  const userId = localStorage.getItem('user_id') || 'recruiter@company.com';
  const userEmail = userId; // user_id is the email in our system

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch('http://localhost:8000/recruiter/company', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': userId
        },
        body: JSON.stringify({
          company_name: companyName,
          website: website,
          address: address,
          hq_location: hqLocation
        })
      });

      if (!response.ok) throw new Error('Failed to save company profile');
      
      localStorage.setItem('onboarded', 'true');
      navigate('/recruiter');
    } catch (error) {
      console.error("Onboarding error:", error);
      alert("Failed to save company profile.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface font-body text-on-surface flex flex-col">
      {/* Top Bar matching Candidate experience */}
      <header className="bg-surface sticky top-0 z-50 flex justify-between items-center w-full px-6 py-4 border-b border-outline-variant shadow-sm md:px-margin-desktop">
        <div className="flex items-center gap-4">
          <div className="font-headline-md text-headline-md font-bold text-primary tracking-tight">TALENT VECTOR</div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-xl mx-auto px-6 py-10 flex flex-col gap-8">
        {/* Progress Stepper */}
        <section className="w-full">
          <div className="flex justify-between items-center mb-2">
            <span className="font-label-md text-label-md text-primary uppercase tracking-wider font-bold">Step 2 of 4</span>
            <span className="font-label-md text-label-md text-on-surface-variant font-bold">50% Complete</span>
          </div>
          <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
            <div className="h-full bg-primary w-1/2 rounded-full transition-all duration-500 shadow-sm"></div>
          </div>
          <div className="grid grid-cols-4 gap-2 mt-3">
            <div className="text-center font-black text-[8px] uppercase tracking-widest text-primary">Account</div>
            <div className="text-center font-black text-[8px] uppercase tracking-widest text-primary">Company</div>
            <div className="text-center font-black text-[8px] uppercase tracking-widest text-on-surface-variant/40">Team</div>
            <div className="text-center font-black text-[8px] uppercase tracking-widest text-on-surface-variant/40">Dashboard</div>
          </div>
        </section>

        <div className="bg-surface-container-lowest rounded-[2rem] border border-outline-variant shadow-[0_20px_50px_rgba(0,0,0,0.05)] p-8 flex flex-col gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20 shadow-sm">
              <span className="material-symbols-outlined text-[32px]">business</span>
            </div>
            <h1 className="font-black text-2xl text-on-surface tracking-tight uppercase">Company Profile</h1>
            <p className="font-bold text-[11px] text-on-surface-variant uppercase tracking-widest mt-1">
              Complete your enterprise identity
            </p>
          </div>

        <form onSubmit={handleSave} className="flex flex-col gap-6 mt-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-outline uppercase tracking-[0.2em] ml-1 opacity-70">Company Name *</label>
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-transparent rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500"></div>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Talent Vector Inc."
                className="relative w-full h-12 px-4 rounded-xl border border-outline-variant/40 bg-white/50 backdrop-blur-sm focus:bg-white focus:ring-[3px] focus:ring-primary/5 focus:border-primary transition-all outline-none text-sm font-bold placeholder:text-outline/40 shadow-inner"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-outline uppercase tracking-[0.2em] ml-1 opacity-70">Website (Optional)</label>
            <div className="relative group">
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://company.com"
                className="w-full h-12 px-4 rounded-xl border border-outline-variant/40 bg-white/50 backdrop-blur-sm focus:bg-white focus:ring-[3px] focus:ring-primary/5 focus:border-primary transition-all outline-none text-sm font-bold placeholder:text-outline/40 shadow-inner"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-outline uppercase tracking-[0.2em] ml-1 opacity-70">Headquarters</label>
              <input
                type="text"
                value={hqLocation}
                onChange={(e) => setHqLocation(e.target.value)}
                placeholder="San Francisco, CA"
                className="w-full h-12 px-4 rounded-xl border border-outline-variant/40 bg-white/50 backdrop-blur-sm focus:bg-white focus:ring-[3px] focus:ring-primary/5 focus:border-primary transition-all outline-none text-sm font-bold placeholder:text-outline/40 shadow-inner"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-outline uppercase tracking-[0.2em] ml-1 opacity-70">Office Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Tech Lane"
                className="w-full h-12 px-4 rounded-xl border border-outline-variant/40 bg-white/50 backdrop-blur-sm focus:bg-white focus:ring-[3px] focus:ring-primary/5 focus:border-primary transition-all outline-none text-sm font-bold placeholder:text-outline/40 shadow-inner"
              />
            </div>
          </div>

          <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 flex gap-4 mt-2">
            <span className="material-symbols-outlined text-primary text-[20px]">verified_user</span>
            <p className="font-bold text-[9px] text-primary/70 uppercase tracking-widest leading-relaxed">
              SECURITY PROTOCOL: THIS PROFILE WILL BE LOCKED TO <b className="text-primary">{userEmail}</b> FOR DATA PRIVACY ENFORCEMENT.
            </p>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="group relative w-full h-14 bg-[#111] overflow-hidden rounded-2xl transition-all duration-500 hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)] hover:scale-[1.01] active:scale-[0.98] mt-4"
          >
            {/* Spotlight Hover Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/30 via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            
            <div className="relative flex items-center justify-center gap-3">
              {isSaving ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-white">refresh</span>
                  <span className="text-white font-black uppercase tracking-[0.2em] text-[10px]">Synchronizing Profile...</span>
                </>
              ) : (
                <>
                  <span className="text-white font-black uppercase tracking-[0.2em] text-[10px]">Initialize Dashboard</span>
                  <span className="material-symbols-outlined text-white transition-transform group-hover:translate-x-1">arrow_forward</span>
                </>
              )}
            </div>
          </button>
        </form>
        </div>
      </main>
    </div>
  );
}
