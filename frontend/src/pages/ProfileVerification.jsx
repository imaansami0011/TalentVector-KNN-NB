import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { predefinedSkills } from '../skillsData';

export default function ProfileVerification() {
  const location = useLocation();
  const navigate = useNavigate();
  const extractedData = location.state?.extractedData || {
    detected_name: '',
    detected_experience: 0,
    detected_sector: 'Technology',
    detected_skills: [],
  };

  const userName = localStorage.getItem('user_name') || '';
  const userEmail = localStorage.getItem('user_id') || '';

  const [name, setName] = useState(userName || extractedData.detected_name);
  const [email, setEmail] = useState(userEmail || extractedData.contact_email);
  const [phone, setPhone] = useState(extractedData.contact_phone || '');
  const [experience, setExperience] = useState(extractedData.detected_experience);
  const [sector, setSector] = useState(extractedData.detected_sector);
  const [skills, setSkills] = useState(extractedData.detected_skills);
  const [newSkill, setNewSkill] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [step, setStep] = useState('verify'); // 'verify' | 'review'
  const userPicture = localStorage.getItem('user_picture');
  const userInitials = (userName || 'U').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const sectors = ['Technology', 'Finance', 'Healthcare', 'Marketing', 'Education', 'Construction', 'Cyber Security', 'Data Science'];

  const removeSkill = (skillToRemove) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const handleSkillSelect = (selectedSkill) => {
    if (!skills.includes(selectedSkill)) {
      setSkills([...skills, selectedSkill]);
    }
    setNewSkill('');
    setIsDropdownOpen(false);
  };

  const filteredSkills = predefinedSkills.filter(skill => 
    !skills.includes(skill) && skill.toLowerCase().includes(newSkill.toLowerCase())
  );

  const handleSave = async () => {
    if (step === 'verify') {
      setStep('review');
      window.scrollTo(0, 0);
      return;
    }
    setIsSaving(true);
    
    try {
      const response = await fetch('http://localhost:8000/candidate/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          email,
          phone,
          sector,
          total_experience: experience,
          skills,
          original_cv_path: extractedData.original_cv_path
        })
      });

      if (!response.ok) throw new Error('Failed to save profile');

      setTimeout(() => {
        setIsSaving(false);
        navigate('/browse');
      }, 1000);
    } catch (error) {
      console.error("Save error:", error);
      alert("Failed to save profile. Ensure backend is running.");
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface font-body text-on-surface flex flex-col">
      {/* TopAppBar */}
      <header className="bg-surface sticky top-0 z-50 flex justify-between items-center w-full px-margin-mobile py-base border-b border-outline-variant shadow-sm md:px-margin-desktop">
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-primary cursor-pointer" onClick={() => navigate(-1)}>arrow_back</span>
          <div className="font-headline-md text-headline-md font-bold text-primary tracking-tight">TALENT VECTOR</div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 bg-secondary-container px-3 py-1.5 rounded-full text-sm font-bold text-on-secondary-container">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            Verification in Progress
          </div>
          <div className="relative">
            <button 
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="w-10 h-10 rounded-full border border-outline-variant shadow-sm flex items-center justify-center font-bold text-slate-600 overflow-hidden ring-offset-2 hover:ring-2 hover:ring-primary transition-all"
            >
              {userPicture ? (
                <img src={userPicture} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-surface-container flex items-center justify-center">{userInitials}</div>
              )}
            </button>
            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-3 w-48 bg-surface-container-lowest rounded-xl shadow-xl border border-outline-variant py-2 z-50">
                <div className="px-4 py-2 border-b border-outline-variant mb-1">
                  <p className="text-sm font-bold text-on-surface truncate">{userName}</p>
                </div>
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-error hover:bg-error-container/10 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">logout</span> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-md flex flex-col gap-stack-lg pb-32">
        {/* Progress Stepper */}
        <section className="w-full">
          <div className="flex justify-between items-center mb-base">
            <span className="font-label-md text-label-md text-primary uppercase tracking-wider">Step {step === 'verify' ? '3' : '4'} of 4</span>
            <span className="font-label-md text-label-md text-on-surface-variant">{step === 'verify' ? '75%' : '100%'} Complete</span>
          </div>
          <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
            <div className={`h-full bg-primary ${step === 'verify' ? 'w-3/4' : 'w-full'} rounded-full transition-all duration-700 shadow-sm`}></div>
          </div>
          <div className="grid grid-cols-4 gap-2 mt-stack-sm">
            <div className="text-center font-label-sm text-label-sm text-primary font-medium">Account</div>
            <div className="text-center font-label-sm text-label-sm text-primary font-medium">Upload CV</div>
            <div className={`text-center font-label-sm text-label-sm ${step === 'verify' ? 'text-primary font-bold' : 'text-primary font-medium'}`}>Fetching</div>
            <div className={`text-center font-label-sm text-label-sm ${step === 'review' ? 'text-primary font-bold' : 'text-on-surface-variant font-medium'}`}>Review</div>
          </div>
        </section>

        {step === 'verify' ? (
          <>
            {/* Welcome Banner */}
            <section className="bg-primary-container/10 border border-primary/20 rounded-2xl p-8 flex flex-col md:flex-row items-center gap-6">
          <div className="w-16 h-16 bg-primary text-on-primary rounded-full flex items-center justify-center shadow-lg">
            <span className="material-symbols-outlined text-[32px]">fact_check</span>
          </div>
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">Verify Your Details</h1>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
              Our AI has processed your CV. Please review the information below to ensure your profile is accurately represented.
            </p>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-stack-md items-start">
          {/* Main Info - Bento Column */}
          <div className="lg:col-span-8 flex flex-col gap-stack-md">
            <div className="bg-surface-container-lowest p-stack-md rounded-xl border border-outline-variant shadow-sm">
              <h3 className="font-headline-md text-headline-md text-on-surface mb-6 flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">person</span>
                Core Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md">
                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-label-md text-on-surface-variant">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-12 px-4 rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all bg-surface-bright font-medium"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-label-md text-on-surface-variant">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-12 px-4 rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all bg-surface-bright font-medium"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-label-md text-on-surface-variant">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full h-12 px-4 rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all bg-surface-bright font-medium"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-label-md text-on-surface-variant">Experience (Years)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={experience}
                    onChange={(e) => setExperience(parseFloat(e.target.value))}
                    className="w-full h-12 px-4 rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all bg-surface-bright font-medium"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-label-md text-on-surface-variant">Target Sector</label>
                  <select
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                    className="w-full h-12 px-4 rounded-lg border border-outline-variant focus:border-primary outline-none bg-surface-bright font-medium"
                  >
                    {sectors.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Ghost Rows Section for Additional Context */}
            <div className="bg-surface-container-lowest p-stack-md rounded-xl border border-outline-variant shadow-sm">
              <h3 className="font-headline-md text-headline-md text-on-surface mb-4">Verification Checklist</h3>
              <div className="divide-y divide-outline-variant">
                <div className="py-4 flex justify-between items-center group">
                  <div className="flex items-center gap-4">
                    <span className="material-symbols-outlined text-primary">mail</span>
                    <div>
                      <p className="font-label-md text-label-md">Contact Verified</p>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">Email extracted from CV header</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-success">check_circle</span>
                </div>
                <div className="py-4 flex justify-between items-center group">
                  <div className="flex items-center gap-4">
                    <span className="material-symbols-outlined text-primary">psychology</span>
                    <div>
                      <p className="font-label-md text-label-md">Skill Alignment</p>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">Mapped to standard industry library</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-success">check_circle</span>
                </div>
              </div>
            </div>
          </div>

          {/* Skills Column */}
          <div className="lg:col-span-4 flex flex-col gap-stack-md">
            <div className="bg-surface-container-lowest p-stack-md rounded-xl border border-outline-variant shadow-sm flex flex-col gap-stack-sm min-h-[400px]">
              <h3 className="font-headline-md text-headline-md text-on-surface mb-2 flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">bolt</span>
                Expertise Tags
              </h3>
              
              <div className="flex flex-wrap gap-2 mb-6">
                {skills.map((skill, index) => (
                  <div key={index} className="bg-secondary-container text-on-secondary-container px-3 py-1.5 rounded-full font-label-sm flex items-center gap-2 group border border-outline-variant/30">
                    {skill}
                    <button onClick={() => removeSkill(skill)} className="hover:text-error transition-colors">
                      <span className="material-symbols-outlined text-xs">close</span>
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-auto relative">
                <label className="font-label-sm text-label-sm text-on-surface-variant mb-2 block">Add More Skills</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant">search</span>
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => { setNewSkill(e.target.value); setIsDropdownOpen(true); }}
                    onFocus={() => setIsDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setIsDropdownOpen(false), 150)}
                    placeholder="Search skills..."
                    className="w-full h-11 pl-10 pr-4 rounded-lg border border-outline-variant bg-surface-bright outline-none focus:border-primary transition-all"
                  />
                  {isDropdownOpen && filteredSkills.length > 0 && (
                    <div className="absolute z-50 w-full mt-2 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-xl max-h-48 overflow-y-auto">
                      {filteredSkills.map((skill, idx) => (
                        <button
                          key={idx}
                          onMouseDown={() => handleSkillSelect(skill)}
                          className="w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-surface-container-low transition-colors border-b border-outline-variant last:border-0"
                        >
                          {skill}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
        ) : (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            <section className="bg-emerald-50 border border-emerald-200 rounded-3xl p-12 text-center flex flex-col items-center gap-6 mb-stack-md shadow-sm">
              <div className="w-24 h-24 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-xl mb-4">
                <span className="material-symbols-outlined text-[48px]">verified</span>
              </div>
              <h1 className="font-headline-lg text-4xl font-black text-emerald-900">Profile Ready!</h1>
              <p className="text-emerald-700 text-lg max-w-xl font-medium">
                Excellent! Your profile is now calibrated. We've identified your expertise in <b>{sector}</b> with <b>{experience} years</b> of experience.
              </p>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md">
              <div className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant shadow-sm">
                <h3 className="font-bold text-lg mb-4 text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">contact_mail</span>
                  Identity
                </h3>
                <div className="space-y-3">
                  <p className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Name</p>
                  <p className="text-xl font-black text-on-surface">{name}</p>
                  <p className="text-sm font-bold text-on-surface-variant uppercase tracking-wider pt-2">Email</p>
                  <p className="text-lg font-bold text-primary">{email}</p>
                  <p className="text-sm font-bold text-on-surface-variant uppercase tracking-wider pt-2">Phone</p>
                  <p className="text-lg font-bold text-on-surface">{phone || 'Not Provided'}</p>
                </div>
              </div>

              <div className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant shadow-sm">
                <h3 className="font-bold text-lg mb-4 text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">stars</span>
                  Top Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {skills.slice(0, 8).map((s, i) => (
                    <span key={i} className="bg-surface-container px-3 py-1.5 rounded-lg text-sm font-black uppercase text-on-surface-variant border border-outline-variant/30">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Sticky Footer */}
      <footer className="fixed bottom-0 left-0 w-full bg-surface-container-lowest border-t border-outline-variant z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-sm flex justify-between items-center gap-4">
          <button 
            onClick={() => step === 'review' ? setStep('verify') : navigate('/onboarding')}
            className="px-6 h-12 border border-outline-variant text-on-surface-variant font-label-md rounded-lg hover:bg-surface-container-low transition-colors"
          >
            {step === 'review' ? 'Back to Edit' : 'Re-upload'}
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className={`px-12 h-12 bg-primary text-on-primary font-label-md rounded-lg shadow-md hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 ${
              isSaving ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isSaving ? (
              <>
                <span className="material-symbols-outlined animate-spin">refresh</span>
                {step === 'verify' ? 'Processing...' : 'Finalizing...'}
              </>
            ) : (
              <>
                {step === 'verify' ? 'Confirm Details' : 'Enter Dashboard'}
                <span className="material-symbols-outlined">{step === 'verify' ? 'arrow_forward' : 'dashboard'}</span>
              </>
            )}
          </button>
        </div>
      </footer>
    </div>
  );
}
