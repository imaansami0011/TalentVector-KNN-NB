import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  Download,
  Share2,
  Sparkles,
  ExternalLink,
  Award,
  Loader2,
  X,
  ChevronRight,
  Copy
} from "lucide-react";
import { toast } from "sonner";

export default function ProfileShowcase() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  
  // Support both logged-in user and public share links via email query param
  const urlEmail = searchParams.get('email');
  const localEmail = localStorage.getItem('user_id') || '';
  const targetEmail = urlEmail || localEmail;

  const [profile, setProfile] = useState(null);
  const [showContactModal, setShowContactModal] = useState(false);

  const emailSubject = useMemo(() => {
    if (!profile) return '';
    const sector = profile.sector || 'Technology';
    return `Exciting Opportunity – ${sector} Role`;
  }, [profile]);

  const emailBody = useMemo(() => {
    if (!profile) return '';
    const candidateName = profile.name || 'there';
    const sector = profile.sector || 'Technology';
    const topSkills = (profile.skills || []).slice(0, 3).join(', ');
    return `Hi ${candidateName},

I came across your profile on Talent Vector and was really impressed by your background in ${sector}${topSkills ? ` and your expertise in ${topSkills}` : ''}.

We have an exciting opportunity that I believe aligns well with your experience and skill set. I'd love to schedule a quick call to discuss this further.

Would you be available for a brief conversation this week?

Looking forward to hearing from you.

Best regards,
[Your Name]
[Your Title]
[Company Name]`;
  }, [profile]);

  const handleCopyDraft = () => {
    if (!profile) return;
    const textToCopy = `To: ${profile.email}\nSubject: ${emailSubject}\n\n${emailBody}`;
    navigator.clipboard.writeText(textToCopy);
    toast.success("Draft email details copied to clipboard!");
  };

  useEffect(() => {
    if (!targetEmail) {
      navigate('/login');
      return;
    }
    fetchProfile();
  }, [targetEmail]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`http://localhost:8000/candidate/profile?email=${encodeURIComponent(targetEmail)}`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      } else {
        toast.error("Profile not found.");
      }
    } catch (error) {
      console.error("Fetch profile error:", error);
      toast.error("Failed to load profile details.");
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/profile-showcase?email=${encodeURIComponent(targetEmail)}`;
    navigator.clipboard.writeText(url);
    toast.success("Public profile link copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-display">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Loading Portfolio...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-display space-y-4">
        <h2 className="text-2xl font-black text-slate-800">Profile Unavailable</h2>
        <p className="text-sm text-slate-500 font-medium">We couldn't find a public showcase for this candidate.</p>
        <Link to="/browse" className="px-6 py-2.5 bg-primary text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md hover:scale-105 transition-all">
          Return Home
        </Link>
      </div>
    );
  }

  const avatarInitial = profile.name ? profile.name[0].toUpperCase() : "C";

  return (
    <div className="min-h-screen bg-white font-display text-slate-900 pb-20 selection:bg-primary/20">
      
      {/* Dynamic Mesh Hero Section */}
      <div className="relative pt-24 pb-32 px-6 overflow-hidden border-b border-slate-100 bg-slate-50/50">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-blue-400/5 to-emerald-400/10 opacity-70" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-20 -left-20 w-72 h-72 bg-emerald-400/10 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="relative max-w-5xl mx-auto flex flex-col md:flex-row items-center md:items-start gap-8 z-10">
          
          {/* Back Navigation Overlay (Absolute Top) */}
          <div className="absolute -top-16 left-0 flex w-full justify-between items-center">
            <button 
              onClick={() => navigate(-1)} 
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button 
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur border border-slate-200 text-slate-700 rounded-full hover:bg-slate-50 transition-all shadow-sm"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="text-[9px] font-black uppercase tracking-widest">Share Profile</span>
            </button>
          </div>

          {/* Premium Avatar */}
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl bg-white p-2 shadow-2xl shadow-primary/20 rotate-3 hover:rotate-0 transition-transform duration-500 shrink-0">
            <div className="w-full h-full rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center">
              <img 
                src={`https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(profile.name || profile.email)}`} 
                alt={profile.name}
                className="w-full h-full object-cover bg-primary/5"
              />
            </div>
          </div>

          {/* Core Info */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-3 pt-2">
            <div className="flex items-center gap-3">
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-none capitalize">
                {profile.name || "Candidate Showcase"}
              </h1>
              <div className="hidden sm:flex px-3 py-1 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-full items-center gap-1.5 shadow-sm">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="text-[9px] font-black uppercase tracking-widest">Open to Work</span>
              </div>
            </div>
            
            <p className="text-lg md:text-xl text-slate-500 font-medium tracking-tight">
              Specialized in <span className="font-bold text-primary">{profile.sector || "Technology"}</span>
            </p>
            
            {/* Contact Row */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <div className="flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-slate-300" />
                <span>{profile.email}</span>
              </div>
              {profile.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-slate-300" />
                  <span>{profile.phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-5xl mx-auto px-6 -mt-16 relative z-20 flex flex-col md:flex-row gap-8">
        
        {/* Left Column (Stats & CTAs) */}
        <div className="w-full md:w-1/3 flex flex-col gap-6">
          
          {/* Quick Metrics Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-200/40">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
              <Award className="w-4 h-4 text-primary" />
              Professional Metrics
            </h3>
            
            <div className="space-y-6">
              <div className="space-y-1">
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Total Experience</span>
                <p className="text-3xl font-black text-slate-800 leading-none">
                  {profile.total_experience} <span className="text-sm font-medium text-slate-400 capitalize">Years</span>
                </p>
              </div>
              <div className="h-px bg-slate-100 w-full" />
              <div className="space-y-1">
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Validated Skills</span>
                <p className="text-3xl font-black text-slate-800 leading-none">
                  {profile.skills?.length || 0} <span className="text-sm font-medium text-slate-400 capitalize">Core Competencies</span>
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => setShowContactModal(true)}
              className="w-full h-12 flex items-center justify-center gap-2 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-lg hover:bg-slate-800 transition-all hover:scale-[1.02]"
            >
              <Mail className="w-4 h-4" />
              Contact Candidate
            </button>
            
            <button 
              onClick={() => {
                if (profile.original_cv_path) {
                  window.open(`http://localhost:8000/${profile.original_cv_path}`, '_blank');
                } else {
                  toast.error("Original resume file not available for download.");
                }
              }}
              className="w-full h-12 flex items-center justify-center gap-2 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all"
            >
              <Download className="w-4 h-4" />
              Download Resume
            </button>
          </div>
        </div>

        {/* Right Column (Skills & Experience) */}
        <div className="w-full md:w-2/3 flex flex-col gap-8 pt-4 md:pt-0">
          
          {/* Skills Showcase */}
          <div>
            <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Core Competencies
            </h3>
            
            <div className="flex flex-wrap gap-2.5">
              {profile.skills && profile.skills.length > 0 ? (
                profile.skills.map((skill, idx) => (
                  <span 
                    key={idx} 
                    className="px-4 py-2 bg-primary/5 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary hover:text-white transition-colors cursor-default"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <p className="text-sm text-slate-400 italic">No skills documented yet.</p>
              )}
            </div>
          </div>

          <div className="h-px bg-slate-100 w-full" />

          {/* AI Extracted Highlights (Placeholder for future timeline) */}
          <div>
            <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary" />
              Experience Highlights
            </h3>
            
            <div className="space-y-6">
              <div className="relative pl-6 border-l-2 border-slate-100">
                <div className="absolute w-3 h-3 bg-primary rounded-full -left-[7px] top-1.5 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide">Domain Expertise</h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{profile.total_experience} Years</p>
                <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed">
                  Demonstrated extensive background and proven track record operating within the {profile.sector} sector. Analyzed via semantic extraction from the provided curriculum vitae.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Contact Platform Selector Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => setShowContactModal(false)}
          />
          
          {/* Modal Container */}
          <div className="relative bg-white/95 backdrop-blur-lg rounded-3xl p-6 md:p-8 shadow-[0_20px_70px_rgba(15,23,42,0.15)] border border-slate-200/80 w-full max-w-md animate-in zoom-in-95 fade-in duration-300 flex flex-col gap-6">
            
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display text-base font-extrabold text-slate-900 uppercase tracking-tight">
                    Contact Candidate
                  </h3>
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                    {profile.name}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowContactModal(false)}
                className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Candidate Details Mini Panel */}
            <div className="bg-slate-50/80 border border-slate-200/50 rounded-2xl p-4 space-y-2 text-xs font-semibold text-slate-600">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider w-16">To:</span>
                <span className="text-slate-800 font-bold select-all truncate">{profile.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider w-16">Subject:</span>
                <span className="text-slate-800 font-bold truncate">{emailSubject}</span>
              </div>
            </div>

            {/* Choose Platform Option list */}
            <div className="flex flex-col gap-3">
              <span className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">Choose platform</span>
              
              {/* Gmail Web */}
              <a 
                href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(profile.email)}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowContactModal(false)}
                className="flex items-center justify-between p-4 bg-red-50/30 hover:bg-red-50/60 border border-red-100 hover:border-red-200 rounded-2xl transition-all duration-300 group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 group-hover:scale-105 transition-transform font-bold text-xs uppercase">
                    G
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">Open in Gmail</h4>
                    <p className="text-[9px] text-slate-400 font-medium">Opens in new browser tab</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </a>

              {/* Outlook Web */}
              <a 
                href={`https://outlook.live.com/owa/?path=/mail/action/compose&to=${encodeURIComponent(profile.email)}&subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowContactModal(false)}
                className="flex items-center justify-between p-4 bg-blue-50/30 hover:bg-blue-50/60 border border-blue-100 hover:border-blue-200 rounded-2xl transition-all duration-300 group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-105 transition-transform font-bold text-xs uppercase">
                    O
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">Open in Outlook</h4>
                    <p className="text-[9px] text-slate-400 font-medium">Opens Outlook Web in new tab</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </a>

              {/* Default Mail Application */}
              <a 
                href={`mailto:${profile.email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowContactModal(false)}
                className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/60 hover:border-slate-300 rounded-2xl transition-all duration-300 group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:scale-105 transition-transform">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">Default Mail App</h4>
                    <p className="text-[9px] text-slate-400 font-medium">Opens native desktop or phone client</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </a>

              {/* Copy Draft & Copy Email */}
              <button 
                onClick={() => {
                  handleCopyDraft();
                  setShowContactModal(false);
                }}
                className="flex items-center justify-between p-4 bg-emerald-50/30 hover:bg-emerald-50/60 border border-emerald-100 hover:border-emerald-200 rounded-2xl transition-all duration-300 group cursor-pointer text-left w-full"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-105 transition-transform">
                    <Copy className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">Copy Template Info</h4>
                    <p className="text-[9px] text-slate-400 font-medium">Copies address & draft to clipboard</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
