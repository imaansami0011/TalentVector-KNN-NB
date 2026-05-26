import os
import pickle
import re

# Resolve paths relative to the current module directory
MODELS_DIR = os.path.dirname(__file__)
MODEL_PATH = os.path.join(MODELS_DIR, "naive_bayes_model.pkl")
VECTORIZER_PATH = os.path.join(MODELS_DIR, "vectorizer.pkl")
LABEL_ENCODER_PATH = os.path.join(MODELS_DIR, "label_encoder.pkl")

# Lazy loading of model components
_model = None
_vectorizer = None
_label_encoder = None

def load_classifier():
    global _model, _vectorizer, _label_encoder
    if _model is None:
        if not os.path.exists(MODEL_PATH) or not os.path.exists(VECTORIZER_PATH) or not os.path.exists(LABEL_ENCODER_PATH):
            raise FileNotFoundError("Classifier pkl files are missing in app/models/")
        with open(MODEL_PATH, "rb") as f:
            _model = pickle.load(f)
        with open(VECTORIZER_PATH, "rb") as f:
            _vectorizer = pickle.load(f)
        with open(LABEL_ENCODER_PATH, "rb") as f:
            _label_encoder = pickle.load(f)

# Mapping Kaggle's 25 granular categories to the 8 broader frontend sectors:
# ['Technology', 'Healthcare', 'Finance', 'Education', 'Sales', 'Management', 'Legal', 'General']
SECTOR_MAPPING = {
    "Advocate": "Legal",
    "Arts": "General",
    "Automation Testing": "Technology",
    "Blockchain": "Technology",
    "Business Analyst": "Management",
    "Civil Engineer": "General",
    "Data Science": "Technology",
    "Database": "Technology",
    "DevOps Engineer": "Technology",
    "DotNet Developer": "Technology",
    "ETL Developer": "Technology",
    "Electrical Engineering": "Technology",
    "HR": "Management",
    "Hadoop": "Technology",
    "Health and fitness": "Healthcare",
    "Java Developer": "Technology",
    "Mechanical Engineer": "Technology",
    "Network Security Engineer": "Technology",
    "Operations Manager": "Management",
    "PMO": "Management",
    "Python Developer": "Technology",
    "SAP Developer": "Technology",
    "Sales": "Sales",
    "Testing": "Technology",
    "Web Designing": "Technology"
}

def clean_text_nb(text):
    """Preprocessing function matching the training script exactly."""
    if not text:
        return ""
    text = re.sub(r'http\S+\s*', ' ', text)  # remove URLs
    text = re.sub(r'RT|cc', ' ', text)  # remove RT and cc
    text = re.sub(r'#\S+', '', text)  # remove hashtags
    text = re.sub(r'@\S+', '  ', text)  # remove mentions
    text = re.sub(r'[%s]' % re.escape("""!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~"""), ' ', text)  # remove punctuations
    text = re.sub(r'[^\x00-\x7f]', r' ', text)  # remove non-ascii
    text = re.sub(r'\s+', ' ', text)  # remove extra whitespace
    return text.strip()

def predict_sector_nb(text: str):
    """
    Cleans text, vectorizes it, predicts the sector using the Naive Bayes model,
    and returns both the raw predicted category and the mapped frontend sector.
    """
    load_classifier()
    
    cleaned = clean_text_nb(text)
    if not cleaned:
        return {
            "raw_category": "General",
            "mapped_sector": "General"
        }
        
    # Vectorize
    vec = _vectorizer.transform([cleaned])
    
    # Predict
    pred_idx = _model.predict(vec)[0]
    
    # Decode
    raw_category = _label_encoder.inverse_transform([pred_idx])[0]
    
    # Map to frontend sector
    mapped_sector = SECTOR_MAPPING.get(raw_category, "General")
    
    return {
        "raw_category": raw_category,
        "mapped_sector": mapped_sector
    }
