import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { candidates } from '../lib/mock-data';
import { Mail, Phone, MapPin, Briefcase, GraduationCap, ArrowLeft, Download, MessageSquare, CheckCircle2, XCircle } from "lucide-react";

export default function CandidateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const c = candidates.find((x) => x.id === id);

  // States to handle actions
  const [status, setStatus] = useState(c?.status || 'applied');
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [notification, setNotification] = useState('');

  if (!c) {
    return (
      <div className="min-h-screen bg-surface flex flex-col justify-center items-center p-10 text-center">
        <p className="text-lg font-bold text-on-surface mb-4">Candidate not found.</p>
        <Button onClick={() => navigate('/recruiter')}>
          Back to recruiter portal
        </Button>
      </div>
    );
  }

  const handleShortlist = () => {
    setStatus('shortlisted');
    showNotification('Candidate Shortlisted!');
  };

  const handleReject = () => {
    setStatus('rejected');
    showNotification('Candidate Rejected');
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setShowMessageModal(false);
      setMessageText('');
      showNotification('Message Sent Successfully!');
    }, 1000);
  };

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 2000);
  };

  return (
    <div className="min-h-screen bg-surface font-body text-on-surface pb-32 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-outline-variant/30">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Link 
              to="/recruiter" 
              className="text-primary hover:bg-surface-container-low p-2 rounded-full transition-all flex items-center justify-center cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="font-headline font-bold text-lg text-primary tracking-tight">Talent Vector</div>
          </div>
          <span className="bg-primary-container px-3 py-1 rounded-full text-[10px] font-black text-primary uppercase tracking-wider">
            Candidate Profile
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-5xl w-full space-y-6 p-6 md:p-8 animate-fadeIn">
        <Link to="/recruiter" className="inline-flex items-center gap-1.5 text-xs font-bold text-outline hover:text-on-surface transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to recruiter portal
        </Link>

        <Card className="overflow-hidden">
          <div className="bg-gradient-to-br from-primary/10 via-transparent to-transparent p-6 md:p-8">
            <div className="flex flex-wrap items-start gap-6">
              <img src={c.avatar} alt={c.name} className="h-24 w-24 rounded-2xl border border-outline-variant/40 bg-white shadow-sm object-cover" />
              <div className="min-w-0 flex-1">
                <h1 className="font-headline text-3xl font-bold tracking-tight text-on-surface">{c.name}</h1>
                <p className="mt-1 text-sm font-semibold text-on-surface-variant">{c.title}</p>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-outline font-medium">
                  <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5 text-primary" /> {c.email}</span>
                  <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-primary" /> {c.phone}</span>
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-primary" /> {c.location}</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge>{c.domain}</Badge>
                  <Badge>{c.experience}y experience</Badge>
                  <Badge className={`capitalize ${
                    status === 'shortlisted' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                    status === 'rejected' ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' :
                    'bg-amber-500/10 text-amber-600 border-amber-500/20'
                  }`}>{status}</Badge>
                </div>
              </div>
              <div className="text-center w-full sm:w-auto mt-4 sm:mt-0">
                <div className="rounded-2xl border border-outline-variant bg-white px-6 py-4 shadow-sm inline-block min-w-[120px]">
                  <p className="text-[9px] font-black uppercase tracking-widest text-outline">Match Score</p>
                  <p className="font-headline text-5xl font-bold text-primary mt-1">{c.score}</p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-outline mt-1">vs. applied JD</p>
                </div>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={handleShortlist} className="bg-primary text-white hover:bg-primary/95 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> Shortlist
              </Button>
              <Button variant="outline" onClick={() => setShowMessageModal(true)} className="flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4" /> Message
              </Button>
              <Button variant="outline" className="flex items-center gap-1.5" onClick={() => {
                showNotification('Resume Downloaded Successfully');
                const link = document.createElement('a');
                link.href = '#';
                link.setAttribute('download', `${c.name}_Resume.pdf`);
                document.body.appendChild(link);
                setTimeout(() => document.body.removeChild(link), 100);
              }}>
                <Download className="h-4 w-4" /> Resume
              </Button>
              <Button variant="ghost" className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 flex items-center gap-1.5 cursor-pointer ml-auto" onClick={handleReject}>
                <XCircle className="h-4 w-4" /> Reject
              </Button>
            </div>
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="p-6 h-fit">
            <h2 className="font-headline text-sm font-bold uppercase tracking-wider text-outline opacity-80">Score breakdown</h2>
            <div className="mt-5 space-y-4">
              <ScoreBar label="Skill match (70%)" v={c.skillMatch} />
              <ScoreBar label="Experience match (30%)" v={c.expMatch} />
              <div className="rounded-2xl bg-surface-container-low border border-outline-variant/30 p-4 mt-6">
                <p className="text-xs font-bold text-outline uppercase tracking-wider">Weighted overall</p>
                <p className="font-headline text-3xl font-bold mt-1 text-on-surface">{c.score}<span className="text-base text-outline font-normal">/100</span></p>
              </div>
            </div>
          </Card>

          <Card className="lg:col-span-2 p-6">
            <h2 className="font-headline text-sm font-bold uppercase tracking-wider text-outline opacity-80">Skills</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {c.skills.map((s) => (
                <span key={s} className="rounded-md bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 px-3 py-1 text-xs font-semibold select-none transition-colors">
                  {s}
                </span>
              ))}
            </div>
            <h2 className="mt-8 font-headline text-sm font-bold uppercase tracking-wider text-outline opacity-80">Experience</h2>
            <div className="mt-4 space-y-6">
              {c.experiences.map((e, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary shrink-0"><Briefcase className="h-4 w-4" /></div>
                  <div className="space-y-1">
                    <p className="font-bold text-on-surface text-base">{e.role}</p>
                    <p className="text-xs font-bold text-primary uppercase tracking-wider">{e.company} · {e.period}</p>
                    <p className="text-sm text-on-surface-variant leading-relaxed font-medium mt-1">{e.summary}</p>
                  </div>
                </div>
              ))}
            </div>

            <h2 className="mt-8 font-headline text-sm font-bold uppercase tracking-wider text-outline opacity-80">Education</h2>
            <div className="mt-4 space-y-4">
              {c.education.map((e, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-secondary-container text-secondary shrink-0"><GraduationCap className="h-4 w-4" /></div>
                  <div className="space-y-1">
                    <p className="font-bold text-on-surface">{e.degree}</p>
                    <p className="text-xs font-bold text-outline uppercase tracking-wider">{e.school} · {e.year}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-on-surface/20 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowMessageModal(false)}></div>
          <Card className="relative bg-white rounded-3xl p-6 shadow-[0_20px_70px_rgba(0,0,0,0.2)] border border-outline-variant/30 w-full max-w-md animate-in zoom-in-95 fade-in duration-300">
            <h3 className="font-headline text-lg font-bold text-on-surface mb-1">Message {c.name}</h3>
            <p className="text-xs text-outline mb-4 font-medium">Send an email/message directly to the candidate.</p>
            <form onSubmit={handleSendMessage} className="space-y-4">
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                rows={4}
                required
                placeholder="Write your message here..."
                className="w-full p-4 rounded-xl border border-outline-variant/50 focus:ring-[3px] focus:ring-primary/5 focus:border-primary transition-all outline-none text-sm font-medium placeholder:text-outline/40 shadow-inner resize-none"
              />
              <div className="flex justify-end gap-3 mt-4">
                <Button variant="ghost" type="button" onClick={() => setShowMessageModal(false)}>Cancel</Button>
                <Button type="submit" disabled={isSending}>
                  {isSending ? 'Sending...' : 'Send Message'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#111] text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-in slide-in-from-bottom-5 duration-300">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <span className="text-[10px] font-black uppercase tracking-widest">{notification}</span>
        </div>
      )}
    </div>
  );
}

