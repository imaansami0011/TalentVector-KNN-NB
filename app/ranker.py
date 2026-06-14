import math
import numpy as np
from sklearn.neighbors import NearestNeighbors
from collections import Counter

def manual_ranker(jd_skills, resume_skills):
    """
    KNN Scoring Engine: Replaces Cosine Similarity.
    Calculates L2-normalized Euclidean distance-based similarity using NearestNeighbors.
    """
    if not jd_skills or not resume_skills:
        return 0.0

    # 1. Create a unique vocabulary from both sets of skills
    vocabulary = list(set(jd_skills + resume_skills))
    
    if not vocabulary:
        return 0.0

    # 2. Vectorize: Convert skill lists into binary occurrence arrays
    v_jd = np.array([1 if word in jd_skills else 0 for word in vocabulary])
    v_res = np.array([1 if word in resume_skills else 0 for word in vocabulary])

    # 3. L2 normalize the vectors
    norm_jd = np.linalg.norm(v_jd)
    norm_res = np.linalg.norm(v_res)
    
    if norm_jd == 0 or norm_res == 0:
        return 0.0
        
    v_jd_norm = v_jd / norm_jd
    v_res_norm = v_res / norm_res

    # 4. Fit NearestNeighbors on candidate vector
    X = np.array([v_res_norm])
    query = np.array([v_jd_norm])

    nbrs = NearestNeighbors(n_neighbors=1, metric='euclidean')
    nbrs.fit(X)
    distances, _ = nbrs.kneighbors(query)
    distance = float(distances[0][0])

    # 5. Convert L2-normalized Euclidean distance to similarity score in [0, 1]
    # score = 1.0 - 0.5 * (distance ** 2) is mathematically identical to Cosine Similarity
    score = 1.0 - 0.5 * (distance ** 2)
    return max(0.0, min(1.0, score))

def rank_resumes(job_description, resumes, target_skills=None):
    """
    Ranks resumes using KNN NearestNeighbors with L2-normalized Euclidean distance.
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

    # Get skills for all candidates
    candidate_skills_list = []
    for res in resumes:
        candidate_skills = res.get("entities", {}).get("Skills", [])
        candidate_skills_list.append(candidate_skills)

    if not jd_skills or not any(candidate_skills_list):
        # Fallback if no skills are present
        for res in resumes:
            res_data = {
                "filename": res.get("filename"),
                "name": res.get("name"),
                "email": res.get("email"),
                "phone": res.get("phone"),
                "designation": res.get("designation"),
                "entities": res.get("entities"),
                "years_of_experience": res.get("years_of_experience"),
                "cv_file_path": res.get("cv_file_path"),
                "score": 0.0
            }
            results.append(res_data)
        return results

    # 2. Build global vocabulary for this batch
    vocabulary = list(set(jd_skills + [s for sublist in candidate_skills_list for s in sublist]))

    # 3. Vectorize and L2 normalize
    X = []
    for cand_skills in candidate_skills_list:
        v = np.array([1 if word in cand_skills else 0 for word in vocabulary])
        norm = np.linalg.norm(v)
        if norm > 0:
            v = v / norm
        X.append(v)
    X = np.array(X)

    v_jd = np.array([1 if word in jd_skills else 0 for word in vocabulary])
    norm_jd = np.linalg.norm(v_jd)
    if norm_jd > 0:
        v_jd = v_jd / norm_jd
    query = np.array([v_jd])

    # 4. Fit NearestNeighbors on all candidate vectors
    nbrs = NearestNeighbors(n_neighbors=len(resumes), metric='euclidean')
    nbrs.fit(X)
    distances, indices = nbrs.kneighbors(query)

    # Map indices back to similarity scores
    idx_to_score = {}
    for dist, idx in zip(distances[0], indices[0]):
        score = 1.0 - 0.5 * (float(dist) ** 2)
        idx_to_score[idx] = max(0.0, min(1.0, score))

    for idx, res in enumerate(resumes):
        skill_score = idx_to_score.get(idx, 0.0)
        res_data = {
            "filename": res.get("filename"),
            "name": res.get("name"),
            "email": res.get("email"),
            "phone": res.get("phone"),
            "designation": res.get("designation"),
            "entities": res.get("entities"),
            "years_of_experience": res.get("years_of_experience"),
            "cv_file_path": res.get("cv_file_path"),
            "score": round(skill_score, 4)
        }
        results.append(res_data)
    
    # Sort by score descending
    results.sort(key=lambda x: x['score'], reverse=True)
    
    return results

