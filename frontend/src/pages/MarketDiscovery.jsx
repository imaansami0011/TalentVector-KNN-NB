import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function MarketDiscovery() {
  const navigate = useNavigate();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All Jobs');
  
  const userPicture = localStorage.getItem('user_picture');
  const userName = localStorage.getItem('user_name') || 'JS';
  const userInitials = userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const categories = ['All Jobs', 'Engineering', 'Design', 'Marketing', 'Product', 'Operations'];

  const jobs = [
    { 
      id: 1, 
      title: 'Senior Frontend Engineer', 
      company: 'Stellar Cloud Systems', 
      sector: 'Engineering', 
      location: 'Remote (Global)', 
      description: 'We are looking for a visionary Frontend Lead to help build our next-generation enterprise infrastructure dashboard. You will be working with React, TypeScript, and Tailwind CSS...',
      salary: '$140k - $180k', 
      type: 'Full-time',
      time: '2 hours ago',
      logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCqXfdq21bWusiSUCu_nhulrYsqttVSfui1wzGemqZthFTcixgEZia9JU-_WsQnQfNYIZaHwkLqCizouvmB4b6IgFbqta2CEcmr-YKve6Qj9PZ8B23tNNjxf4cCKwpU9pSGlQA6jkZiIA1huTdahiO8HutYv1OwPLLSNT84uQ9S9farMeJDeRy2yQuUDWtsxzoLBgr2eNbCcixNnNZxVpk0-5VsMtbvFhprgwsoPy6ifWc1ivLb2mt_CLFiU8qwXgnVH-xwlTOiunp3'
    },
    { 
      id: 2, 
      title: 'Lead Product Designer', 
      company: 'Design Lab NYC', 
      sector: 'Design', 
      location: 'New York, NY', 
      description: "Join our creative studio in Manhattan to shape the future of digital products for Fortune 500 clients. You'll lead high-impact design sprints and mentor junior talent...",
      salary: '$160k+', 
      type: 'Hybrid',
      time: '5 hours ago',
      logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDB6XlL4s4KowcdSabzRWUMsfTtNhLLdN-1WLcgcV3fU4n_Ar_n8rEQgsNIk7BC6PXDm3WiWs3digiNStB6zDQvXwwIT8ZwOjH8qNaKdVPHHR0Pj4ysf4HvPvJkhBSQ3d54Aus9jAyPMvY8R2JGmbLmPCy3PadQNavBQbsq-vR-Y7w2JeiKrcmAvtJ0KqjeyKK4J5azFzuDyZ3n_j3FP8eAhlrajHAqPRqHNqd4tsEqoWixS2FSesjIl3sl9USQ24fcFuHpbN8rnE1P'
    },
    { 
      id: 3, 
      title: 'Growth Marketing Manager', 
      company: 'Finflow Solutions', 
      sector: 'Marketing', 
      location: 'Remote', 
      description: 'Drive user acquisition and scale our presence in international markets. We are seeking a data-driven marketer with experience in B2B performance campaigns...',
      salary: '$80/hr', 
      type: 'Contract',
      time: 'Yesterday',
      logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBPtjYJuLEybJAKXXqtBYquE3u4ZtRWbYzFJL3RJsadvfgPAbIvjGqCKXh7HJRhWBqdwVHn8o_yp8vb53au0PflJaBJyFGTApilWOIZAZGYQQkLeRmsJzRQSyPPFExdf8rX-dMS4QwlD8ju-RuE_gHN50EwvlZXvCIYCpzOB7MjnHNjfmYUarRNBe0iUOF29U3cwXTgspJ8pHJ2I6k-Ie-qmo1uIaA0PV2DX_2xc5lkgPn7whzXqdjRowo7zsICHFwZJiJ9X3Da6zkT'
    },
    { 
      id: 4, 
      title: 'Junior Backend Developer', 
      company: 'SwiftStack AI', 
      sector: 'Engineering', 
      location: 'San Francisco, CA', 
      description: "Kickstart your career with a fast-growing AI startup. You'll contribute to core APIs and learn from a world-class team of engineers. Proficiency in Python or Node.js is required...",
      salary: '$95k - $120k', 
      type: 'Full-time',
      time: '2 days ago',
      logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAvoKDjq8FwaST_UzuEYOdom5enWA74r1_g9hJOWEwylb2eilLMimn4sMebyAxHsSZTh-uUU-MLQMm4nPaKEYtfSlB4NyNU9bWvfjfzaNt5CTwhTS8S7d2R5RBuyZQPZW1p6o1Qd_VE_2b5h9saXESpMhvkQsJtMTdeLxT_f9cZn2vxshqgDcPu3JUinsWIh-L25XEX_3b1JbskCstqLjdAZbB_K1NheGV8z5NAalW-7khH5swmA9TuKnh6icRyI3u1v-FrG2iREJTo'
    },
  ];

  return (
    <div className="min-h-screen bg-surface font-body text-on-surface">
      {/* Header */}
      <header className="bg-surface sticky top-0 z-50 flex justify-between items-center w-full px-margin-mobile py-base border-b border-outline-variant shadow-sm">
        <div className="flex items-center gap-4">
          <div className="relative">
            <button 
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="w-10 h-10 rounded-full border-2 border-white shadow-sm flex items-center justify-center font-bold text-slate-600 overflow-hidden ring-offset-2 hover:ring-2 hover:ring-primary transition-all"
            >
              {userPicture ? (
                <img src={userPicture} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm">{userInitials}</span>
              )}
            </button>
            
            {isProfileMenuOpen && (
              <div className="absolute left-0 mt-3 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-4 py-2 border-b border-slate-100 mb-1">
                  <p className="text-sm font-bold text-slate-800 truncate">{userName}</p>
                </div>
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-rose-600 hover:bg-rose-50 transition-colors text-left"
                >
                  <span className="material-symbols-outlined text-sm">logout</span> Logout
                </button>
              </div>
            )}
          </div>
          <h1 className="font-headline text-headline-md font-bold text-primary">TALENT VECTOR</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <button className="text-on-surface-variant hover:bg-surface-container-low transition-colors p-2 rounded-full active:opacity-80 active:scale-95">
            <span className="material-symbols-outlined">notifications</span>
          </button>
        </div>
      </header>

      <main className="max-w-[1024px] mx-auto px-margin-mobile md:px-margin-desktop py-stack-md pb-32 animate-fadeIn">
        {/* Search */}
        <section className="mb-stack-md">
          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-outline">search</span>
            </div>
            <input 
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary focus:border-primary transition-all font-body text-on-surface shadow-sm" 
              placeholder="Search job title, keyword, or company" 
              type="text" 
            />
          </div>
        </section>

        {/* Categories */}
        <section className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
          {categories.map(category => (
            <button 
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`flex-shrink-0 px-6 py-2 rounded-full font-label-md transition-all active:scale-95 ${
                activeCategory === category 
                ? 'bg-primary text-on-primary shadow-lg shadow-primary/20' 
                : 'bg-surface-container border border-outline-variant text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {category}
            </button>
          ))}
        </section>

        {/* Job Listings */}
        <section className="space-y-stack-sm mt-stack-sm">
          {jobs.filter(j => activeCategory === 'All Jobs' || j.sector === activeCategory).map(job => (
            <div key={job.id} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 group hover:shadow-lg transition-all cursor-pointer">
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center overflow-hidden shrink-0">
                    <img className="w-8 h-8 object-contain" alt={job.company} src={job.logo} />
                  </div>
                  <div>
                    <h3 className="font-headline text-headline-md text-primary mb-1 group-hover:translate-x-1 transition-transform">{job.title}</h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-on-surface-variant text-body-sm">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[18px]">corporate_fare</span>
                        {job.company}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[18px]">location_on</span>
                        {job.location}
                      </span>
                    </div>
                  </div>
                </div>
                <button className="text-outline hover:text-primary transition-colors">
                  <span className="material-symbols-outlined">bookmark</span>
                </button>
              </div>
              <div className="mt-4">
                <p className="text-on-surface-variant text-body-md line-clamp-2 leading-relaxed">
                  {job.description}
                </p>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex gap-2">
                  <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-label-sm font-semibold">{job.type}</span>
                  <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-label-sm font-semibold">{job.salary}</span>
                </div>
                <span className="text-outline text-label-sm">{job.time}</span>
              </div>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
