import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { predefinedSkills } from '../skillsData';

export default function UserProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  
  const userEmail = localStorage.getItem('user_id') || '';
  const userPicture = localStorage.getItem('user_picture');
  const userName = localStorage.getItem('user_name') || 'User';

  // Profile State
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    sector: 'Technology',
    raw_category: '',
    total_experience: 0,
    skills: [],
    original_cv_path: ''
  });

  const [newSkill, setNewSkill] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`http://localhost:8000/candidate/profile?email=${userEmail}`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    } catch (error) {
      console.error("Fetch profile error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsExtracting(true);
    const formData = new FormData();
    formData.append('cv_file', file);

    try {
      const response = await fetch('http://localhost:8000/candidate/extract', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        setProfile(prev => ({
          ...prev,
          sector: data.detected_sector || 'General',
          raw_category: data.detected_raw_category || '',
          total_experience: data.detected_experience || prev.total_experience,
          skills: data.detected_skills || [],
          original_cv_path: data.original_cv_path
        }));
      }
    } catch (error) {
      console.error("Extraction error:", error);
    } finally {
      setIsExtracting(false);
    }
  };

  const removeSkill = (skillToRemove) => {
    setProfile(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skillToRemove)
    }));
  };

  const handleSkillSelect = (skill) => {
    if (!profile.skills.includes(skill)) {
      setProfile(prev => ({
        ...prev,
        skills: [...prev.skills, skill]
      }));
    }
    setNewSkill('');
    setIsDropdownOpen(false);
  };

  const [showSuccess, setShowSuccess] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    setShowSuccess(false);
    
    try {
      const response = await fetch('http://localhost:8000/candidate/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      
      if (response.ok) {
        setIsSaving(false);
        setShowSuccess(true);
        // Hide notification after 1.2 seconds for a snappier feel
        setTimeout(() => setShowSuccess(false), 1200);
      }
    } catch (error) {
      console.error("Save error:", error);
      setIsSaving(false);
      alert("Failed to save changes. Please try again.");
    }
  };

  const filteredPredefinedSkills = predefinedSkills.filter(s => 
    s.toLowerCase().includes(newSkill.toLowerCase()) && !profile.skills.includes(s)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-on-surface-variant font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface font-body text-on-surface pb-32">
      {/* Header */}
      <header className="bg-surface sticky top-0 z-50 flex justify-between items-center w-full px-margin-mobile py-base border-b border-outline-variant shadow-sm">
        <div className="flex items-center gap-4">
          <Link to="/browse" className="text-primary hover:bg-surface-container-low p-2 rounded-full transition-all">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className="font-headline text-headline-md font-bold text-primary">MANAGE PROFILE</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <Link 
            to="/profile-showcase"
            className="px-6 py-2 bg-white text-primary border border-primary/20 rounded-lg font-bold shadow-sm hover:bg-primary/5 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">visibility</span>
            View Showcase
          </Link>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className={`px-6 py-2 bg-primary text-on-primary rounded-lg font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2 ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <span className="material-symbols-outlined text-sm">save</span>
            )}
            Save Changes
          </button>
        </div>
      </header>

      <main className="max-w-[1024px] mx-auto px-margin-mobile md:px-margin-desktop py-stack-md animate-fadeIn">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-stack-md">
          {/* Sidebar: Profile Card & CV Upload */}
          <div className="lg:col-span-4 flex flex-col gap-stack-md">
            <div className="bg-surface-container-lowest p-stack-md rounded-xl border border-outline-variant shadow-sm flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full border-4 border-white shadow-xl overflow-hidden mb-4">
                {userPicture ? <img src={userPicture} alt="Avatar" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-primary-fixed flex items-center justify-center text-primary text-3xl font-bold">{userName[0]}</div>}
              </div>
              <h2 className="font-headline text-headline-md font-bold text-on-surface">{profile.name || userName}</h2>
              <p className="text-on-surface-variant text-sm mb-4">{profile.email}</p>
              <div className="w-full h-px bg-outline-variant mb-4"></div>
              <div className="flex flex-col gap-2 w-full text-left">
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <span className="material-symbols-outlined text-sm">work</span>
                  <span className="text-sm font-medium">{profile.sector} Expert</span>
                </div>
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <span className="material-symbols-outlined text-sm">history</span>
                  <span className="text-sm font-medium">{profile.total_experience} Years Exp.</span>
                </div>
                {profile.raw_category && (
                  <div className="flex items-center gap-2 text-primary font-bold mt-2 pt-2 border-t border-outline-variant/30">
                    <span className="material-symbols-outlined text-sm text-primary animate-pulse">psychology</span>
                    <span className="text-xs uppercase tracking-wider">ML Predicted: {profile.raw_category}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-surface-container-lowest p-stack-md rounded-xl border border-outline-variant shadow-sm flex flex-col gap-4">
              <h3 className="font-label-lg font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-sm">upload_file</span>
                Update Resume
              </h3>
              <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-primary/20 rounded-xl cursor-pointer hover:bg-primary/5 hover:border-primary transition-all group relative overflow-hidden">
                {isExtracting ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-[10px] font-black text-primary animate-pulse tracking-widest">EXTRACTING DATA...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center px-6">
                    <div className="w-12 h-12 bg-primary-fixed rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-primary">add_circle</span>
                    </div>
                    <p className="text-xs font-black text-on-surface uppercase tracking-widest">Upload New CV</p>
                    <p className="text-[10px] text-on-surface-variant mt-1">PDF or DOCX (Max 10MB)</p>
                  </div>
                )}
                <input type="file" className="hidden" accept=".pdf,.docx" onChange={handleFileUpload} disabled={isExtracting} />
              </label>
            </div>
          </div>

          {/* Main Content: Edit Form */}
          <div className="lg:col-span-8 flex flex-col gap-stack-md">
            <div className="bg-surface-container-lowest p-stack-md rounded-xl border border-outline-variant shadow-sm">
              <h3 className="font-headline-sm text-headline-sm text-on-surface mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">edit_square</span>
                Core Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md">
                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-label-md text-on-surface-variant">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={profile.name}
                    onChange={handleInputChange}
                    className="w-full h-11 px-4 rounded-lg border border-outline-variant focus:border-primary outline-none transition-all bg-surface-bright font-medium text-sm"
                  />
                </div>
                <div className="flex flex-col gap-2 opacity-60">
                  <label className="font-label-md text-label-md text-on-surface-variant">Email (Read Only)</label>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full h-11 px-4 rounded-lg border border-outline-variant bg-surface-container outline-none font-medium text-sm"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-label-md text-on-surface-variant">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={profile.phone}
                    onChange={handleInputChange}
                    placeholder="+91 98765 43210"
                    className="w-full h-11 px-4 rounded-lg border border-outline-variant focus:border-primary outline-none transition-all bg-surface-bright font-medium text-sm"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-label-md text-on-surface-variant">Experience (Years)</label>
                  <input
                    type="number"
                    name="total_experience"
                    value={profile.total_experience}
                    onChange={handleInputChange}
                    className="w-full h-11 px-4 rounded-lg border border-outline-variant focus:border-primary outline-none transition-all bg-surface-bright font-medium text-sm"
                  />
                </div>
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="font-label-md text-label-md text-on-surface-variant">Professional Sector</label>
                  <select
                    name="sector"
                    value={profile.sector}
                    onChange={handleInputChange}
                    className="w-full h-11 px-4 rounded-lg border border-outline-variant focus:border-primary outline-none transition-all bg-surface-bright font-medium text-sm"
                  >
                    {['Technology', 'Healthcare', 'Finance', 'Education', 'Sales', 'Management', 'Legal', 'General'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-stack-md rounded-xl border border-outline-variant shadow-sm">
              <h3 className="font-headline-sm text-headline-sm text-on-surface mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">bolt</span>
                Expertise & Skills
              </h3>
              
              <div className="flex flex-wrap gap-2 mb-6 min-h-[100px] p-4 bg-surface-container-low/50 rounded-xl border border-outline-variant/20 shadow-inner">
                {profile.skills.map((skill, index) => (
                  <div key={index} className="bg-white text-on-surface px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 border border-outline-variant/20 shadow-sm hover:border-primary transition-all w-fit h-fit leading-none">
                    {skill}
                    <button onClick={() => removeSkill(skill)} className="text-outline hover:text-error transition-colors flex items-center p-0">
                      <span className="material-symbols-outlined text-[11px] leading-none" style={{ fontVariationSettings: "'wght' 700" }}>close</span>
                    </button>
                  </div>
                ))}
                {profile.skills.length === 0 && <p className="text-on-surface-variant text-xs italic opacity-60">No skills added yet. Upload a CV or search below.</p>}
              </div>

              <div className="relative">
                <label className="font-label-sm text-label-sm text-on-surface-variant mb-2 block font-bold uppercase tracking-widest text-[8px]">Search & Add Skills</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-sm">search</span>
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => { setNewSkill(e.target.value); setIsDropdownOpen(true); }}
                    onFocus={() => setIsDropdownOpen(true)}
                    placeholder="Search standard skills..."
                    className="w-full h-10 pl-10 pr-4 rounded-lg border border-outline-variant bg-surface-bright outline-none focus:border-primary transition-all text-sm"
                  />
                  {isDropdownOpen && filteredPredefinedSkills.length > 0 && (
                    <>
                      <div className="fixed inset-0 z-[90]" onClick={() => setIsDropdownOpen(false)}></div>
                      <div className="absolute z-[100] w-full bottom-full mb-2 bg-white border border-outline-variant rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] max-h-60 overflow-y-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="p-2 border-b border-outline-variant bg-surface-container-low text-[10px] font-black uppercase tracking-widest text-on-surface-variant px-4">
                          Suggested Skills
                        </div>
                        {filteredPredefinedSkills.map((skill, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSkillSelect(skill)}
                            className="w-full text-left px-5 py-3 text-[11px] font-bold uppercase tracking-wide hover:bg-primary/5 hover:text-primary transition-colors border-b border-outline-variant/50 last:border-0"
                          >
                            {skill}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Premium Success Notification */}
      {showSuccess && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-on-surface/20 backdrop-blur-sm animate-in fade-in duration-300"></div>
          <div className="relative bg-white rounded-[2rem] p-8 shadow-[0_20px_70px_rgba(0,0,0,0.2)] flex flex-col items-center gap-4 animate-in zoom-in-95 fade-in duration-300">
            <div className="w-20 h-20 bg-success-container text-success rounded-full flex items-center justify-center shadow-lg animate-bounce">
              <span className="material-symbols-outlined text-[48px]" style={{ fontVariationSettings: "'wght' 700" }}>check_circle</span>
            </div>
            <div className="text-center">
              <h3 className="font-headline text-xl font-black text-on-surface">Changes Saved</h3>
              <p className="text-on-surface-variant text-sm font-medium">Your profile is now synchronized</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
