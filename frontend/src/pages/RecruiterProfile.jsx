import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Camera, Save, Shield, Bell, Building2, Sparkles, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function RecruiterProfile() {
  const navigate = useNavigate();
  const userId = localStorage.getItem('user_id') || 'recruiter@company.com';
  const userPicture = localStorage.getItem('user_picture');
  
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Profile data state
  const [fullName, setFullName] = useState('');
  const [workEmail, setWorkEmail] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [bio, setBio] = useState('');
  
  // Company data state
  const [companyName, setCompanyName] = useState('');
  const [website, setWebsite] = useState('');
  const [hqLocation, setHqLocation] = useState('');
  const [address, setAddress] = useState('');

  // Switch states
  const [notifications, setNotifications] = useState({
    screeningCompleted: true,
    newTopMatch: true,
    weeklyDigest: false,
    productUpdates: false,
  });
  const [twoFactor, setTwoFactor] = useState(false);

  // Security password fields (mock state)
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Fetch recruiter and company data
  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch('http://localhost:8000/recruiter/profile', {
          headers: {
            'X-User-ID': userId
          }
        });
        if (response.ok) {
          const data = await response.json();
          setFullName(data.full_name || '');
          setWorkEmail(data.email || userId);
          setRoleTitle(data.role_title || '');
          setBio(data.bio || '');
          
          if (data.company) {
            setCompanyName(data.company.company_name || '');
            setWebsite(data.company.website || '');
            setHqLocation(data.company.hq_location || '');
            setAddress(data.company.address || '');
          }
        }
      } catch (err) {
        console.error("Failed to load recruiter profile data", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [userId]);

  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    if (!fullName.trim() || !companyName.trim()) {
      alert("Full name and Company name are required.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('http://localhost:8000/recruiter/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': userId
        },
        body: JSON.stringify({
          full_name: fullName,
          role_title: roleTitle,
          bio: bio,
          company_name: companyName,
          website: website,
          hq_location: hqLocation === '__other__' ? '' : hqLocation,
          address: address
        })
      });

      if (!response.ok) throw new Error('Failed to update recruiter profile');

      // Update local storage
      localStorage.setItem('user_name', fullName);

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 1500);
    } catch (err) {
      console.error("Failed to save recruiter profile", err);
      alert("Failed to save changes. Make sure the backend server is running.");
    } finally {
      setIsSaving(false);
    }
  };

  const userInitials = (fullName || 'Recruiter').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center font-body text-on-surface">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 border-t-transparent text-primary animate-spin" />
          <p className="text-on-surface-variant font-bold text-xs uppercase tracking-widest opacity-85">Loading recruiter settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface font-body text-on-surface pb-32 flex flex-col">
      {/* TopAppBar */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-outline-variant/30">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/recruiter')} 
              className="text-primary hover:bg-surface-container-low p-2 rounded-full transition-all flex items-center justify-center cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="font-headline font-bold text-lg text-primary tracking-tight">Talent Vector</div>
          </div>
          <span className="bg-primary-container px-3 py-1 rounded-full text-[10px] font-black text-primary uppercase tracking-wider">
            Recruiter Profile
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl space-y-6 p-6 md:p-8 animate-fadeIn">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-primary">Settings</p>
            <h1 className="mt-1 font-headline text-3xl font-bold tracking-tight">My profile</h1>
            <p className="mt-1 text-sm text-on-surface-variant">Manage your recruiter identity and workspace preferences.</p>
          </div>
        </div>

        {/* Recruiter Avatar Card */}
        <Card className="p-6">
          <div className="flex flex-wrap items-center gap-6">
            <div className="relative">
              <div className="h-20 w-20 rounded-full border-2 border-background shadow-md overflow-hidden bg-primary/10 flex items-center justify-center text-primary font-black text-xl">
                {userPicture ? (
                  <img src={userPicture} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>{userInitials}</span>
                )}
              </div>
              <button className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full border border-outline-variant bg-white shadow-sm hover:bg-surface-container transition-colors cursor-pointer">
                <Camera className="h-3.5 w-3.5 text-on-surface-variant" />
              </button>
            </div>
            
            <div className="flex-1 min-w-[200px]">
              <h2 className="font-headline text-xl font-bold text-on-surface">{fullName || "Recruiter"}</h2>
              <p className="text-sm text-on-surface-variant font-medium">
                {roleTitle || "Head of Talent"} · <span className="text-primary font-bold">{companyName || "Company"}</span>
              </p>
              <div className="mt-3 flex gap-2">
                <Badge>Pro plan</Badge>
                <Badge>3 teammates</Badge>
              </div>
            </div>

            <Button 
              onClick={handleSaveProfile} 
              disabled={isSaving}
              className="w-full md:w-auto mt-4 md:mt-0"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin text-white" />
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save changes
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* 2x2 Settings Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Personal Info */}
          <Card className="p-6 flex flex-col justify-between">
            <div>
              <h2 className="font-headline text-base font-bold uppercase tracking-wide text-on-surface">Personal info</h2>
              <div className="mt-4 space-y-4">
                <Field label="Full name">
                  <Input 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Alex Morgan" 
                  />
                </Field>
                <Field label="Work email (Read Only)">
                  <Input 
                    type="email"
                    value={workEmail}
                    disabled
                    className="opacity-60 cursor-not-allowed bg-surface-container-low" 
                  />
                </Field>
                <Field label="Role">
                  <Input 
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    placeholder="Head of Talent" 
                  />
                </Field>
                <Field label="Bio">
                  <Textarea 
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    placeholder="Write a short summary about your sourcing preferences..." 
                  />
                </Field>
              </div>
            </div>
          </Card>

          {/* Company */}
          <Card className="p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="h-4.5 w-4.5 text-primary" />
                <h2 className="font-headline text-base font-bold uppercase tracking-wide text-on-surface">Company</h2>
              </div>
              <div className="space-y-4">
                <Field label="Company name">
                  <Input 
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Acme Inc." 
                  />
                </Field>
                <Field label="Website">
                  <Input 
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="acme.co" 
                  />
                </Field>
                <Field label="HQ Location">
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
                          className="w-full h-11 px-4 rounded-xl border border-outline-variant/40 bg-white/50 backdrop-blur-sm focus:bg-white focus:ring-[3px] focus:ring-primary/5 focus:border-primary transition-all outline-none text-sm font-semibold"
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
                <Field label="Office Address">
                  <Input 
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="123 Corporate Lane, Suite 100" 
                  />
                </Field>
              </div>
            </div>
          </Card>

          {/* Notifications */}
          <Card className="p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Bell className="h-4.5 w-4.5 text-primary" />
                <h2 className="font-headline text-base font-bold uppercase tracking-wide text-on-surface">Notifications</h2>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl border border-outline-variant/30 bg-surface-container-low/30 p-3.5">
                  <p className="text-sm font-bold text-on-surface">Screening completed</p>
                  <Switch 
                    checked={notifications.screeningCompleted} 
                    onChange={(checked) => setNotifications(prev => ({ ...prev, screeningCompleted: checked }))} 
                  />
                </div>
                <div className="flex items-center justify-between rounded-xl border border-outline-variant/30 bg-surface-container-low/30 p-3.5">
                  <p className="text-sm font-bold text-on-surface">New top-match candidate</p>
                  <Switch 
                    checked={notifications.newTopMatch} 
                    onChange={(checked) => setNotifications(prev => ({ ...prev, newTopMatch: checked }))} 
                  />
                </div>
                <div className="flex items-center justify-between rounded-xl border border-outline-variant/30 bg-surface-container-low/30 p-3.5">
                  <p className="text-sm font-bold text-on-surface">Weekly hiring digest</p>
                  <Switch 
                    checked={notifications.weeklyDigest} 
                    onChange={(checked) => setNotifications(prev => ({ ...prev, weeklyDigest: checked }))} 
                  />
                </div>
                <div className="flex items-center justify-between rounded-xl border border-outline-variant/30 bg-surface-container-low/30 p-3.5">
                  <p className="text-sm font-bold text-on-surface">Product updates</p>
                  <Switch 
                    checked={notifications.productUpdates} 
                    onChange={(checked) => setNotifications(prev => ({ ...prev, productUpdates: checked }))} 
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Security */}
          <Card className="p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-4.5 w-4.5 text-primary" />
                <h2 className="font-headline text-base font-bold uppercase tracking-wide text-on-surface">Security</h2>
              </div>
              <div className="space-y-4">
                <Field label="Current password">
                  <Input 
                    type="password" 
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••" 
                  />
                </Field>
                <Field label="New password">
                  <Input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••" 
                  />
                </Field>
                <div className="flex items-center justify-between rounded-xl border border-outline-variant/30 bg-surface-container-low/30 p-3.5 mt-2">
                  <div>
                    <p className="text-sm font-bold text-on-surface">Two-factor authentication</p>
                    <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mt-0.5">Add an extra layer of security</p>
                  </div>
                  <Switch 
                    checked={twoFactor} 
                    onChange={(checked) => setTwoFactor(checked)} 
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </main>

      {/* Premium Success Notification Modal */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-on-surface/20 backdrop-blur-sm animate-in fade-in duration-300"></div>
          <div className="relative bg-white rounded-[2rem] p-8 shadow-[0_20px_70px_rgba(0,0,0,0.2)] border border-outline-variant/30 flex flex-col items-center gap-4 animate-in zoom-in-95 fade-in duration-300">
            <div className="w-20 h-20 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center shadow-lg animate-bounce">
              <CheckCircle2 className="h-12 w-12" />
            </div>
            <div className="text-center">
              <h3 className="font-headline text-xl font-black text-on-surface uppercase tracking-tight">Changes Saved</h3>
              <p className="text-on-surface-variant text-xs font-black uppercase tracking-widest mt-1">Your profile settings are synchronized</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Subcomponents helper
function Card({ className = '', children }) {
  return (
    <div className={`bg-surface-container-lowest rounded-3xl border border-outline-variant/45 shadow-[0_20px_50px_rgba(0,0,0,0.03)] ${className}`}>
      {children}
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
      className={`w-full h-11 px-4 rounded-xl border border-outline-variant/40 bg-white/50 backdrop-blur-sm focus:bg-white focus:ring-[3px] focus:ring-primary/5 focus:border-primary transition-all outline-none text-sm font-semibold placeholder:text-outline/40 shadow-inner ${className}`}
    />
  );
}

function Textarea({ className = '', ...props }) {
  return (
    <textarea
      {...props}
      className={`w-full p-4 rounded-xl border border-outline-variant/40 bg-white/50 backdrop-blur-sm focus:bg-white focus:ring-[3px] focus:ring-primary/5 focus:border-primary transition-all outline-none text-sm font-semibold placeholder:text-outline/40 shadow-inner resize-none ${className}`}
    />
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

function Badge({ children, className = '' }) {
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-surface-container-low border border-outline-variant/30 text-on-surface-variant ${className}`}>
      {children}
    </span>
  );
}

function Switch({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange && onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none focus:ring-2 focus:ring-primary/20 ${checked ? 'bg-primary' : 'bg-surface-container-high'}`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  );
}
