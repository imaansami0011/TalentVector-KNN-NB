import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';

export default function JDSourcing() {
  const [step, setStep] = useState(1); // 1: Upload JD, 2: Review Metadata, 3: Choose Track
  const [jdFile, setJdFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedJd, setExtractedJd] = useState(null);
  const [savedJdId, setSavedJdId] = useState(null);
  const [track, setTrack] = useState(null); // 'private' or 'global'
  const [searchResults, setSearchResults] = useState([]);
  
  const navigate = useNavigate();
  const userId = localStorage.getItem('user_id') || 'recruiter@company.com';

  const { register, handleSubmit, setValue, watch } = useForm();
  const coreSkills = watch("core_skills") || [];

  const handleJdUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setJdFile(file);
    setIsProcessing(true);

    const formData = new FormData();
    formData.append('jd_file', file);

    try {
      const response = await fetch('http://localhost:8000/recruiter/jd/extract', {
        method: 'POST',
        headers: { 'X-User-ID': userId },
        body: formData
      });

      if (!response.ok) throw new Error('Failed to extract JD');
      const data = await response.json();
      
      setExtractedJd(data);
      // Pre-fill form
      setValue("title", data.title);
      setValue("min_experience", data.min_experience);
      setValue("location_type", data.location_type);
      setValue("company_email", data.company_email);
      setValue("core_skills", data.core_skills);
      
      setStep(2);
    } catch (err) {
      alert("Error extracting JD: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const onSaveMetadata = async (data) => {
    setIsProcessing(true);
    try {
      const response = await fetch('http://localhost:8000/recruiter/jd/save', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-ID': userId 
        },
        body: JSON.stringify({ ...data, mode: data.location_type })
      });

      if (!response.ok) throw new Error('Failed to save JD');
      const result = await response.json();
      setSavedJdId(result.id);
      setStep(3);
    } catch (err) {
      alert("Error saving JD: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTrackSelection = async (selectedTrack) => {
    setTrack(selectedTrack);
    if (selectedTrack === 'global') {
      setIsProcessing(true);
      try {
        const response = await fetch(`http://localhost:8000/recruiter/screen/global?jd_id=${savedJdId}`, {
          headers: { 'X-User-ID': userId }
        });
        const data = await response.json();
        setSearchResults(data.candidates);
      } catch (err) {
        alert("Search failed");
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handlePrivateUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setIsProcessing(true);

    const formData = new FormData();
    formData.append('jd_id', savedJdId);
    files.forEach(f => formData.append('files', f));

    try {
      const response = await fetch('http://localhost:8000/recruiter/screen/private', {
        method: 'POST',
        headers: { 'X-User-ID': userId },
        body: formData
      });
      const data = await response.json();
      setSearchResults(data.candidates);
    } catch (err) {
      alert("Upload failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const sendInvite = async (email) => {
    try {
      await fetch(`http://localhost:8000/recruiter/candidates/invite?candidate_email=${email}&jd_id=${savedJdId}`, {
        method: 'POST',
        headers: { 'X-User-ID': userId }
      });
      alert("Invitation sent!");
    } catch (err) {
      alert("Failed to send invite");
    }
  };

  return (
    <div className="min-h-screen bg-surface font-body text-on-surface flex flex-col">
      <header className="bg-surface sticky top-0 z-50 flex justify-between items-center w-full px-margin-mobile py-base border-b border-outline-variant shadow-sm md:px-margin-desktop">
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-primary cursor-pointer" onClick={() => navigate(-1)}>arrow_back</span>
          <div className="font-headline-md text-headline-md font-bold text-primary tracking-tight">TALENT VECTOR</div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-12 flex flex-col gap-8">
        {/* Step Progress */}
        <div className="flex items-center gap-4">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= s ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'}`}>
                {s}
              </div>
              {s < 3 && <div className={`flex-1 h-1 ${step > s ? 'bg-primary' : 'bg-surface-container'}`} />}
            </React.Fragment>
          ))}
        </div>

        {/* Step 1: JD Upload */}
        {step === 1 && (
          <section className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-4xl font-bold text-on-surface">Upload Job Description</h1>
            <p className="text-on-surface-variant text-lg">Upload your JD to automatically extract key hiring metrics.</p>
            
            <div className="border-2 border-dashed border-outline-variant rounded-2xl p-16 flex flex-col items-center justify-center gap-4 hover:border-primary hover:bg-primary/5 transition-all cursor-pointer relative">
              <span className="material-symbols-outlined text-6xl text-primary">cloud_upload</span>
              <p className="font-medium text-lg">Click or drag JD file (PDF/Docx)</p>
              <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleJdUpload} />
              {isProcessing && <div className="mt-4 flex items-center gap-2 text-primary font-bold"><span className="animate-spin material-symbols-outlined">refresh</span> Extracting...</div>}
            </div>
          </section>
        )}

        {/* Step 2: Metadata Review (HITL) */}
        {step === 2 && (
          <section className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <h1 className="text-4xl font-bold">Review Extracted Data</h1>
            <p className="text-on-surface-variant">We've parsed your JD. Please verify or edit the details below.</p>
            
            <form onSubmit={handleSubmit(onSaveMetadata)} className="bg-surface-container-low p-8 rounded-2xl border border-outline-variant flex flex-col gap-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="font-bold text-sm uppercase">Job Title</label>
                  <input {...register("title")} className="h-12 px-4 rounded-lg bg-surface-bright border border-outline outline-none focus:border-primary" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-bold text-sm uppercase">Min. Experience (Years)</label>
                  <input type="number" {...register("min_experience")} className="h-12 px-4 rounded-lg bg-surface-bright border border-outline outline-none focus:border-primary" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-bold text-sm uppercase">Location Type</label>
                  <select {...register("location_type")} className="h-12 px-4 rounded-lg bg-surface-bright border border-outline outline-none focus:border-primary">
                    <option value="Onsite">Onsite</option>
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-bold text-sm uppercase">Company Email</label>
                  <input {...register("company_email")} className="h-12 px-4 rounded-lg bg-surface-bright border border-outline outline-none focus:border-primary" />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-bold text-sm uppercase">Core Skills</label>
                <div className="flex flex-wrap gap-2 p-4 bg-surface-bright border border-outline rounded-lg">
                  {coreSkills.map((s, idx) => (
                    <span key={idx} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                      {s}
                      <button type="button" onClick={() => setValue("core_skills", coreSkills.filter((_, i) => i !== idx))}><span className="material-symbols-outlined text-xs">close</span></button>
                    </span>
                  ))}
                  <input 
                    placeholder="Add skill..." 
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        setValue("core_skills", [...coreSkills, e.target.value]);
                        e.target.value = '';
                      }
                    }}
                    className="bg-transparent outline-none text-sm p-1"
                  />
                </div>
              </div>

              <button type="submit" disabled={isProcessing} className="h-14 bg-primary text-on-primary rounded-xl font-bold shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2">
                {isProcessing ? 'Saving...' : 'Finalize and Continue'}
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </form>
          </section>
        )}

        {/* Step 3: Choose Track */}
        {step === 3 && (
          <section className="flex flex-col gap-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <h1 className="text-4xl font-bold">Select Sourcing Strategy</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div 
                onClick={() => handleTrackSelection('private')}
                className={`p-8 rounded-3xl border-2 transition-all cursor-pointer flex flex-col gap-4 ${track === 'private' ? 'border-primary bg-primary/5' : 'border-outline-variant hover:border-primary/50'}`}
              >
                <div className="w-12 h-12 bg-secondary-container text-secondary rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined">folder_shared</span>
                </div>
                <h3 className="text-2xl font-bold">Private Bulk Upload</h3>
                <p className="text-on-surface-variant">Process your local CV files securely. Data remains private to your account.</p>
                {track === 'private' && (
                  <div className="mt-4 border-t border-outline-variant pt-4">
                    <label className="block w-full h-12 bg-primary text-on-primary rounded-lg flex items-center justify-center font-bold cursor-pointer hover:opacity-90">
                      Upload CVs
                      <input type="file" multiple className="hidden" onChange={handlePrivateUpload} />
                    </label>
                  </div>
                )}
              </div>

              <div 
                onClick={() => handleTrackSelection('global')}
                className={`p-8 rounded-3xl border-2 transition-all cursor-pointer flex flex-col gap-4 ${track === 'global' ? 'border-primary bg-primary/5' : 'border-outline-variant hover:border-primary/50'}`}
              >
                <div className="w-12 h-12 bg-primary-container text-primary rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined">public</span>
                </div>
                <h3 className="text-2xl font-bold">Global Talent Pool</h3>
                <p className="text-on-surface-variant">Search our database for public candidate profiles matching this JD.</p>
                {track === 'global' && isProcessing && <div className="mt-4 animate-pulse text-primary font-bold">Searching pool...</div>}
              </div>
            </div>

            {/* Results Display */}
            {searchResults.length > 0 && (
              <div className="flex flex-col gap-4 mt-8">
                <h2 className="text-2xl font-bold">Top 5 Matching Candidates</h2>
                <div className="flex flex-col gap-4">
                  {searchResults.map((c, idx) => (
                    <div key={idx} className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant flex justify-between items-center shadow-sm">
                      <div className="flex flex-col gap-1">
                        <h4 className="text-xl font-bold">{c.name}</h4>
                        <div className="flex gap-4 text-sm text-on-surface-variant font-medium">
                          <span>{c.experience_years} Years Exp</span>
                          <span className="text-primary font-bold">{c.match_score_percentage || (c.score * 100).toFixed(1)}% Match</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {(c.skills_extracted || c.entities?.Skills || []).slice(0, 5).map((s, i) => (
                            <span key={i} className="text-[10px] bg-surface-container px-2 py-0.5 rounded-full uppercase font-black">{s}</span>
                          ))}
                        </div>
                      </div>
                      <button 
                        onClick={() => sendInvite(c.email)}
                        className="h-10 px-6 bg-primary text-on-primary rounded-full font-bold hover:scale-105 transition-all flex items-center gap-2"
                      >
                        Invite to Interview
                        <span className="material-symbols-outlined text-sm">send</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
