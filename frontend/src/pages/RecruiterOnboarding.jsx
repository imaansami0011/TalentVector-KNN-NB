import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Check, Sparkles, Users2, MapPin, Loader2, ArrowRight } from 'lucide-react';

const steps = ["Account", "Company", "Team", "Launch"];

export default function RecruiterOnboarding() {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  // Field states
  const [fullName, setFullName] = useState(localStorage.getItem('user_name') || '');
  const [workEmail, setWorkEmail] = useState(localStorage.getItem('user_id') || '');
  const [roleTitle, setRoleTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [website, setWebsite] = useState('');
  const [hqLocation, setHqLocation] = useState('');
  const [address, setAddress] = useState('');

  // Teammates invite state
  const [teammates, setTeammates] = useState([
    { email: '', status: 'idle' },
    { email: '', status: 'idle' },
    { email: '', status: 'idle' }
  ]);

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const userId = localStorage.getItem('user_id') || 'recruiter@company.com';

  // Load existing company profile if any
  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch('http://localhost:8000/recruiter/check-onboarding', {
          headers: {
            'X-User-ID': userId
          }
        });
        if (response.ok) {
          const data = await response.json();
          if (data.company) {
            setCompanyName(data.company.company_name || '');
            setWebsite(data.company.website || '');
            setHqLocation(data.company.hq_location || '');
            setAddress(data.company.address || '');
          }
        }
      } catch (err) {
        console.error("Failed to load onboarding info", err);
      }
    }
    if (userId) {
      loadProfile();
    }
  }, [userId]);

  const handleNextStep = async () => {
    setErrorMessage('');
    if (step === 1) {
      if (!fullName.trim() || !workEmail.trim()) {
        setErrorMessage('Full name and work email are required.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!companyName.trim()) {
        setErrorMessage('Company name is required.');
        return;
      }
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
            hq_location: hqLocation === '__other__' ? '' : hqLocation,
            full_name: fullName,
            role_title: roleTitle
          })
        });

        if (!response.ok) throw new Error('Failed to save company profile');
        
        setStep(3);
      } catch (error) {
        console.error("Onboarding error:", error);
        setErrorMessage("Failed to save profile. Is the backend running?");
      } finally {
        setIsSaving(false);
      }
    } else if (step === 3) {
      setStep(4);
    }
  };

  const handleInvite = async (index) => {
    const email = teammates[index].email;
    if (!email.trim()) return;

    // Basic email validation
    if (!email.includes('@')) {
      alert('Please enter a valid email address.');
      return;
    }

    const updated = [...teammates];
    updated[index].status = 'sending';
    setTeammates(updated);

    // Simulate invite transmission delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const final = [...teammates];
    final[index].status = 'invited';
    setTeammates(final);
  };

  const handleTeammateEmailChange = (index, value) => {
    const updated = [...teammates];
    updated[index].email = value;
    if (updated[index].status === 'invited') {
      updated[index].status = 'idle'; // Reset if they edit it
    }
    setTeammates(updated);
  };

  const handleFinishOnboarding = () => {
    localStorage.setItem('onboarded', 'true');
    navigate('/hr/portal');
  };

  return (
    <div className="min-h-screen bg-surface font-body text-on-surface flex flex-col">
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-outline-variant/30">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <Link to="/hr/portal" className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-md bg-primary text-white">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="font-headline font-bold text-lg text-primary tracking-tight">Talent Vector</span>
          </Link>
          <Link to="/hr/portal" className="text-xs font-bold text-outline hover:text-primary transition-colors">
            Skip for now →
          </Link>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-3xl px-6 py-10">
        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-widest text-primary">
              Step {step} of {steps.length}
            </p>
            <p className="text-xs font-bold text-on-surface-variant">
              {Math.round((step / steps.length) * 100)}% complete
            </p>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-container">
            <div 
              className="h-full rounded-full bg-primary transition-all duration-500 shadow-sm" 
              style={{ width: `${(step / steps.length) * 100}%` }} 
            />
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {steps.map((s, i) => (
              <div 
                key={s} 
                className={`text-center text-[9px] font-black uppercase tracking-widest transition-colors ${
                  i < step ? "text-primary" : "text-outline/40"
                }`}
              >
                {s}
              </div>
            ))}
          </div>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-error/5 border border-error/20 text-error text-xs font-bold uppercase tracking-wider animate-shake">
            {errorMessage}
          </div>
        )}

        <Card className="p-8">
          {step === 1 && (
            <Form title="Tell us about you" subtitle="Create your Recruiter Profile">
              <Field label="Full name">
                <Input 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Morgan" 
                  required
                />
              </Field>
              <Field label="Work email">
                <Input 
                  type="email" 
                  value={workEmail}
                  onChange={(e) => setWorkEmail(e.target.value)}
                  placeholder="alex@acme.co" 
                  required
                />
              </Field>
              <Field label="Role / Job Title">
                <Input 
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  placeholder="e.g. Head of Talent Acquisition" 
                />
              </Field>
            </Form>
          )}

          {step === 2 && (
            <Form title="Company profile" subtitle="Your enterprise identity" icon={<Building2 className="h-5 w-5" />}>
              <Field label="Company name">
                <Input 
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Acme Inc." 
                  required
                />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Website (Optional)">
                  <Input 
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://acme.co" 
                  />
                </Field>
                <Field label="HQ Location (Optional)">
                  {(() => {
                    const PK_CITIES = ['Karachi','Lahore','Islamabad','Rawalpindi','Faisalabad','Multan','Peshawar','Quetta','Sialkot','Hyderabad'];
                    const isStandard = PK_CITIES.includes(hqLocation);
                    const isCustom = hqLocation && !isStandard;
                    return (
                      <>
                        <select
                          value={isStandard ? hqLocation : (isCustom ? 'Other' : '')}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === 'Other') {
                              setHqLocation('__other__');
                            } else {
                              setHqLocation(val);
                            }
                          }}
                          className="w-full h-12 px-4 rounded-xl border border-outline-variant/40 bg-white/50 backdrop-blur-sm focus:bg-white focus:ring-[3px] focus:ring-primary/5 focus:border-primary transition-all outline-none text-sm font-bold"
                        >
                          <option value="">Select City</option>
                          {PK_CITIES.map(city => (
                            <option key={city} value={city}>{city}</option>
                          ))}
                          <option value="Other">Other</option>
                        </select>
                        {(isCustom || hqLocation === '__other__') && (
                          <Input
                            placeholder="Enter city name"
                            value={hqLocation === '__other__' ? '' : hqLocation}
                            onChange={(e) => setHqLocation(e.target.value || '__other__')}
                            className="mt-1.5"
                          />
                        )}
                      </>
                    );
                  })()}
                </Field>
              </div>
              <Field label="Address (Optional)">
                <Textarea 
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street, City, Country" 
                  rows={3} 
                />
              </Field>
              
              <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 flex gap-4 mt-2">
                <span className="material-symbols-outlined text-primary text-[20px]">verified_user</span>
                <p className="font-bold text-[9px] text-primary/70 uppercase tracking-widest leading-relaxed">
                  SECURITY PROTOCOL: THIS PROFILE WILL BE LOCKED TO <b className="text-primary">{userId}</b> FOR DATA PRIVACY ENFORCEMENT.
                </p>
              </div>
            </Form>
          )}

          {step === 3 && (
            <Form title="Invite your team" subtitle="Collaborate on talent pipelines" icon={<Users2 className="h-5 w-5" />}>
              <div className="space-y-4">
                {teammates.map((teammate, i) => (
                  <div key={i} className="grid grid-cols-[1fr_auto] gap-2 items-center">
                    <Input 
                      type="email"
                      value={teammate.email}
                      onChange={(e) => handleTeammateEmailChange(i, e.target.value)}
                      placeholder={`colleague${i + 1}@acme.co`} 
                      disabled={teammate.status === 'invited' || teammate.status === 'sending'}
                    />
                    <Button 
                      variant={teammate.status === 'invited' ? 'outline' : 'default'}
                      onClick={() => handleInvite(i)}
                      disabled={teammate.status === 'invited' || teammate.status === 'sending' || !teammate.email.trim()}
                      className="min-w-[90px]"
                    >
                      {teammate.status === 'sending' ? (
                        <Loader2 className="h-3 w-3 animate-spin mx-auto text-white" />
                      ) : teammate.status === 'invited' ? (
                        <span className="flex items-center gap-1 text-emerald-600 font-black"><Check className="h-3 w-3" /> Sent</span>
                      ) : (
                        "Invite"
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </Form>
          )}

          {step === 4 && (
            <div className="py-8 text-center animate-fadeIn">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600 shadow-inner">
                <Check className="h-7 w-7" />
              </div>
              <h2 className="mt-6 font-headline text-2xl font-bold uppercase tracking-tight text-on-surface">You're all set</h2>
              <p className="mt-2 text-sm text-on-surface-variant max-w-sm mx-auto">
                Your workspace is ready. Let's make your first hire and run resume screenings.
              </p>
              <button 
                onClick={handleFinishOnboarding}
                className="group relative h-14 px-8 bg-[#111] overflow-hidden rounded-2xl transition-all duration-300 hover:shadow-[0_20px_40px_rgba(0,0,0,0.2)] hover:scale-[1.01] active:scale-[0.98] cursor-pointer mt-8"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/30 via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                <div className="relative flex items-center justify-center gap-2">
                  <span className="text-white font-black uppercase tracking-[0.2em] text-[10px]">Enter dashboard</span>
                  <ArrowRight className="h-4.5 w-4.5 text-white transition-transform group-hover:translate-x-1" />
                </div>
              </button>
            </div>
          )}

          {step < 4 && (
            <div className="mt-8 flex items-center justify-between border-t border-outline-variant/30 pt-6">
              <Button 
                variant="ghost" 
                onClick={() => setStep(Math.max(1, step - 1))} 
                disabled={step === 1}
              >
                Back
              </Button>
              <Button 
                onClick={handleNextStep}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="h-4.5 w-4.5 animate-spin text-white" />
                ) : (
                  "Continue"
                )}
              </Button>
            </div>
          )}
        </Card>

        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-outline/60">
          <MapPin className="h-3.5 w-3.5" /> SOC 2 compliant · EU data residency
        </div>
      </main>
    </div>
  );
}

// Custom subcomponents to replace Shadcn UI dependency
function Card({ className = '', children }) {
  return (
    <div className={`bg-surface-container-lowest rounded-3xl border border-outline-variant/40 shadow-[0_20px_50px_rgba(0,0,0,0.03)] ${className}`}>
      {children}
    </div>
  );
}

function Form({ title, subtitle, icon, children }) {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-start gap-4">
        {icon ? (
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-sm">
            {icon}
          </div>
        ) : (
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-sm">
            <span className="material-symbols-outlined text-[24px]">assignment_ind</span>
          </div>
        )}
        <div>
          <h2 className="font-headline text-2xl font-bold uppercase tracking-tight text-on-surface">{title}</h2>
          <p className="text-xs font-bold text-on-surface-variant/80 uppercase tracking-widest mt-0.5">{subtitle}</p>
        </div>
      </div>
      <div className="space-y-5 pt-2">{children}</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-outline uppercase tracking-[0.2em] ml-1 opacity-70">
        {label}
      </label>
      {children}
    </div>
  );
}

