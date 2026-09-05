import json
import os
import math

DB_PATH = os.path.join(os.path.dirname(__file__), 'data', 'medicines_db.json')

def load_db():
    with open(DB_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)

def estimate_child_weight(age_in_years):
    """
    Estimates patient weight in kg based on WHO and Indian Academy of Pediatrics (IAP) clinical standards:
    - 0 to 3 months: ~4.5 kg
    - 3 to 6 months: ~6.5 kg
    - 6 to 12 months: ~9.0 kg
    - 1 to 5 years: (Age + 4) * 2  [e.g., 1.5 yrs -> 11.0 kg]
    - 5 to 12 years: Age * 3 + 3  [e.g., 6 yrs -> 21.0 kg]
    - Adults: ~60 kg
    """
    if age_in_years <= 0.25:
        return 4.5
    elif age_in_years <= 0.5:
        return 6.5
    elif age_in_years <= 1.0:
        return 9.0
    elif age_in_years <= 5.0:
        return round((age_in_years + 4) * 2, 1)
    elif age_in_years <= 12.0:
        return round((age_in_years * 3) + 3, 1)
    else:
        return 60.0

def format_spoon_measure(ml):
    """Translates ml to household measuring advice"""
    if ml <= 1.5:
        return f"{ml:.1f} ml (Use calibrated dropper)"
    elif abs(ml - 2.5) <= 0.3:
        return f"{ml:.1f} ml (Half teaspoon / ~0.5 tsp)"
    elif abs(ml - 5.0) <= 0.3:
        return f"{ml:.1f} ml (1 full 5ml teaspoon)"
    elif abs(ml - 7.5) <= 0.3:
        return f"{ml:.1f} ml (1.5 teaspoons)"
    elif abs(ml - 10.0) <= 0.4:
        return f"{ml:.1f} ml (2 full teaspoons)"
    else:
        return f"{ml:.1f} ml (Measure using bottle cap or oral syringe)"

