# SwasthyaCare - Smart Medicine & Pediatric Dosage Clinical Calculator

A clinical web application designed to help patients and caregivers determine the right over-the-counter and first-line medicines, clinically accurate single dosages (in **mg** and **ml**), administration frequency, pregnancy safety, and comorbidity contraindications.

---

## 🌟 Key Features

1. **Patient Profile First**:
   - Gender selection (Male, Female, Other).
   - Age in Years & Months with 1-tap quick presets (Infant, 1.5yr Toddler, 5yr Child, Adult, Pregnant Woman).
   - Body weight (kg) with standard **WHO child growth chart auto-estimator**.
   - **Pregnancy & Breastfeeding** assessment (revealed for females >= 12 yrs).
   - **Pre-existing Health Conditions (Comorbidities)**:
     - Heart Problem (NSAIDs blocked)
     - Asthma (NSAIDs blocked to prevent bronchospasms)
     - Diabetes (Sugar-free syrup guidance)
     - High Blood Pressure, Liver disease, Kidney disease, and Stomach Ulcers.

2. **Illness & Symptoms Covered**:
   - 🌡️ Fever & High Temperature (with temperature in °F)
   - 🤧 Common Cold, Cough & Congestion
   - 💧 Diarrhea & Loose Motions (WHO ORS & Zinc supplementation)
   - 🤢 Vomiting & Nausea (Ondansetron syrup/drops)
   - 👶 Stomach Pain, Gas & Infant Colic
   - 🌿 Allergies, Skin Rashes & Itching

3. **Decorative & Clear Output Presentation**:
   - Target single dose in **mg** with safe minimum-to-maximum range bar.
   - Commercial bottle volume guide in **ml** (Drops, 120mg syrup, 250mg DS syrup) with spoon guides.
   - Clear red contraindication warning shields for dangerous drugs.
   - Pink badges for pregnancy-safe medications.
   - Print prescription slip & WhatsApp sharing button.

---

## 🚀 Quick Start (Local Run)

### Method 1: 1-Click Launcher (Windows)
Double-click `start_website.bat`. It will start the server and automatically launch `http://127.0.0.1:5000` in your default browser.

### Method 2: Manual Run
```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Run the application
python app.py
```
Open `http://127.0.0.1:5000` in your web browser.

### Method 3: 100% Offline Standalone
Double-click `standalone.html` to run the calculator directly in any web browser without needing a server or Python.

---

## 📁 Project Structure

```text
med-dosage-helper/
├── app.py                 # Flask web backend & REST APIs
├── calculator.py          # Clinical pharmacology dosage engine
├── data/
│   └── medicines_db.json  # Comprehensive clinical medicine database
├── templates/
│   └── index.html         # User-first responsive frontend UI
├── static/
│   ├── css/styles.css     # Custom styles & print layout
│   └── js/app.js          # Dynamic UI, calculations & interactions
├── standalone.html        # Portable single-file offline edition
├── requirements.txt       # Python dependencies
├── start_website.bat      # 1-click Windows starter
└── README.md              # Documentation
```

---

## ⚠️ Medical Disclaimer
This software is intended for educational and clinical first-aid guidance only. It is not a substitute for professional medical diagnosis or personalized pediatric care. In medical emergencies, seek immediate care at the nearest hospital.