// Local UI Components to avoid shadcn imports
function Card({ className = '', children, ...props }) {
  return (
    <div {...props} className={`bg-surface-container-lowest rounded-3xl border border-outline-variant/45 shadow-[0_20px_50px_rgba(0,0,0,0.03)] ${className}`}>
      {children}
    </div>
  );
}

function Badge({ children, className = '' }) {
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-surface-container-low border border-outline-variant/30 text-on-surface-variant ${className}`}>
      {children}
    </span>
  );
}

function Button({ variant = 'default', children, className = '', ...props }) {
  if (variant === 'ghost') {
    return (
      <button
        {...props}
        className={`h-11 px-6 rounded-xl font-black uppercase tracking-widest text-[10px] text-outline hover:text-on-surface hover:bg-surface-container transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {children}
      </button>
    );
  }
  if (variant === 'outline') {
    return (
      <button
        {...props}
        className={`h-11 px-5 rounded-xl border border-outline-variant/60 font-black uppercase tracking-widest text-[10px] text-on-surface hover:bg-surface-container-low transition-all cursor-pointer disabled:opacity-50 ${className}`}
      >
        {children}
      </button>
    );
  }
  return (
    <button
      {...props}
      className={`group relative h-11 px-6 bg-[#111] overflow-hidden rounded-xl transition-all duration-300 hover:shadow-[0_15px_30px_rgba(0,0,0,0.15)] hover:scale-[1.01] active:scale-[0.98] cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-primary/30 via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
      
      <div className="relative flex items-center justify-center gap-2">
        <span className="text-white font-black uppercase tracking-[0.2em] text-[10px] flex items-center gap-1.5">{children}</span>
      </div>
    </button>
  );
}

function Progress({ value, className = "" }) {
  return (
    <div className={`w-full bg-surface-container rounded-full h-2 overflow-hidden ${className}`}>
      <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${value}%` }}></div>
    </div>
  );
}

function ScoreBar({ label, v }) {
  return (
    <div>
      <div className="flex justify-between text-xs font-semibold mb-1"><span className="text-on-surface-variant">{label}</span><span className="text-primary">{v}%</span></div>
      <Progress value={v} />
    </div>
  );
}