function Input({ className = '', ...props }) {
  return (
    <input
      {...props}
      className={`w-full h-12 px-4 rounded-xl border border-outline-variant/40 bg-white/50 backdrop-blur-sm focus:bg-white focus:ring-[3px] focus:ring-primary/5 focus:border-primary transition-all outline-none text-sm font-bold placeholder:text-outline/40 shadow-inner ${className}`}
    />
  );
}

function Textarea({ className = '', ...props }) {
  return (
    <textarea
      {...props}
      className={`w-full p-4 rounded-xl border border-outline-variant/40 bg-white/50 backdrop-blur-sm focus:bg-white focus:ring-[3px] focus:ring-primary/5 focus:border-primary transition-all outline-none text-sm font-bold placeholder:text-outline/40 shadow-inner resize-none ${className}`}
    />
  );
}

function Button({ variant = 'default', children, className = '', ...props }) {
  if (variant === 'ghost') {
    return (
      <button
        {...props}
        className={`h-12 px-6 rounded-xl font-black uppercase tracking-widest text-[10px] text-outline hover:text-on-surface hover:bg-surface-container transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {children}
      </button>
    );
  }
  if (variant === 'outline') {
    return (
      <button
        {...props}
        className={`h-12 px-5 rounded-xl border border-outline-variant/60 font-black uppercase tracking-widest text-[10px] text-on-surface hover:bg-surface-container-low transition-all cursor-pointer disabled:opacity-50 ${className}`}
      >
        {children}
      </button>
    );
  }
  return (
    <button
      {...props}
      className={`group relative h-12 px-8 bg-[#111] overflow-hidden rounded-xl transition-all duration-300 hover:shadow-[0_15px_30px_rgba(0,0,0,0.15)] hover:scale-[1.01] active:scale-[0.98] cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-primary/30 via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
      
      <div className="relative flex items-center justify-center gap-2">
        <span className="text-white font-black uppercase tracking-[0.2em] text-[10px]">{children}</span>
      </div>
    </button>
  );
}
