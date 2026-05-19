import math
from collections import Counter

def manual_ranker(jd_skills, resume_skills):
    """
    Manual Scoring Engine: Replaces Scikit-Learn.
    Calculates Cosine Similarity based on the overlap of skill vectors.
    """
    # 1. Create a unique vocabulary from both sets of skills
    vocabulary = list(set(jd_skills + resume_skills))
    
    if not vocabulary:
        return 0.0

    # 2. Vectorize: Convert skill lists into frequency arrays
    def build_vector(skills, vocab):
        # We treat each skill as a token
        count = Counter(skills)
        return [count.get(word, 0) for word in vocab]

    v_jd = build_vector(jd_skills, vocabulary)
    v_res = build_vector(resume_skills, vocabulary)

    # 3. Calculate Dot Product (The overlap)
    dot_product = sum(a * b for a, b in zip(v_jd, v_res))

    # 4. Calculate Magnitudes (The length of the arrows in vector space)
    mag_jd = math.sqrt(sum(a**2 for a in v_jd))
    mag_res = math.sqrt(sum(b**2 for b in v_res))

    # 5. Result: Dot Product / (Mag1 * Mag2)
    if mag_jd == 0 or mag_res == 0:
        return 0.0
        
    return dot_product / (mag_jd * mag_res)

def rank_resumes(job_description, resumes, target_skills=None):
    """
    Ranks resumes using the Manual Vector Space Model.
    Focuses only on extracted skills for noise reduction.
    """
    if not resumes:
        return []

    from .extractor import extract_entities
    
    # 1. Get skills from the Target Job Description
    if target_skills:
        jd_skills = target_skills
    else:
        jd_entities = extract_entities(job_description)
        jd_skills = jd_entities.get("Skills", [])

    results = []

    for res in resumes:
        candidate_skills = res.get("entities", {}).get("Skills", [])
        
        # Calculate Skill Similarity Score (0.0 to 1.0)
        skill_score = manual_ranker(jd_skills, candidate_skills)

        # Create a summary for the candidate
        res_data = {
            "filename": res.get("filename"),
            "name": res.get("name"),
            "email": res.get("email"),
            "phone": res.get("phone"),
            "designation": res.get("designation"),
            "entities": res.get("entities"),
            "years_of_experience": res.get("years_of_experience"),
            "score": round(skill_score, 4) # This will be weighted in main.py
        }
        results.append(res_data)
    
    # Sort by score descending
    results.sort(key=lambda x: x['score'], reverse=True)
    
    return results