def calculate_dosage(disease_id, age_years=0, age_months=0, weight_kg=0.0, 
                     temperature_f=None, gender='male', is_pregnant=False, 
                     trimester=None, is_breastfeeding=False, comorbidities=None):
    """
    Calculates detailed dosage, syrup volumes, pregnancy safety, comorbidity adjustments, and alerts.
    """
    db = load_db()
    comorbidities = comorbidities or ['none']
    if isinstance(comorbidities, str):
        comorbidities = [comorbidities]
        
    total_months = (age_years * 12) + age_months
    total_years = total_months / 12.0
    
    weight_was_estimated = False
    if not weight_kg or weight_kg <= 0:
        weight_kg = estimate_child_weight(total_years)
        weight_was_estimated = True
    else:
        weight_kg = float(weight_kg)
        
    disease = next((d for d in db.get('diseases', []) if d['id'] == disease_id), None)
    if not disease:
        return {'error': 'Disease not found'}

    critical_alerts = []
    special_advisories = []
    
    # 1. Age Red-Flag Check
    if total_months < 3:
        critical_alerts.append({
            'type': 'danger',
            'title': 'Emergency Infant Alert (< 3 Months)',
            'message': 'Infants younger than 3 months must NEVER be self-medicated. Any fever (>100.4°F) or severe symptom requires immediate consultation with a certified pediatrician/hospital.'
        })
        
    # 2. Temperature Red-Flag Check
    if temperature_f and temperature_f >= 102.0:
        critical_alerts.append({
            'type': 'warning',
            'title': 'High Fever Alert (>= 102°F)',
            'message': f'Body temperature is {temperature_f}°F. Sponge body with normal lukewarm water. If fever persists over 1-2 hours or convulsions occur, seek emergency medical care immediately.'
        })

    # 3. Pregnancy Advisory & Safety Checks
    if is_pregnant:
        tri_text = f" (Trimester {trimester})" if trimester else ""
        special_advisories.append({
            'type': 'pregnancy',
            'title': f'Pregnancy Clinical Guidance{tri_text}',
            'message': 'Maternal fever must be brought down promptly as elevated body temperature can impact fetal health. Paracetamol is the safest gold-standard medicine in pregnancy. NSAIDs (Ibuprofen, Aspirin) are strictly prohibited.'
        })

    # 4. Comorbidities Alerts
    if 'heart_disease' in comorbidities:
        special_advisories.append({
            'type': 'comorbidity',
            'title': 'Cardiac / Heart Patient Safety Notice',
            'message': 'Patients with heart conditions or hypertension must strictly avoid NSAIDs (Ibuprofen) as they promote sodium/fluid retention and increase the risk of cardiovascular events and heart failure exacerbation. Paracetamol is the safe fever & pain medicine of choice.'
        })
    if 'asthma' in comorbidities:
        special_advisories.append({
            'type': 'comorbidity',
            'title': 'Asthma Patient Safety Notice',
            'message': 'Patients with asthma must strictly avoid NSAIDs (such as Ibuprofen and Aspirin) as they can trigger severe bronchospasms and acute asthma attacks. Paracetamol is safe to use.'
        })
    if 'diabetes' in comorbidities:
        special_advisories.append({
            'type': 'comorbidity',
            'title': 'Diabetes Care Notice',
            'message': 'Choose sugar-free syrup formulations. Illness and fever commonly cause temporary blood glucose spikes; monitor your sugar levels regularly.'
        })
    if 'liver_disease' in comorbidities:
        special_advisories.append({
            'type': 'comorbidity',
            'title': 'Liver Condition Notice',
            'message': 'Impaired liver function requires reduced Paracetamol dosage (maximum 2,000 mg per day across all doses). Avoid hepatotoxic medications.'
        })
    if 'kidney_disease' in comorbidities:
        special_advisories.append({
            'type': 'comorbidity',
            'title': 'Kidney Disease (CKD) Notice',
            'message': 'Avoid NSAIDs (Ibuprofen) which reduce renal blood flow and can worsen kidney function. Use Paracetamol with appropriate dosage intervals.'
        })
    if 'hypertension' in comorbidities:
        special_advisories.append({
            'type': 'comorbidity',
            'title': 'High Blood Pressure Notice',
            'message': 'Avoid multi-symptom cold syrups containing oral decongestants (pseudoephedrine/phenylephrine) which cause blood vessel constriction and raise blood pressure.'
        })
    if 'stomach_ulcers' in comorbidities:
        special_advisories.append({
            'type': 'comorbidity',
            'title': 'Acid Peptic Disease / Stomach Ulcer Notice',
            'message': 'Avoid NSAIDs (Ibuprofen) which irritate the gastric mucosal lining and increase risk of gastrointestinal bleeding. Take Paracetamol with or after meals.'
        })

    prescribed_medicines = []
    
    for med in disease.get('medicines', []):
        min_age = med.get('min_age_months', 0)
        if total_months < min_age:
            continue
            
        is_contraindicated = False
        contraindication_reason = ''
        pregnancy_status = 'SAFE' if is_pregnant else 'STANDARD'
        
        # Check Pregnancy Contraindications
        if is_pregnant:
            if med['id'] == 'ibuprofen':
                is_contraindicated = True
                contraindication_reason = 'STRICTLY PROHIBITED IN PREGNANCY: NSAIDs increase the risk of miscarriage in early pregnancy and cause premature closure of the fetal ductus arteriosus and low amniotic fluid (oligohydramnios) in the third trimester.'
                pregnancy_status = 'STRICTLY CONTRAINDICATED'
            elif med['id'] == 'paracetamol':
                pregnancy_status = 'SAFE IN PREGNANCY (Gold Standard Choice)'
                
        # Check Comorbidity Contraindications
        if 'heart_disease' in comorbidities and med['id'] == 'ibuprofen':
            is_contraindicated = True
            contraindication_reason = 'CONTRAINDICATED IN HEART DISEASE: NSAIDs cause fluid retention, elevate arterial blood pressure, and increase risk of cardiovascular thromboembolic events and heart failure.'

        if 'asthma' in comorbidities and med['id'] == 'ibuprofen':
            is_contraindicated = True
            contraindication_reason = 'CONTRAINDICATED IN ASTHMA: NSAIDs like Ibuprofen can trigger severe, potentially life-threatening bronchospasm.'
            
        if 'kidney_disease' in comorbidities and med['id'] == 'ibuprofen':
            is_contraindicated = True
            contraindication_reason = 'CONTRAINDICATED IN KIDNEY DISEASE: NSAIDs impair renal perfusion and can precipitate acute kidney injury.'

        if 'stomach_ulcers' in comorbidities and med['id'] == 'ibuprofen':
            is_contraindicated = True
            contraindication_reason = 'CONTRAINDICATED IN ULCERS: NSAIDs cause direct gastric irritation and heighten risk of GI bleeding.'

        med_result = {
            'id': med['id'],
            'name': med['name'],
            'brand_names': med['brand_names'],
            'role': med['role'],
            'is_first_line': med.get('is_first_line', False),
            'is_contraindicated': is_contraindicated,
            'contraindication_reason': contraindication_reason,
            'pregnancy_status': pregnancy_status,
            'warnings': med.get('warnings', []),
            'formulations_calculated': []
        }
        
        # 1. Weight-based dosage calculation (Paracetamol, Ibuprofen, Ondansetron)
        if 'dosage_formula' in med:
            formula = med['dosage_formula']
            min_mg = round(weight_kg * formula['mg_per_kg_min'], 1)
            rec_mg = round(weight_kg * formula['recommended_mg_per_kg'], 1)
            max_mg = round(weight_kg * formula['mg_per_kg_max'], 1)
            
            # Adult and safety caps
            if med['id'] == 'paracetamol':
                rec_mg = min(rec_mg, 650.0)
                max_mg = min(max_mg, 650.0)
                daily_cap = 2000.0 if 'liver_disease' in comorbidities else 3000.0
                max_daily_mg = min(round(weight_kg * formula['max_mg_per_kg_per_day'], 1), daily_cap)
            elif med['id'] == 'ibuprofen':
                rec_mg = min(rec_mg, 400.0)
                max_mg = min(max_mg, 400.0)
                max_daily_mg = min(round(weight_kg * formula['max_mg_per_kg_per_day'], 1), 1200.0)
            else:
                max_daily_mg = round(rec_mg * formula.get('max_doses_per_day', 3), 1)

            med_result['dose_mg'] = {
                'recommended': rec_mg,
                'range_min': min_mg,
                'range_max': max_mg,
                'max_daily_mg': max_daily_mg,
                'interval': formula['interval_hours'],
                'max_doses_per_day': formula['max_doses_per_day']
            }
            
            # Formulations conversion
            for form in med.get('formulations', []):
                if 'mg_per_ml' in form:
                    # Liquid: Drops or Syrup
                    rec_ml = round(rec_mg / form['mg_per_ml'], 1)
                    min_ml = round(min_mg / form['mg_per_ml'], 1)
                    max_ml = round(max_mg / form['mg_per_ml'], 1)
                    
                    med_result['formulations_calculated'].append({
                        'type': form['type'],
                        'label_en': form['label_en'],
                        'label_hi': form['label_hi'],
                        'strength': f"{form['mg_per_ml']} mg/ml",
                        'dose_ml': rec_ml,
                        'range_ml': f"{min_ml} - {max_ml} ml",
                        'measure_guide': format_spoon_measure(rec_ml),
                        'popular_brands': form.get('popular_brands', ''),
                        'suitable_for': form.get('suitable_for', '')
                    })
                elif 'mg_per_unit' in form:
                    # Tablet: Check if suitable (usually >= 12 yrs or >= 35 kg)
                    units = round(rec_mg / form['mg_per_unit'], 1)
                    if total_years >= 12 or weight_kg >= 35:
                        med_result['formulations_calculated'].append({
                            'type': form['type'],
                            'label_en': form['label_en'],
                            'label_hi': form['label_hi'],
                            'strength': f"{form['mg_per_unit']} mg per tablet",
                            'dose_tablet': f"{round(units)} tablet(s)",
                            'popular_brands': form.get('popular_brands', ''),
                            'suitable_for': form.get('suitable_for', '')
                        })
                        
        # 2. Rule-based dosage calculation (ORS, Zinc, Cetirizine, Simethicone, Saline)
        elif 'dosage_rules' in med:
            rules = med['dosage_rules']
            specific_dose_en = ''
            
            if med['id'] == 'ors':
                if total_years < 2.0:
                    specific_dose_en = rules['under_2_years']
                elif total_years <= 10.0:
                    specific_dose_en = rules['age_2_to_10_years']
                else:
                    specific_dose_en = rules['older_and_adults']
            elif med['id'] == 'zinc':
                if total_months < 6:
                    specific_dose_en = rules['under_6_months']
                    rec_ml = 2.5
                else:
                    specific_dose_en = rules['above_6_months']
                    rec_ml = 5.0
                med_result['formulations_calculated'].append({
                    'type': 'syrup_20',
                    'label_en': 'Zinc Syrup (20 mg / 5 ml)',
                    'label_hi': 'जिंक सिरप (20 mg / 5 ml)',
                    'strength': '20 mg / 5 ml',
                    'dose_ml': rec_ml,
                    'measure_guide': format_spoon_measure(rec_ml),
                    'popular_brands': 'Zinconia, Zincovit'
                })
            elif 'cetirizine' in med['id']:
                if total_months < 12:
                    specific_dose_en = rules.get('age_6_to_12_months', '2.5 mg once daily')
                    rec_ml = 2.5
                elif total_years <= 2.0:
                    specific_dose_en = rules.get('age_1_to_2_years', '2.5 mg once or twice daily')
                    rec_ml = 2.5
                elif total_years <= 6.0:
                    specific_dose_en = rules.get('age_2_to_6_years', '2.5 - 5 mg once daily')
                    rec_ml = 2.5
                else:
                    specific_dose_en = rules.get('above_6_years', '5 - 10 mg once daily')
                    rec_ml = 5.0
                med_result['formulations_calculated'].append({
                    'type': 'syrup_5',
                    'label_en': 'Syrup Cetirizine (5 mg / 5 ml)',
                    'label_hi': 'सिरप सिट्रिज़िन (5 mg / 5 ml)',
                    'strength': '5 mg / 5 ml',
                    'dose_ml': rec_ml,
                    'measure_guide': format_spoon_measure(rec_ml),
                    'popular_brands': 'Cetzine, Alerid'
                })
            elif med['id'] == 'nasal_saline':
                specific_dose_en = rules.get('all_ages', '2 to 3 drops in each nostril')
            elif med['id'] == 'simethicone':
                if total_months < 6:
                    specific_dose_en = rules.get('infants_under_6_months', '5 to 10 drops before feeds')
                elif total_months <= 12:
                    specific_dose_en = rules.get('infants_6_to_12_months', '10 to 15 drops before feeds')
                else:
                    specific_dose_en = rules.get('children_over_1_year', '15 to 20 drops or 2.5 ml syrup')
            elif med['id'] == 'calamine':
                specific_dose_en = rules.get('all_ages', 'Apply thin layer 2-3 times daily')

            med_result['rule_dose'] = specific_dose_en
            if 'preparation_instructions' in med:
                med_result['preparation'] = {
                    'en': med['preparation_instructions'],
                    'hi': med.get('preparation_instructions_hi', med['preparation_instructions'])
                }

        prescribed_medicines.append(med_result)

    return {
        'disease': {
            'id': disease['id'],
            'name_en': disease['name_en'],
            'name_hi': disease['name_hi'],
            'description_en': disease['description_en'],
            'description_hi': disease['description_hi'],
            'icon': disease.get('icon', 'fa-stethoscope'),
            'color': disease.get('color', 'blue'),
            'red_flags': disease.get('red_flags', []),
            'home_care': disease.get('home_care', [])
        },
        'patient': {
            'age_years': age_years,
            'age_months': age_months,
            'total_years': round(total_years, 2),
            'total_months': total_months,
            'weight_kg': weight_kg,
            'weight_was_estimated': weight_was_estimated,
            'temperature_f': temperature_f,
            'gender': gender,
            'is_pregnant': is_pregnant,
            'trimester': trimester,
            'is_breastfeeding': is_breastfeeding,
            'comorbidities': comorbidities
        },
        'critical_alerts': critical_alerts,
        'special_advisories': special_advisories,
        'medicines': prescribed_medicines,
        'universal_warnings': db.get('critical_universal_warnings', [])
    }
