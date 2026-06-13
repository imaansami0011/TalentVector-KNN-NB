import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
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
  Globe,
  Code2,
  Zap,
  TrendingUp,
  Clock,
  CheckCircle2,
  Star,
  Copy,
  Layers,
  Target,
  BarChart3,
  ChevronRight,
  X,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { Button } from '../components/ui/button';

export const Route = createFileRoute('/profile-showcase')({
  component: ProfileShowcase,
})

function ProfileShowcase() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  
  // Support both logged-in user and public share links via email query param
  const urlEmail = new URLSearchParams(window.location.search).get('email');
  const localEmail = localStorage.getItem('user_id') || '';
  const userPicture = localStorage.getItem('user_picture');
  const targetEmail = urlEmail || localEmail;
  const userRole = localStorage.getItem('user_role') || '';

  const [profile, setProfile] = useState(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedJdId, setSelectedJdId] = useState("");
  const [jds, setJds] = useState([]);
  const [isLoadingJds, setIsLoadingJds] = useState(false);
  const [isSendingInvite, setIsSendingInvite] = useState(false);

  const fetchJds = async () => {
    setIsLoadingJds(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/recruiter/jds`, {
        headers: {
          "x-user-id": localStorage.getItem("user_id") ?? "",
          "Authorization": `Bearer ${localStorage.getItem("access_token")}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setJds(data);
        if (data.length > 0) {
          setSelectedJdId(data[0].id);
        }
      } else {
        toast.error("Failed to fetch job pipelines.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error loading job pipelines.");
    } finally {
      setIsLoadingJds(false);
    }
  };

  const handleSendInvite = async () => {
    setIsSendingInvite(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/recruiter/candidates/${profile.id || profile._id}/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": localStorage.getItem("user_id") ?? "",
          "Authorization": `Bearer ${localStorage.getItem("access_token")}`
        },
        body: JSON.stringify({ jd_id: selectedJdId }),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(data.message || "Invitation email sent successfully!");
        setShowInviteModal(false);
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.detail || "Failed to send invitation");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error sending invitation.");
    } finally {
      setIsSendingInvite(false);
    }
  };

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
      navigate({ to: '/login' });
      return;
    }
    fetchProfile();
  }, [targetEmail]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/candidate/profile?email=${encodeURIComponent(targetEmail)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem("access_token")}`
        }
      });
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
    setCopied(true);
    toast.success("Public profile link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  // Categorize skills into groups for better visualization
  const skillCategories = useMemo(() => {
    if (!profile?.skills?.length) return {};
    
    const frontendKeywords = ['react', 'vue', 'angular', 'html', 'css', 'sass', 'tailwind', 'next', 'svelte', 'typescript', 'javascript', 'jquery', 'bootstrap', 'redux', 'graphql'];
    const backendKeywords = ['node', 'express', 'django', 'flask', 'fastapi', 'spring', 'java', 'python', 'ruby', 'go', 'rust', 'php', 'laravel', 'c#', '.net', 'asp'];
    const dbKeywords = ['mongodb', 'mysql', 'postgresql', 'redis', 'firebase', 'dynamodb', 'sql', 'oracle', 'sqlite', 'cassandra', 'elasticsearch'];
    const devopsKeywords = ['docker', 'kubernetes', 'aws', 'azure', 'gcp', 'ci/cd', 'jenkins', 'terraform', 'linux', 'nginx', 'git'];
    const dataKeywords = ['machine learning', 'deep learning', 'tensorflow', 'pytorch', 'pandas', 'numpy', 'data', 'analytics', 'power bi', 'tableau', 'r', 'statistics'];
    
    const categories = {};
    
    profile.skills.forEach(skill => {
      const lower = skill.toLowerCase();
      if (frontendKeywords.some(k => lower.includes(k))) {
        if (!categories['Frontend']) categories['Frontend'] = [];
        categories['Frontend'].push(skill);
      } else if (backendKeywords.some(k => lower.includes(k))) {
        if (!categories['Backend']) categories['Backend'] = [];
        categories['Backend'].push(skill);
      } else if (dbKeywords.some(k => lower.includes(k))) {
        if (!categories['Databases']) categories['Databases'] = [];
        categories['Databases'].push(skill);
      } else if (devopsKeywords.some(k => lower.includes(k))) {
        if (!categories['DevOps & Cloud']) categories['DevOps & Cloud'] = [];
        categories['DevOps & Cloud'].push(skill);
      } else if (dataKeywords.some(k => lower.includes(k))) {
        if (!categories['Data & ML']) categories['Data & ML'] = [];
        categories['Data & ML'].push(skill);
      } else {
        if (!categories['Other Skills']) categories['Other Skills'] = [];
        categories['Other Skills'].push(skill);
      }
    });
    
    return categories;
  }, [profile?.skills]);

  const categoryIcons = {
    'Frontend': <Globe className="w-3.5 h-3.5" />,
    'Backend': <Code2 className="w-3.5 h-3.5" />,
    'Databases': <Layers className="w-3.5 h-3.5" />,
    'DevOps & Cloud': <Zap className="w-3.5 h-3.5" />,
    'Data & ML': <BarChart3 className="w-3.5 h-3.5" />,
    'Other Skills': <Star className="w-3.5 h-3.5" />,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center font-display">
        <div className="flex flex-col items-center gap-5">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
            <div className="absolute -inset-4 bg-primary/5 rounded-3xl blur-xl animate-pulse" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Loading Portfolio</p>
            <p className="text-[10px] text-slate-300 font-medium">Fetching candidate showcase...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center font-display space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center">
          <Briefcase className="w-10 h-10 text-slate-300" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Profile Unavailable</h2>
          <p className="text-sm text-slate-500 font-medium max-w-sm">We couldn't find a public showcase for this candidate. They may not have set up their profile yet.</p>
        </div>
        <Link to="/browse" className="px-8 py-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg hover:scale-105 transition-all">
          Browse Candidates
        </Link>
      </div>
    );
  }

  const avatarUrl = (targetEmail === localEmail && userPicture) 
    ? userPicture 
    : `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(profile.name || profile.email)}`;

  const experienceLevel = profile.total_experience >= 8 
    ? "Senior" 
    : profile.total_experience >= 4 
      ? "Mid-Level" 
      : profile.total_experience >= 1 
        ? "Junior" 
        : "Entry-Level";

  const experienceColor = profile.total_experience >= 8 
    ? "text-amber-600 bg-amber-50 border-amber-200" 
    : profile.total_experience >= 4 
      ? "text-blue-600 bg-blue-50 border-blue-200" 
      : "text-emerald-600 bg-emerald-50 border-emerald-200";

  return (
    <div className="min-h-screen bg-background font-display text-foreground selection:bg-primary/20">
      
      {/* ===== HERO SECTION ===== */}
      <div className="relative overflow-hidden">
        {/* Multi-layer animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(99,102,241,0.15),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(16,185,129,0.1),transparent_60%)]" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/8 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/8 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4" />
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.03)_1px,transparent_1px)] bg-[size:64px_64px]" />

        {/* Navigation */}
        <div className="relative z-20 w-full max-w-none px-10 md:px-20 xl:px-32 pt-6">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => navigate({ to: ".." })} 
              className="group flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs md:text-sm font-extrabold uppercase tracking-wider text-white border border-white/10 w-fit hover:shadow-md cursor-pointer transition-all duration-300"
            >
              <ArrowLeft className="w-4.5 h-4.5 text-white/80 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back</span>
            </button>
            <button 
              onClick={handleShare}
              className="group flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-md border border-white/10 text-white rounded-xl hover:bg-white/20 transition-all cursor-pointer"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Share Profile</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 w-full max-w-none px-10 md:px-20 xl:px-32 pt-12 pb-32">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-8">
            
            {/* Avatar */}
            <div className="relative group">
              <div className="absolute -inset-2 bg-gradient-to-br from-primary/40 to-emerald-500/30 rounded-[2rem] blur-xl opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative w-36 h-36 md:w-44 md:h-44 rounded-[1.75rem] bg-white/10 backdrop-blur p-1.5 border border-white/20 shadow-2xl">
                <div className="w-full h-full rounded-[1.4rem] overflow-hidden bg-slate-700">
                  <img 
                    src={avatarUrl} 
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              {/* Status dot */}
              <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-500 rounded-xl border-[3px] border-slate-900 flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              </div>
            </div>

            {/* Identity */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-4 pb-2">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-none capitalize">
                  {profile.name || "Candidate"}
                </h1>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/15 border border-emerald-400/30 text-emerald-400 rounded-full">
                  <Sparkles className="w-3 h-3" />
                  <span className="text-[8px] font-black uppercase tracking-widest">Open to Work</span>
                </div>
              </div>
              
              <p className="text-base md:text-lg text-white/50 font-medium tracking-tight">
                {experienceLevel} {profile.sector || "Technology"} Professional
                <span className="mx-2 text-white/20">·</span>
                <span className="text-white/40">{profile.total_experience}+ years experience</span>
              </p>
              
              {/* Contact row */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-[11px] font-bold text-white/40">
                <a href={`mailto:${profile.email}`} className="flex items-center gap-1.5 hover:text-primary transition-colors group">
                  <Mail className="w-3.5 h-3.5 text-white/25 group-hover:text-primary transition-colors" />
                  <span>{profile.email}</span>
                </a>
                {profile.phone && profile.phone !== "Not Found" && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-white/25" />
                    <span>{profile.phone}</span>
                  </div>
                )}
                {profile.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-white/25" />
                    <span>{profile.location}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="w-full max-w-none px-10 md:px-20 xl:px-32 -mt-20 relative z-20">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
              
              {/* ===== LEFT SIDEBAR ===== */}
              <div className="w-full lg:w-80 shrink-0 flex flex-col gap-5">
                
                {/* Stats Card */}
                <div className="bg-white rounded-[1.75rem] p-6 border border-slate-200/80 shadow-xl shadow-slate-200/50">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-5 flex items-center gap-2">
                    <Award className="w-4 h-4 text-primary" />
                    Professional Metrics
                  </h3>
                  
                  <div className="space-y-5">
                    {/* Experience */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Total Experience</span>
                        <p className="text-3xl font-black text-slate-800 leading-none">
                          {profile.total_experience}<span className="text-sm font-medium text-slate-400 ml-1">yrs</span>
                        </p>
                      </div>
                      <div className={`px-3 py-1.5 rounded-xl border text-[8px] font-black uppercase tracking-widest ${experienceColor}`}>
                        {experienceLevel}
                      </div>
                    </div>

                    <div className="h-px bg-slate-100" />

                    {/* Skills Count */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Tech Stack</span>
                        <p className="text-3xl font-black text-slate-800 leading-none">
                          {profile.skills?.length || 0}<span className="text-sm font-medium text-slate-400 ml-1">skills</span>
                        </p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center">
                        <Code2 className="w-5 h-5 text-primary" />
                      </div>
                    </div>

                    <div className="h-px bg-slate-100" />

                    {/* Sector */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Domain</span>
                        <p className="text-base font-black text-slate-800 leading-none capitalize">
                          {profile.sector || "Technology"}
                        </p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/8 flex items-center justify-center">
                        <Target className="w-5 h-5 text-emerald-600" />
                      </div>
                    </div>

                    <div className="h-px bg-slate-100" />

                    {/* Skill Categories */}
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Skill Areas</span>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {Object.keys(skillCategories).map(cat => (
                          <span key={cat} className="px-2.5 py-1 bg-slate-50 border border-slate-100 text-[8px] font-black uppercase tracking-wider text-slate-500 rounded-lg">
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3">
                  {userRole !== 'candidate' && (
                    <button 
                      onClick={() => setShowContactModal(true)}
                      className="group relative w-full h-13 flex items-center justify-center gap-2.5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-slate-900/20 hover:shadow-2xl hover:shadow-slate-900/30 hover:scale-[1.02] active:scale-[0.98] transition-all overflow-hidden cursor-pointer"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/25 via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 translate-x-[-100%] group-hover:translate-x-[100%]" style={{transition: 'transform 1s, opacity 0.5s'}} />
                      <Mail className="w-4 h-4 relative z-10" />
                      <span className="relative z-10">Contact Candidate</span>
                    </button>
                  )}
                  
                  <button 
                    onClick={() => {
                      if (profile.original_cv_path) {
                        window.open(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/${profile.original_cv_path}`, '_blank');
                      } else {
                        toast.error("Original resume file not available for download.");
                      }
                    }}
                    className="w-full h-12 flex items-center justify-center gap-2.5 bg-white text-slate-700 border border-slate-200 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    Download Resume
                  </button>

                  <button 
                    onClick={handleShare}
                    className="w-full h-12 flex items-center justify-center gap-2.5 bg-white text-slate-500 border border-slate-200 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copy Profile Link
                  </button>
                </div>
              </div>

              {/* ===== RIGHT CONTENT ===== */}
              <div className="flex-1 flex flex-col gap-6 min-w-0">
                
                {/* Core Competencies Card */}
                <div className="bg-white rounded-[1.75rem] p-8 border border-slate-200/80 shadow-xl shadow-slate-200/50">
                  <h3 className="text-base font-black text-slate-900 mb-6 flex items-center gap-2.5 uppercase tracking-tight">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                    Skills
                  </h3>
                  
                  {profile.skills && profile.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.map((skill, idx) => (
                        <span 
                          key={idx} 
                          className="group px-4 py-2 bg-primary/5 border border-primary/15 text-primary text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary hover:text-white hover:border-primary hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 transition-all duration-200 cursor-default select-none"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="py-10 text-center">
                      <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
                        <Code2 className="w-7 h-7 text-slate-300" />
                      </div>
                      <p className="text-sm text-slate-400 font-bold">No skills documented yet</p>
                      <p className="text-xs text-slate-300 mt-1">Upload a resume to auto-extract skills</p>
                    </div>
                  )}
                </div>

                {/* Experience Highlights */}
                <div className="bg-white rounded-[1.75rem] p-8 border border-slate-200/80 shadow-xl shadow-slate-200/50">
                  <h3 className="text-base font-black text-slate-900 mb-6 flex items-center gap-2.5 uppercase tracking-tight">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <Briefcase className="w-4 h-4 text-blue-600" />
                    </div>
                    Experience & Background
                  </h3>
                  
                  <div className="space-y-0">
                    {/* Domain Expertise Entry */}
                    <div className="relative pl-8 pb-8 border-l-2 border-slate-100 last:pb-0">
                      <div className="absolute w-4 h-4 bg-primary rounded-lg -left-[9px] top-0.5 shadow-lg shadow-primary/30 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                      </div>
                      <div className="space-y-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide">{profile.sector || "Technology"} Domain Specialist</h4>
                          <span className={`px-2.5 py-0.5 rounded-lg border text-[8px] font-black uppercase tracking-widest ${experienceColor}`}>
                            {experienceLevel}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{profile.total_experience} {profile.total_experience === 1 ? 'Year' : 'Years'}</span>
                          </div>
                          <div className="w-1 h-1 rounded-full bg-slate-200" />
                          <div className="flex items-center gap-1">
                            <Target className="w-3 h-3" />
                            <span>{profile.sector || "Technology"}</span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-xl">
                          Demonstrated extensive background and proven track record operating within the {profile.sector || "Technology"} sector with proficiency across {profile.skills?.length || 0} core technologies. Profile analyzed via AI-powered semantic extraction from the provided curriculum vitae.
                        </p>
                      </div>
                    </div>

                    {/* Skills Mastery Entry */}
                    <div className="relative pl-8 pb-8 border-l-2 border-slate-100 last:pb-0">
                      <div className="absolute w-4 h-4 bg-emerald-500 rounded-lg -left-[9px] top-0.5 shadow-lg shadow-emerald-500/30 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                      </div>
                      <div className="space-y-2.5">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide">Technical Stack Overview</h4>
                        <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <div className="flex items-center gap-1">
                            <Code2 className="w-3 h-3" />
                            <span>{profile.skills?.length || 0} Technologies</span>
                          </div>
                          <div className="w-1 h-1 rounded-full bg-slate-200" />
                          <div className="flex items-center gap-1">
                            <Layers className="w-3 h-3" />
                            <span>{Object.keys(skillCategories).length} Domains</span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-xl">
                          Proficient across {Object.keys(skillCategories).length > 0 ? Object.keys(skillCategories).join(', ') : 'multiple technology domains'}. 
                          Key strengths include {profile.skills?.slice(0, 3).join(', ')}{profile.skills?.length > 3 ? `, and ${profile.skills.length - 3} more technologies` : ''}.
                        </p>
                        
                        {/* Mini skill bars */}
                        <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 pt-2 max-w-lg">
                          {Object.entries(skillCategories).slice(0, 4).map(([cat, skills]) => (
                            <div key={cat} className="space-y-1">
                              <div className="flex items-center gap-2 justify-between">
                                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">{cat}</span>
                                <span className="text-[8px] font-bold text-slate-300">{skills.length}</span>
                              </div>
                              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-700"
                                  style={{ width: `${Math.min((skills.length / (profile.skills?.length || 1)) * 100 * 2.5, 100)}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Profile Visibility */}
                    <div className="relative pl-8 border-l-2 border-slate-100">
                      <div className="absolute w-4 h-4 bg-amber-500 rounded-lg -left-[9px] top-0.5 shadow-lg shadow-amber-500/30 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                      </div>
                      <div className="space-y-2.5">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide">Profile Status</h4>
                        <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <div className="flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            <span>{profile.visibility === 'public' ? 'Public Profile' : 'Verified Candidate'}</span>
                          </div>
                          <div className="w-1 h-1 rounded-full bg-slate-200" />
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            <span>Active Job Seeker</span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-xl">
                          This candidate's profile is actively visible to recruiters and hiring teams. Available for new opportunities in the {profile.sector || "Technology"} sector.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Powered by Badge */}
                <div className="flex items-center justify-center gap-2 py-4 text-[9px] font-black uppercase tracking-[0.3em] text-slate-300">
                  <Sparkles className="w-3 h-3" />
                  <span>AI-Powered Profile by Talent Vector</span>
                </div>
              </div>

            </div>
      </div>
      
      {/* Bottom spacer */}
      <div className="h-16" />

      {/* Contact Platform Selector Modal */}
      {showContactModal && createPortal(
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

              {/* Automated Send Invite */}
              <button 
                onClick={() => {
                  setShowContactModal(false);
                  fetchJds();
                  setShowInviteModal(true);
                }}
                className="flex items-center justify-between p-4 bg-violet-50/40 hover:bg-violet-50/80 border border-violet-100 hover:border-violet-200 rounded-2xl transition-all duration-300 group cursor-pointer text-left w-full"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-500 group-hover:scale-105 transition-transform">
                    <Sparkles className="w-4 h-4 text-violet-500 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">Send Email for Interview</h4>
                    <p className="text-[9px] text-slate-400 font-medium">Automated & branded invitation email</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
              
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
        </div>,
        document.body
      )}

      {/* Automated Invite Modal */}
      {showInviteModal && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => {
              if (!isSendingInvite) setShowInviteModal(false)
            }}
          />
          
          {/* Modal Container */}
          <div className="relative bg-white/95 backdrop-blur-lg rounded-3xl p-6 md:p-8 shadow-[0_20px_70px_rgba(15,23,42,0.15)] border border-slate-200/80 w-full max-w-lg animate-in zoom-in-95 fade-in duration-300 flex flex-col gap-6 text-left">
            
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white shadow-md">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-display text-base font-extrabold text-slate-900 uppercase tracking-tight">
                    Send Email for Interview
                  </h3>
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                    Automated & Branded Invitation
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  if (!isSendingInvite) setShowInviteModal(false)
                }}
                disabled={isSendingInvite}
                className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors text-slate-400 hover:text-slate-600 cursor-pointer disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Candidate Details Mini Panel */}
            <div className="bg-slate-50/80 border border-slate-200/50 rounded-2xl p-4 space-y-3 text-xs font-semibold text-slate-600">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider w-20">Candidate:</span>
                <span className="text-slate-800 font-bold">{profile.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider w-20">Email:</span>
                <span className="text-slate-800 font-bold select-all truncate">{profile.email}</span>
              </div>
            </div>

            {/* Job Selection Dropdown */}
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">
                Select Job Description Pipeline
              </label>
              
              {isLoadingJds ? (
                <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span>Loading job pipelines...</span>
                </div>
              ) : jds && jds.length > 0 ? (
                <div className="relative">
                  <select
                    value={selectedJdId}
                    onChange={(e) => setSelectedJdId(e.target.value)}
                    disabled={isSendingInvite}
                    className="w-full bg-white border border-slate-200 rounded-2xl p-3.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all appearance-none cursor-pointer"
                  >
                    <option value="" disabled>-- Choose a Pipeline --</option>
                    {jds.map((jd) => (
                      <option key={jd.id} value={jd.id}>
                        {jd.title} ({jd.company_details?.company_name || "Company"})
                      </option>
                    ))}
                  </select>
                  {/* Custom Arrow Icon */}
                  <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
                    <ChevronRight className="w-4 h-4 rotate-90" />
                  </div>
                </div>
              ) : (
                <div className="text-xs text-amber-600 font-medium bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <div>
                    <p className="font-bold">No Job Descriptions Found</p>
                    <p className="text-[10px] text-amber-500 mt-0.5">You must create a Job Description first to invite candidates to a pipeline.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Theme & Preview Info */}
            <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-100/50 rounded-2xl p-4 space-y-2">
              <h4 className="text-[10px] font-black text-violet-800 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Enhanced Premium Template Included
              </h4>
              <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
                We will send an elegantly formatted email featuring your company's profile theme (violet-to-rose header gradients, custom scheduling portal link, and styled signature) to invite {profile.name} for an interview.
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 justify-end mt-2">
              <Button
                variant="outline"
                onClick={() => setShowInviteModal(false)}
                disabled={isSendingInvite}
                className="rounded-2xl h-11 px-5 text-xs font-bold uppercase tracking-wider border-slate-250 hover:bg-slate-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendInvite}
                disabled={!selectedJdId || isSendingInvite}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white border-0 shadow-md shadow-violet-500/10 rounded-2xl h-11 px-6 text-xs font-black uppercase tracking-wider flex items-center gap-2"
              >
                {isSendingInvite ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    <span>Send Automated Invite</span>
                  </>
                )}
              </Button>
            </div>
            
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
