import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function DataIngestion() {
  const location = useLocation();
  const navigate = useNavigate();

  const userPicture = localStorage.getItem('user_picture');
  const userName = localStorage.getItem('user_name') || '';
  const userEmail = localStorage.getItem('user_id') || '';
  const userInitials = (userName || 'U').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const [cvText, setCvText] = useState('');
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cvText && !file) {
      alert('Please provide either a CV file or text.');
      return;
    }

    setIsProcessing(true);

    const formData = new FormData();
    if (cvText) formData.append('cv_text', cvText);
    if (file) formData.append('cv_file', file);
    
    try {
      const response = await fetch('http://localhost:8000/candidate/extract', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to extract data');
      }

      const data = await response.json();
      setIsProcessing(false);
      
      navigate('/profile', { 
        state: { 
          extractedData: data 
        } 
      });
    } catch (error) {
      console.error("Extraction error:", error);
      alert("Failed to extract data from CV. Ensure backend is running.");
      setIsProcessing(false);
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
          <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
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
            <span className="font-label-md text-label-md text-primary uppercase tracking-wider">Step 2 of 4</span>
            <span className="font-label-md text-label-md text-on-surface-variant">50% Complete</span>
          </div>
          <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
            <div className="h-full bg-primary w-1/2 rounded-full transition-all duration-500 shadow-sm"></div>
          </div>
          <div className="grid grid-cols-4 gap-2 mt-stack-sm">
            <div className="text-center font-label-sm text-label-sm text-primary font-medium">Account</div>
            <div className="text-center font-label-sm text-label-sm text-primary font-bold">Upload CV</div>
            <div className="text-center font-label-sm text-label-sm text-on-surface-variant font-medium">Fetching</div>
            <div className="text-center font-label-sm text-label-sm text-on-surface-variant font-medium">Review</div>
          </div>
        </section>

        {/* Header Section */}
        <section>
          <h2 className="font-headline-lg text-headline-lg text-on-surface mb-2">Complete Your Profile</h2>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
            Help us match you with the right opportunities by providing your professional details and uploading your latest resume.
          </p>
        </section>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-stack-md">
          {/* Left Column: Form */}
          <div className="lg:col-span-7 flex flex-col gap-stack-md">
            {/* Headline Section */}
            <div className="bg-surface-container-lowest p-stack-md rounded-xl border border-outline-variant shadow-sm flex flex-col gap-stack-sm">
              <h3 className="font-headline-md text-headline-md text-on-surface mb-2">Professional Summary</h3>
              <div className="flex flex-col gap-2">
                <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="cvText">Paste Raw Resume Text</label>
                <textarea
                  id="cvText"
                  value={cvText}
                  onChange={(e) => setCvText(e.target.value)}
                  placeholder="Paste your professional summary or full resume content here..."
                  rows="8"
                  className="w-full p-4 rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all bg-surface-bright resize-none font-body-sm leading-relaxed"
                ></textarea>
              </div>
            </div>
          </div>

          {/* Right Column: Upload Area */}
          <div className="lg:col-span-5">
            <div className="bg-surface-container-lowest p-stack-md rounded-xl border border-outline-variant shadow-sm flex flex-col gap-stack-md sticky top-24">
              <h3 className="font-headline-md text-headline-md text-on-surface">Documents</h3>
              
              <div 
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                className={`group relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-stack-lg transition-all cursor-pointer text-center ${
                  file ? 'border-primary bg-primary-container/5' : 'border-outline-variant hover:border-primary hover:bg-primary-container/5'
                }`}
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-stack-sm transition-transform group-hover:scale-110 ${
                  file ? 'bg-primary text-on-primary' : 'bg-secondary-container text-primary'
                }`}>
                  <span className="material-symbols-outlined text-[32px]">{file ? 'check_circle' : 'upload_file'}</span>
                </div>
                
                {file ? (
                  <>
                    <h4 className="font-body-lg text-body-lg text-on-surface font-semibold">{file.name}</h4>
                    <p className="font-body-sm text-body-sm text-primary mt-1 font-bold">File ready for processing</p>
                  </>
                ) : (
                  <>
                    <h4 className="font-body-lg text-body-lg text-on-surface font-semibold">Upload CV</h4>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-2 px-4">
                      Drag and drop your PDF or DOCX file here, or click to browse
                    </p>
                  </>
                )}
                
                <input
                  type="file"
                  accept=".pdf,.docx"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>

              <div className="flex flex-col gap-stack-sm">
                <p className="font-label-md text-label-md text-on-surface-variant">Recommended format</p>
                <div className="flex items-center gap-stack-sm p-stack-sm bg-surface-container-low rounded-lg">
                  <span className="material-symbols-outlined text-primary">description</span>
                  <div className="flex-1">
                    <p className="font-label-md text-label-md text-on-surface">Modern ATS-friendly PDF</p>
                    <p className="font-label-sm text-label-sm text-on-surface-variant text-xs">Easier for our system to parse details</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </main>

      {/* Sticky Footer Action */}
      <footer className="fixed bottom-0 left-0 w-full bg-surface-container-lowest border-t border-outline-variant z-50 shadow-[0_-4px_10_rgba(0,0,0,0.05)]">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-sm flex flex-col md:flex-row justify-between items-center gap-stack-sm">
          <div className="hidden md:block">
            <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">lock</span>
              Your data is encrypted and secure.
            </p>
          </div>
          <div className="flex w-full md:w-auto gap-4">
            <button 
              onClick={() => navigate('/browse')}
              className="flex-1 md:w-32 h-12 border border-outline-variant text-on-surface-variant font-label-md rounded-lg hover:bg-surface-container-low transition-colors"
            >
              Skip
            </button>
            <button 
              onClick={handleSubmit}
              disabled={isProcessing}
              className={`flex-[2] md:w-64 h-12 bg-primary text-on-primary font-label-md rounded-lg shadow-md hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 ${
                isProcessing ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isProcessing ? (
                <>
                  <span className="material-symbols-outlined animate-spin">refresh</span>
                  Extracting Data...
                </>
              ) : (
                <>
                  Save and Process
                  <span className="material-symbols-outlined">arrow_forward</span>
                </>
              )}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
