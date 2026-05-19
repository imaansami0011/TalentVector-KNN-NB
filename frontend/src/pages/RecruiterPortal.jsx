import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function RecruiterPortal() {
  const [jdText, setJdText] = useState('');
  const [jdFile, setJdFile] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [isScreening, setIsScreening] = useState(false);
  const [results, setResults] = useState(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const userPicture = localStorage.getItem('user_picture');
  const userName = localStorage.getItem('user_name') || 'Recruiter';
  const userInitials = userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const handleJdFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setJdFile(e.target.files[0]);
    }
  };

  const handleResumeChange = (e) => {
    if (e.target.files) {
      setResumes(Array.from(e.target.files));
    }
  };

  const handleScreen = async (e) => {
    e.preventDefault();
    if ((!jdText && !jdFile) || resumes.length === 0) {
      alert('Please provide a Job Description and at least one resume.');
      return;
    }

    setIsScreening(true);
    setResults(null);

    const formData = new FormData();
    if (jdText) formData.append('job_description', jdText);
    if (jdFile) formData.append('jd_file', jdFile);
    
    resumes.forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await fetch('http://localhost:8000/screen', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Screening failed');

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error("Screening error:", error);
      alert("Failed to screen resumes. Ensure backend is running.");
    } finally {
      setIsScreening(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface font-body text-on-surface flex flex-col">
      {/* TopAppBar */}
      <header className="bg-surface sticky top-0 z-50 flex justify-between items-center w-full px-margin-mobile py-base border-b border-outline-variant shadow-sm md:px-margin-desktop">
        <div className="flex items-center gap-4">
          <div className="font-headline-md text-headline-md font-bold text-primary tracking-tight">TALENT VECTOR</div>
          <div className="hidden md:flex items-center gap-2 bg-primary-container px-3 py-1 rounded-full text-xs font-bold text-primary">
            RECRUITER PORTAL
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-on-surface-variant cursor-pointer">settings</span>
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
        {/* Hero Section */}
        <section className="flex justify-between items-end">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">Recruiter Intelligence</h1>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
              Manage your job descriptions, source candidates privately, or discover global talent.
            </p>
          </div>
          <button 
            onClick={() => navigate('/sourcing')} 
            className="h-12 px-6 bg-primary text-on-primary rounded-xl font-bold flex items-center gap-2 shadow-lg hover:scale-105 transition-all"
          >
            <span className="material-symbols-outlined">add</span>
            New JD Analysis
          </button>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-stack-md items-start">
          {/* Config Column */}
          <div className="lg:col-span-5 flex flex-col gap-stack-md">
            <div className="bg-surface-container-lowest p-stack-md rounded-xl border border-outline-variant shadow-sm flex flex-col gap-stack-sm">
              <h3 className="font-headline-md text-headline-md text-on-surface mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">description</span>
                Job Description
              </h3>
              
              <textarea
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                placeholder="Paste JD requirements or upload a file below..."
                className="w-full p-4 h-48 rounded-lg border border-outline-variant bg-surface-bright outline-none focus:border-primary transition-all font-body-sm resize-none"
              />
              
              <div className="relative border-2 border-dashed border-outline-variant rounded-lg p-4 text-center hover:bg-primary-container/5 transition-all cursor-pointer">
                <span className="material-symbols-outlined text-primary mb-1">upload_file</span>
                <p className="font-label-sm text-label-sm">{jdFile ? jdFile.name : 'Upload JD File (PDF/DOCX)'}</p>
                <input type="file" onChange={handleJdFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>
            </div>

            <div className="bg-surface-container-lowest p-stack-md rounded-xl border border-outline-variant shadow-sm flex flex-col gap-stack-sm">
              <h3 className="font-headline-md text-headline-md text-on-surface mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">groups</span>
                Resume Batch
              </h3>
              
              <div className="relative border-2 border-dashed border-outline-variant rounded-lg p-8 text-center hover:bg-primary-container/5 transition-all cursor-pointer">
                <span className="material-symbols-outlined text-primary text-3xl mb-2">folder_zip</span>
                <h4 className="font-body-md text-body-md font-bold">{resumes.length > 0 ? `${resumes.length} Files Selected` : 'Drop Resumes Here'}</h4>
                <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">Select multiple PDF or DOCX files</p>
                <input type="file" multiple onChange={handleResumeChange} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>

              <button 
                onClick={handleScreen}
                disabled={isScreening}
                className={`w-full h-12 bg-primary text-on-primary font-label-md rounded-lg shadow-md hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 mt-4 ${
                  isScreening ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isScreening ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">sync</span>
                    Analyzing Resumes...
                  </>
                ) : (
                  <>
                    Start AI Screening
                    <span className="material-symbols-outlined">rocket_launch</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-7">
            {!results && !isScreening && (
              <div className="h-full min-h-[400px] border-2 border-dashed border-outline-variant rounded-xl flex flex-col items-center justify-center text-on-surface-variant p-stack-lg text-center bg-surface-container-low/30">
                <span className="material-symbols-outlined text-5xl mb-4 opacity-20">analytics</span>
                <h3 className="font-headline-md text-headline-md font-bold opacity-40">No Analysis Results</h3>
                <p className="font-body-sm text-body-sm max-w-xs mt-2 opacity-60">
                  Configure your job requirements and upload candidate resumes to see AI-ranked matches here.
                </p>
              </div>
            )}

            {isScreening && (
              <div className="space-y-4 animate-pulse">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-24 bg-surface-container-low rounded-xl border border-outline-variant"></div>
                ))}
              </div>
            )}

            {results && (
              <div className="flex flex-col gap-stack-sm animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="flex justify-between items-center mb-2 px-2">
                  <h3 className="font-headline-md text-headline-md text-on-surface">Top Candidates</h3>
                  <span className="bg-secondary-container px-3 py-1 rounded-full text-xs font-bold text-on-secondary-container">
                    Domain: {results.job_domain_detected}
                  </span>
                </div>

                {results.top_candidates.map((candidate, idx) => (
                  <div key={idx} className="bg-surface-container-lowest p-stack-md rounded-xl border border-outline-variant shadow-sm hover:border-primary/50 transition-all group flex items-center gap-6">
                    <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center font-bold text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors">
                      #{candidate.rank}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-headline-sm text-headline-sm text-on-surface font-bold">{candidate.name}</h4>
                          <p className="font-body-sm text-body-sm text-on-surface-variant">{candidate.email}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-primary font-bold text-xl">{candidate.match_score_percentage}%</div>
                          <p className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">Match Score</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mt-3">
                        <span className="bg-surface-container px-2 py-0.5 rounded text-[10px] font-bold text-on-surface-variant border border-outline-variant/30">
                          {candidate.experience_years} Years Exp
                        </span>
                        {candidate.skills_extracted.slice(0, 4).map((skill, sIdx) => (
                          <span key={sIdx} className="bg-primary-container/20 px-2 py-0.5 rounded text-[10px] font-bold text-primary border border-primary/10">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors">
                      download
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
