import * as React from "react"
import { X } from "lucide-react"
import skillsData from "../../../app/skills.json"

const POPULAR_SKILLS = Array.from(
  new Set(Object.values(skillsData).flat())
).sort()

const FEATURED_SKILLS = [
  "Python", "JavaScript", "TypeScript", "React", "React.js", "Node.js", "Java", "SQL", "PostgreSQL", 
  "Docker", "Kubernetes", "AWS", "Azure", "CI/CD", "Git", "HTML", "CSS", "Tailwind CSS", 
  "Figma", "UI/UX Design", "Machine Learning", "Deep Learning", "Data Science", "Project Management", 
  "Agile", "Scrum", "JIRA", "Selenium", "Cypress", "Pytest", "Automation Testing"
]

export function SkillsInput({ value = [], onChange, placeholder = "Add skill..." }) {
  const [inputValue, setInputValue] = React.useState("")
  const [isOpen, setIsOpen] = React.useState(false)
  const containerRef = React.useRef(null)

  // Normalize value to ensure it is always an array
  const skillsArray = Array.isArray(value) ? value : []

  // Close dropdown on click outside
  React.useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleAddSkill = (skillName) => {
    const cleaned = skillName.trim()
    if (!cleaned) return
    
    // Check duplicates case-insensitively
    if (!skillsArray.some(s => s.toLowerCase() === cleaned.toLowerCase())) {
      const newSkills = [...skillsArray, cleaned]
      onChange(newSkills)
    }
    setInputValue("")
    setIsOpen(false)
  }

  const handleRemoveSkill = (skillToRemove) => {
    const newSkills = skillsArray.filter(s => s !== skillToRemove)
    onChange(newSkills)
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      if (inputValue.trim()) {
        handleAddSkill(inputValue)
      }
    } else if (e.key === "Backspace" && !inputValue && skillsArray.length > 0) {
      handleRemoveSkill(skillsArray[skillsArray.length - 1])
    }
  }

  // Filter and sort suggestions (Featured first, then alphabetical, up to 100 suggestions)
  const suggestions = React.useMemo(() => {
    const query = inputValue.trim().toLowerCase()
    
    // Filter out already selected
    const available = POPULAR_SKILLS.filter(skill => {
      const isSelected = skillsArray.some(s => s.toLowerCase() === skill.toLowerCase())
      return !isSelected
    })

    let filtered = []
    if (!query) {
      filtered = available
    } else {
      filtered = available.filter(skill => 
        skill.toLowerCase().includes(query)
      )
    }

    // Sort: Featured skills first, then alphabetical
    const sorted = [...filtered].sort((a, b) => {
      const aFeatured = FEATURED_SKILLS.some(fs => fs.toLowerCase() === a.toLowerCase())
      const bFeatured = FEATURED_SKILLS.some(fs => fs.toLowerCase() === b.toLowerCase())
      if (aFeatured && !bFeatured) return -1
      if (!aFeatured && bFeatured) return 1
      return a.localeCompare(b)
    })

    return sorted.slice(0, 100) // Show up to 100 matching suggestions, scrollable!
  }, [inputValue, skillsArray])

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Container simulating input */}
      <div 
        onClick={() => {
          containerRef.current.querySelector("input")?.focus()
          setIsOpen(true)
        }}
        className="flex flex-wrap gap-1.5 p-2 rounded-xl border border-slate-200 bg-white min-h-[38px] cursor-text focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-all w-full"
      >
        {skillsArray.map((skill, idx) => (
          <span 
            key={idx} 
            className="inline-flex items-center gap-1 pl-2.5 pr-1 py-0.5 rounded-lg text-[11px] font-bold bg-primary/10 text-primary border border-primary/10 select-none animate-fadeIn"
          >
            <span>{skill}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleRemoveSkill(skill)
              }}
              className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-primary/20 transition-colors text-primary focus:outline-none"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </span>
        ))}
        
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            setIsOpen(true)
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={skillsArray.length === 0 ? placeholder : "Add more..."}
          className="flex-1 bg-transparent border-none outline-none text-xs min-w-[80px] py-0.5 text-slate-800 placeholder:text-slate-400 focus:ring-0 focus:outline-none"
        />
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-200/80 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-1">
          <div className="p-1.5 space-y-0.5">
            {suggestions.map((skill) => (
              <button
                key={skill}
                type="button"
                onClick={() => handleAddSkill(skill)}
                className="w-full text-left px-3 py-2 text-xs font-medium text-slate-755 hover:bg-slate-50 hover:text-primary transition-colors rounded-lg flex items-center justify-between cursor-pointer"
              >
                <span>{skill}</span>
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-300">Popular</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
