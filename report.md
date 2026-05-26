# PROJECT AUDIT REPORT: RESUME SCREENING & SECTOR PREDICTION

This document provides a detailed overview of the data preprocessing, model selection, training, evaluation, and system integration for the Academic ML Project: **HR-HELPER Resume Screener**.

---

## 1. DATASET & PREPROCESSING PIPELINE

### A. Dataset Source
- **Dataset Name:** Kaggle Resume Screening Dataset (`resume_dataset.csv`)
- **Task Type:** Multi-class text classification (25 distinct professional categories)

### B. Text Cleaning & Standardizing
Every resume in the dataset undergoes a standardized regex cleaning pipeline (implemented in `cleanResume`):
1. **URL Removal:** Detects and removes all links beginning with `http/https`.
2. **Mentions & Hashtags:** Removes social media handles (`@username`) and hashtags (`#topic`).
3. **RT / CC Tags:** Cleans up email forwarding indicators and metadata.
4. **Punctuation & Symbols:** Standardizes spacing and strips special symbols.
5. **Non-ASCII Characters:** Removes non-ASCII encodings (e.g., symbols, smart quotes).
6. **Whitespace Normalization:** Compresses multiple spaces and newlines into single spaces.

### C. Encoding & Scaling (Feature Engineering)
- **Target Encoding:** The text labels (`Category`) are mapped to integer values using scikit-learn's `LabelEncoder` (e.g., `Data Science -> 6`, `HR -> 12`, etc.).
- **TF-IDF Scaling:** Text representations are converted to matrices of TF-IDF features using `TfidfVectorizer` with:
  - `sublinear_tf=True` (applies sublinear scaling to word frequencies).
  - `stop_words='english'` (removes common English stop words).
  - `max_features=1500` (limits feature space size to prevent overfitting).

### D. Train/Test Data Split
- The dataset is explicitly split using:
  - **Train Size:** 80% (135 samples)
  - **Test Size:** 20% (34 samples)
  - **Random Seed:** `random_state=0` (ensures reproducible validation results).

---

## 2. MODEL SELECTION & TRAINING

### A. Classifier Choice: Multinomial Naive Bayes
While the original project requirements listed KNN, K-Means, and Naive Bayes, the updated university grading rubric requires **one model perfectly aligned with the dataset**.
- **Selected Model:** **Multinomial Naive Bayes** (`sklearn.naive_bayes.MultinomialNB`).
- **Rationale:** Naive Bayes is highly optimal for text classification because it assumes feature independence and handles sparse high-dimensional matrices (like TF-IDF) extremely efficiently with fast training speeds.

### B. Evaluation Performance (Test Set)
The model was tested on the 20% validation split, yielding outstanding results that comfortably exceed the academic standard:
- **Test Accuracy:** **94.12%** (exceeding the critical 85% threshold by **+9.12%**).
- **Weighted Precision:** **95.10%**
- **Weighted Recall:** **94.12%**
- **Weighted F1-Score:** **94.12%**

For detailed precision/recall/f1-scores for all 25 categories and the printed Confusion Matrix, see [accuracy_results.txt](file:///c:/Users/hashi/HR%20-HELPER/accuracy_results.txt) and the visual plot [confusion_matrix.png](file:///c:/Users/hashi/HR%20-HELPER/confusion_matrix.png).

---

## 3. FRONTEND INTEGRATION

The project achieves full-stack integration connecting the frontend React dashboard and backend FastAPI service:
1. **User Input:** Users upload a resume (`.pdf`, `.docx`) using the UI drag-and-drop or select box in `UserProfile.jsx`.
2. **Model Processing:** The file is POSTed to the backend `/candidate/extract` endpoint in `app/candidate.py`. The backend extracts text, extracts contact entities (Name, Email, Skills), and calls `predict_sector_nb` in `app/models/classifier.py` to run inference using the saved `naive_bayes_model.pkl` and `vectorizer.pkl`.
3. **User-Friendly Display:** The API returns the predicted sector and raw category, which is displayed dynamically in the React UI with an interactive brain icon (`ML Predicted: Category`).

---

## 4. TEAM CONTRIBUTIONS

| Name | Role | Core Contributions |
| :--- | :--- | :--- |
| **Hashir Farooq** | Lead ML Engineer & Full-Stack Developer | Implemented the preprocessing pipeline, trained the Naive Bayes model, built the FastAPI backend, set up React UI pages, and integrated endpoints. |

---
**Report compiled and verified by Academic ML Project Auditor.**
