import React, { useState, useMemo } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { AppShell } from '../components/app-shell'
import { AdPanel } from '../components/ad-panel'
import { Card, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { 
  Briefcase, 
  MapPin, 
  Calendar, 
  Building2, 
  Search, 
  Loader2, 
  Globe, 
  Sparkles,
  SlidersHorizontal,
  X,
  UserCircle,
  ChevronDown
} from 'lucide-react'

export const Route = createFileRoute('/browse')({
  component: MarketDiscovery,
})

// Top-level utility function for logo color generation
const getCompanyLogoStyle = (companyName) => {
  if (!companyName) return { bg: 'from-slate-500 to-slate-700', text: 'text-white' }
  const name = companyName.trim()
  let charCode = 0
  for (let i = 0; i < name.length; i++) {
    charCode += name.charCodeAt(i)
  }
  
  // A set of beautiful premium gradients
  const gradients = [
    { bg: 'from-indigo-500 to-indigo-600', text: 'text-indigo-50' },
    { bg: 'from-violet-500 to-violet-600', text: 'text-violet-50' },
    { bg: 'from-fuchsia-500 to-fuchsia-600', text: 'text-fuchsia-50' },
    { bg: 'from-emerald-500 to-emerald-600', text: 'text-emerald-50' },
    { bg: 'from-blue-500 to-blue-600', text: 'text-blue-50' },
    { bg: 'from-amber-500 to-amber-600', text: 'text-amber-50' },
    { bg: 'from-rose-500 to-rose-600', text: 'text-rose-50' },
    { bg: 'from-indigo-600 to-blue-500', text: 'text-indigo-50' },
    { bg: 'from-emerald-600 to-teal-500', text: 'text-emerald-50' },
  ]
  
  const index = charCode % gradients.length
  return gradients[index]
}

function MarketDiscovery() {
  const navigate = useNavigate()
  const userEmail = typeof window !== 'undefined' ? localStorage.getItem('user_email') : null

  // State filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCity, setSelectedCity] = useState('All Cities')
  const [selectedMode, setSelectedMode] = useState('All Modes')

  // Fetch Candidate Profile to calculate client-side overlap match scores
  const { data: profile } = useQuery({
    queryKey: ['candidateProfile', userEmail],
    queryFn: async () => {
      const res = await fetch(`http://localhost:8000/candidate/profile?email=${userEmail}`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("access_token")}`
        }
      })
      if (!res.ok) return null
      return res.json()
    },
    enabled: !!userEmail,
  })

  // Fetch Jobs from GET /candidate/jobs
  const { data: jobs = [], isLoading, error } = useQuery({
    queryKey: ['candidateJobs'],
    queryFn: async () => {
      const res = await fetch('http://localhost:8000/candidate/jobs', {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("access_token")}`
        }
      })
      if (!res.ok) throw new Error('Failed to fetch job opportunities')
      return res.json()
    }
  })

  // Top 10 Pakistan cities + any extra cities from job data
  const TOP_PAKISTAN_CITIES = [
    'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad',
    'Multan', 'Peshawar', 'Quetta', 'Sialkot', 'Hyderabad'
  ]

  const uniqueCities = useMemo(() => {
    // Collect any extra cities from jobs that aren't in the top 10
    const extraCities = new Set()
    jobs.forEach(job => {
      if (job.city && !TOP_PAKISTAN_CITIES.some(c => c.toLowerCase() === job.city.toLowerCase())) {
        extraCities.add(job.city)
      }
    })
    return ['All Cities', ...TOP_PAKISTAN_CITIES, ...Array.from(extraCities)]
  }, [jobs])

  // Cosine Similarity score matching the backend manual_ranker
  const calculateCosineSimilarity = (jdSkills, resumeSkills) => {
    if (!jdSkills || jdSkills.length === 0 || !resumeSkills || resumeSkills.length === 0) return 0
    const vocabulary = Array.from(new Set([...jdSkills, ...resumeSkills].map(s => s.toLowerCase())))
    if (vocabulary.length === 0) return 0

    const buildVector = (skills, vocab) => {
      const counts = {}
      skills.forEach(s => {
        const lower = s.toLowerCase()
        counts[lower] = (counts[lower] || 0) + 1
      })
      return vocab.map(word => counts[word] || 0)
    }

    const vJd = buildVector(jdSkills, vocabulary)
    const vRes = buildVector(resumeSkills, vocabulary)

    let dotProduct = 0
    let magJd = 0
    let magRes = 0
    for (let i = 0; i < vocabulary.length; i++) {
      dotProduct += vJd[i] * vRes[i]
      magJd += vJd[i] * vJd[i]
      magRes += vRes[i] * vRes[i]
    }
    magJd = Math.sqrt(magJd)
    magRes = Math.sqrt(magRes)

    if (magJd === 0 || magRes === 0) return 0
    return dotProduct / (magJd * magRes)
  }

  // Weighted score matching backend (70% Skills Cosine, 30% Experience Ratio)
  const calculateMatchScore = (job, candidateProfile) => {
    if (!job || !candidateProfile) return 0
    const skillScore = calculateCosineSimilarity(job.core_skills || [], candidateProfile.skills || []) * 100
    const requiredExp = job.min_experience || 0
    const actualExp = candidateProfile.total_experience || 0
    const expScore = requiredExp === 0 ? 100 : (actualExp >= requiredExp ? 100 : (actualExp / requiredExp) * 100)
    return Math.round((skillScore * 0.7) + (expScore * 0.3))
  }

  // Filtered Jobs
  const filteredJobs = useMemo(() => {
    const list = jobs.filter(job => {
      // 1. Search Query filter (matches title, company, or skills)
      const matchesSearch = searchQuery === '' || 
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.core_skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()))

      // 2. City filter
      const matchesCity = selectedCity === 'All Cities' || job.city === selectedCity

      // 3. Location Type / Mode filter
      let matchesMode = true
      if (selectedMode === 'Remote') {
        matchesMode = job.location_type.toLowerCase() === 'remote'
      } else if (selectedMode === 'Live') {
        matchesMode = job.location_type.toLowerCase() !== 'remote'
      }

      return matchesSearch && matchesCity && matchesMode
    })

    if (profile) {
      list.sort((a, b) => {
        const scoreA = calculateMatchScore(a, profile)
        const scoreB = calculateMatchScore(b, profile)
        return scoreB - scoreA
      })
    }

    return list
  }, [jobs, searchQuery, selectedCity, selectedMode, profile])

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedCity('All Cities')
    setSelectedMode('All Modes')
  }

  return (
    <AppShell rightPanel={<AdPanel mode="candidate" />}>
      <div className="p-6 md:p-8 space-y-6 w-full max-w-none animate-fadeIn select-none">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Opportunity Discovery</span>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none font-display">Browse Jobs</h1>
            <p className="text-xs text-slate-500 font-medium">Explore active openings and see matches against your profile skills.</p>
          </div>
        </div>

        {/* Content Feed */}
        <div className="space-y-6">
          
          {/* Profile Completed Warning if no skills */}
          {profile && (!profile.skills || profile.skills.length === 0) && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-800 rounded-2xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-amber-600 shrink-0 animate-pulse" />
                <div className="space-y-0.5">
                  <p className="text-xs font-bold uppercase tracking-wide">Complete your profile setup</p>
                  <p className="text-[10px] text-slate-500">Your profile doesn't have any skills configured. Add skills to see real-time skill matching scores on jobs!</p>
                </div>
              </div>
              <Link to="/user-profile" search={{ onboarding: false }}>
                <Button size="sm" variant="outline" className="h-8 border-amber-500/20 hover:bg-amber-500/10 hover:text-amber-800 shrink-0 text-[9px]">
                  <UserCircle className="w-3.5 h-3.5 mr-1" />
                  Go to Profile
                </Button>
              </Link>
            </div>
          )}

          {/* Search & Filter Bar */}
          <Card className="p-4 border border-slate-200 shadow-sm bg-white/80 backdrop-blur-sm">
            <div className="flex flex-col gap-4">
              {/* Search Input Row */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3.5 text-slate-400 w-4.5 h-4.5" />
                <Input
                  type="text"
                  placeholder="Search job titles, keywords, skills, or companies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 rounded-xl border border-slate-200 focus:ring-primary focus:border-primary font-medium text-xs text-slate-800 placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Dropdown Filters Row */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                <div className="flex flex-wrap items-center gap-3">
                  {/* City Filter */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">HQ Location</span>
                    <div className="relative flex items-center">
                      <select
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                        className="h-10 pl-4 pr-10 rounded-xl border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none text-xs font-black uppercase tracking-wider text-slate-800 bg-white min-w-[160px] appearance-none cursor-pointer select-none"
                      >
                        {uniqueCities.map(city => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    </div>
                  </div>

                  {/* Mode Filter */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Workplace Mode</span>
                    <div className="flex items-center bg-slate-100/80 rounded-xl p-1 border border-slate-200/50">
                      {['All Modes', 'Remote', 'Live'].map(mode => (
                        <button
                          key={mode}
                          onClick={() => setSelectedMode(mode)}
                          className={`h-8 px-4 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all select-none cursor-pointer ${
                            selectedMode === mode
                              ? 'bg-white text-slate-900 shadow-sm'
                              : 'text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          {mode === 'Live' ? 'Live / Onsite' : mode}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Clear Filters Action */}
                {(searchQuery || selectedCity !== 'All Cities' || selectedMode !== 'All Modes') && (
                  <button 
                    onClick={clearFilters}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer select-none self-end md:self-center"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Clear Filters</span>
                  </button>
                )}
              </div>
            </div>
          </Card>

          {/* Job Feed */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-xs text-slate-400 font-black uppercase tracking-widest">Loading job feed...</p>
            </div>
          ) : error ? (
            <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl p-6">
              <p className="text-red-500 font-bold text-sm">Failed to load job descriptions.</p>
              <p className="text-slate-400 text-xs mt-1">Please ensure backend server is active.</p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl p-6 flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                <Briefcase className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-slate-600 font-bold uppercase tracking-wider">No matching job listings found</p>
                <p className="text-[10px] text-slate-400">Try relaxing your search terms or filters above.</p>
              </div>
              {(searchQuery || selectedCity !== 'All Cities' || selectedMode !== 'All Modes') && (
                <Button size="sm" variant="outline" onClick={clearFilters} className="mt-2 h-9 rounded-xl uppercase tracking-widest text-[9px]">
                  Reset Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredJobs.map((job) => {
                const matchScore = profile ? calculateMatchScore(job, profile) : null
                const isBestMatch = matchScore !== null && matchScore >= 70
                const logoStyle = getCompanyLogoStyle(job.company_name)
                const initial = job.company_name ? job.company_name.trim().charAt(0).toUpperCase() : 'J'
                
                return (
                  <Card 
                    key={job.id} 
                    className={`relative overflow-hidden bg-white/90 backdrop-blur-md transition-all duration-300 rounded-3xl border border-slate-200/60 p-6 select-none group hover:shadow-[0_20px_40px_-15px_rgba(99,102,241,0.12)] hover:-translate-y-1 hover:bg-white ${
                      isBestMatch ? 'hover:border-indigo-500/50 bg-gradient-to-br from-white via-white to-indigo-50/5' : 'hover:border-slate-300'
                    }`}
                  >
                    {/* Premium indicator bar for top matches */}
                    {isBestMatch && (
                      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                    )}

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-start gap-4.5">
                        {/* Dynamic Company Logo Avatar */}
                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${logoStyle.bg} flex items-center justify-center font-display font-black text-lg ${logoStyle.text} shrink-0 shadow-[0_8px_20px_-6px_rgba(99,102,241,0.25)] transition-transform duration-300 group-hover:scale-105 select-none`}>
                          {initial}
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-display text-base font-extrabold text-slate-900 uppercase leading-none tracking-tight group-hover:text-primary transition-colors">
                              {job.title}
                            </h3>
                            <Badge className={`h-5 text-[8px] font-black uppercase tracking-wider ${
                              job.location_type.toLowerCase() === 'remote'
                                ? 'bg-blue-500/10 text-blue-600 border border-blue-200/50 hover:bg-blue-500/15'
                                : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-150'
                            }`}>
                              {job.location_type}
                            </Badge>
                            {/* Prominent experience required badge in the job tile */}
                            <Badge className="h-5 text-[8px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-600 border border-indigo-200/55 flex items-center gap-1 hover:bg-indigo-500/15">
                              <Sparkles className="w-2 h-2 text-indigo-500" />
                              <span>{job.min_experience}+ Years Exp Required</span>
                            </Badge>
                          </div>

                          {/* Company & Location Details */}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-slate-500 font-semibold text-xs pt-0.5">
                            <div className="flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-slate-400" />
                              {job.company_website ? (
                                <a 
                                  href={job.company_website.startsWith('http') ? job.company_website : `https://${job.company_website}`}
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="hover:text-primary hover:underline transition-colors font-black text-slate-800"
                                >
                                  {job.company_name}
                                </a>
                              ) : (
                                <span className="font-black text-slate-800">{job.company_name}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-400">
                              <MapPin className="w-3.5 h-3.5" />
                              <span className="text-slate-500 font-medium">{job.city}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-400">
                              <Briefcase className="w-3.5 h-3.5" />
                              <span className="text-slate-500 font-medium">Min {job.min_experience} yrs exp</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-400">
                              <Calendar className="w-3.5 h-3.5" />
                              <span className="text-slate-500 font-medium">{job.created_at ? new Date(job.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : "Recently"}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Skill Match Score */}
                      <div className="flex items-center gap-3 self-start md:self-center shrink-0">
                        {matchScore !== null ? (
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-[7px] font-black uppercase tracking-[0.2em] text-slate-400">Match score</span>
                            <div className={`flex items-center gap-1 px-3 py-2 rounded-2xl border text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${
                              matchScore >= 70 
                                ? "bg-emerald-50 text-emerald-600 border-emerald-200/50 shadow-[0_4px_20px_rgba(16,185,129,0.12)] hover:scale-102" 
                                : matchScore >= 45 
                                  ? "bg-amber-50 text-amber-600 border-amber-200/50 shadow-[0_4px_20px_rgba(245,158,11,0.12)] hover:scale-102" 
                                  : "bg-rose-50 text-rose-600 border-rose-200/50 shadow-[0_4px_20px_rgba(244,63,94,0.12)] hover:scale-102"
                            }`}>
                              {matchScore >= 70 && <Sparkles className="w-3.5 h-3.5 animate-pulse text-emerald-500" />}
                              <span>{matchScore}% Match</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                            Login to see match
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Skills tags */}
                    {job.core_skills && job.core_skills.length > 0 && (
                      <div className="mt-4 pt-3.5 border-t border-slate-100/80 flex flex-wrap gap-1.5">
                        {job.core_skills.map((skill, index) => {
                          const isMatched = profile?.skills?.some(s => s.toLowerCase() === skill.toLowerCase())
                          return (
                            <Badge 
                              key={index} 
                              variant={isMatched ? "default" : "outline"}
                              className={`text-[8px] px-3 py-1.5 uppercase font-black tracking-wider transition-all duration-300 rounded-xl ${
                                isMatched 
                                  ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white border-transparent shadow-md shadow-indigo-600/15 hover:scale-105 hover:shadow-indigo-600/25" 
                                  : "border-slate-200 bg-slate-50/50 text-slate-400 hover:text-slate-600 hover:border-slate-350"
                              }`}
                            >
                              {skill}
                            </Badge>
                          )
                        })}
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
          )}

        </div>

      </div>
    </AppShell>
  )
}
