// State
let currentLang = 'en'; // English is now default for easy customer reading!
let allDiseases = [];
let currentCalculationResult = null;

// Initial Setup
document.addEventListener('DOMContentLoaded', async () => {
  setupLanguageToggle();
  await loadDiseases();
  
  // Set default initial state for 1.5 year old child
  setAgePreset(1, 6, 'male');
  
  // Trigger initial calculation
  setTimeout(() => {
    handleCalculate(null);
  }, 300);
});

// Setup Language Toggle
function setupLanguageToggle() {
  const btn = document.getElementById('langToggleBtn');
  const btnText = document.getElementById('langBtnText');
  
  btn.addEventListener('click', () => {
    currentLang = currentLang === 'en' ? 'hi' : 'en';
    btnText.textContent = currentLang === 'en' ? 'हिंदी में देखें' : 'View in English';
    renderDiseaseGrid();
    if (currentCalculationResult) {
      renderResults(currentCalculationResult);
    }
  });
}

// Load Diseases from Backend
async function loadDiseases() {
  try {
    const res = await fetch('/api/diseases');
    const data = await res.json();
    if (data.status === 'success') {
      allDiseases = data.diseases;
      renderDiseaseGrid();
    }
  } catch (err) {
    console.error('Failed to load diseases:', err);
  }
}

// Render Disease Grid Cards
function renderDiseaseGrid() {
  const grid = document.getElementById('diseaseGrid');
  if (!grid || !allDiseases.length) return;
  
  const selectedId = document.getElementById('selectedDiseaseId').value;
  grid.innerHTML = '';
  
  allDiseases.forEach(d => {
    const isSelected = d.id === selectedId;
    const name = currentLang === 'en' ? d.name_en : d.name_hi;
    
    const card = document.createElement('div');
    card.className = `disease-card p-3 rounded-xl border ${isSelected ? 'active border-teal-600 bg-teal-50 ring-2 ring-teal-500/20' : 'border-slate-200 bg-white hover:border-slate-300'} flex items-center space-x-2.5 shadow-2xs`;
    card.onclick = () => selectDisease(d.id);
    
    card.innerHTML = `
      <div class="disease-icon w-8 h-8 rounded-lg ${isSelected ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'} flex items-center justify-center text-sm flex-shrink-0 transition">
        <i class="fa-solid ${d.icon}"></i>
      </div>
      <div class="overflow-hidden">
        <div class="text-xs font-bold text-slate-800 truncate">${name}</div>
        <div class="text-2xs text-slate-400 capitalize truncate">${d.category}</div>
      </div>
    `;
    grid.appendChild(card);
  });
}

// Select Disease
function selectDisease(id) {
  document.getElementById('selectedDiseaseId').value = id;
  renderDiseaseGrid();
  
  // Toggle temperature field if fever is selected
  const tempWrapper = document.getElementById('temperatureFieldWrapper');
  if (tempWrapper) {
    tempWrapper.style.display = (id === 'fever') ? 'block' : 'none';
  }
}

// Gender Change Handler
function onGenderChange() {
  const gender = document.querySelector('input[name="gender"]:checked')?.value || 'male';
  
  // Highlight active radio card
  document.querySelectorAll('.gender-btn').forEach(btn => {
    const radio = btn.querySelector('input[type="radio"]');
    if (radio.checked) {
      btn.classList.add('border-teal-600', 'bg-teal-50', 'text-teal-900');
      btn.classList.remove('border-slate-200', 'bg-slate-50', 'text-slate-700');
    } else {
      btn.classList.remove('border-teal-600', 'bg-teal-50', 'text-teal-900');
      btn.classList.add('border-slate-200', 'bg-slate-50', 'text-slate-700');
    }
  });

  checkPregnancyEligibility();
}

// Check Pregnancy Section Visibility (Female & Age >= 12)
function checkPregnancyEligibility() {
  const gender = document.querySelector('input[name="gender"]:checked')?.value || 'male';
  const ageYears = parseFloat(document.getElementById('ageYears').value) || 0;
  const wrapper = document.getElementById('pregnancySectionWrapper');
  
  if (gender === 'female' && ageYears >= 12) {
    wrapper.classList.remove('hidden');
  } else {
    wrapper.classList.add('hidden');
    document.getElementById('isPregnant').checked = false;
    document.getElementById('isBreastfeeding').checked = false;
    document.getElementById('trimesterWrapper').classList.add('hidden');
  }
}

// Pregnancy Checkbox Toggle
function onPregnancyToggle() {
  const isChecked = document.getElementById('isPregnant').checked;
  const triWrapper = document.getElementById('trimesterWrapper');
  if (isChecked) {
    triWrapper.classList.remove('hidden');
  } else {
    triWrapper.classList.add('hidden');
  }
}

// Set Age Preset
function setAgePreset(years, months, gender = 'male', isPregnant = false) {
  document.getElementById('ageYears').value = years;
  document.getElementById('ageMonths').value = months;
  
  // Set gender
  const radio = document.querySelector(`input[name="gender"][value="${gender}"]`);
  if (radio) {
    radio.checked = true;
    onGenderChange();
  }
  
  // Set pregnancy if applicable
  if (isPregnant && gender === 'female') {
    const pregBox = document.getElementById('isPregnant');
    pregBox.checked = true;
    onPregnancyToggle();
  }
  
  autoUpdateWeight(true);
}

// WHO & Clinical Weight Estimator Formula
function autoUpdateWeight(force = false) {
  const yrs = parseFloat(document.getElementById('ageYears').value) || 0;
  const mo = parseFloat(document.getElementById('ageMonths').value) || 0;
  const totalYears = yrs + (mo / 12.0);
  
  let estimatedWeight = 11.0;
  if (totalYears <= 0.25) estimatedWeight = 4.5;
  else if (totalYears <= 0.5) estimatedWeight = 6.5;
  else if (totalYears <= 1.0) estimatedWeight = 9.0;
  else if (totalYears <= 5.0) estimatedWeight = Math.round(((totalYears + 4) * 2) * 10) / 10;
  else if (totalYears <= 12.0) estimatedWeight = Math.round(((totalYears * 3) + 3) * 10) / 10;
  else estimatedWeight = 60.0;
  
  const weightInput = document.getElementById('patientWeight');
  if (force || !weightInput.value || weightInput.value <= 0) {
    weightInput.value = estimatedWeight;
  }
  
  const notice = document.getElementById('weightEstimatorNotice');
  if (notice) {
    notice.innerHTML = `<i class="fa-solid fa-circle-check text-emerald-500"></i> <span>Standard WHO estimated weight for ${totalYears.toFixed(1)} yrs is ~${estimatedWeight} kg</span>`;
  }
}

// Calculate Dosage
async function handleCalculate(e) {
  if (e) e.preventDefault();
  
  const diseaseId = document.getElementById('selectedDiseaseId').value;
  const ageYears = parseInt(document.getElementById('ageYears').value) || 0;
  const ageMonths = parseInt(document.getElementById('ageMonths').value) || 0;
  const weightKg = parseFloat(document.getElementById('patientWeight').value) || 0;
  const tempVal = document.getElementById('bodyTemp').value;
  const tempF = tempVal ? parseFloat(tempVal) : null;
  
  const gender = document.querySelector('input[name="gender"]:checked')?.value || 'male';
  const isPregnant = document.getElementById('isPregnant')?.checked || false;
  const trimester = isPregnant ? (parseInt(document.querySelector('input[name="trimester"]:checked')?.value) || 2) : null;
  const isBreastfeeding = document.getElementById('isBreastfeeding')?.checked || false;
  const comorbidityVal = document.getElementById('preExistingCondition')?.value || 'none';
  const comorbidities = [comorbidityVal];

  const submitBtn = document.getElementById('calculateBtn');
  const originalText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> <span>Calculating Safe Dose...</span>`;
  
  try {
    const res = await fetch('/api/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        disease_id: diseaseId,
        age_years: ageYears,
        age_months: ageMonths,
        weight_kg: weightKg,
        temperature_f: tempF,
        gender: gender,
        is_pregnant: isPregnant,
        trimester: trimester,
        is_breastfeeding: isBreastfeeding,
        comorbidities: comorbidities
      })
    });
    
    const result = await res.json();
    if (result.status === 'success') {
      currentCalculationResult = result.data;
      renderResults(result.data);
      
      // Scroll smoothly on mobile
      if (window.innerWidth < 1024) {
        document.getElementById('resultsContainer').scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      alert(result.message || 'Calculation error');
    }
  } catch (err) {
    console.error('Error during calculation:', err);
    alert('Server connection error. Please try again.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
}

// Render Results
function renderResults(data) {
  document.getElementById('emptyState').classList.add('hidden');
  const container = document.getElementById('resultsContainer');
  container.classList.remove('hidden');
  
  // 1. Header Badges
  const disease = data.disease;
  document.getElementById('resultDiseaseName').textContent = currentLang === 'en' ? disease.name_en : disease.name_hi;
  document.getElementById('resultDiseaseDesc').textContent = currentLang === 'en' ? disease.description_en : disease.description_hi;
  document.getElementById('resultDiseaseIcon').className = `fa-solid ${disease.icon}`;
  
  // Patient Badges
  const p = data.patient;
  
  // Gender
  const genderText = p.gender ? p.gender.charAt(0).toUpperCase() + p.gender.slice(1) : 'Male';
  document.getElementById('resultGenderText').textContent = genderText;
  
  let ageString = '';
  if (p.age_years > 0 && p.age_months > 0) {
    ageString = `${p.age_years} Yr ${p.age_months} Mo (${p.total_years} Yrs)`;
  } else if (p.age_years > 0) {
    ageString = `${p.age_years} Years`;
  } else {
    ageString = `${p.age_months} Months`;
  }
  document.getElementById('resultAgeBadge').textContent = ageString;
  
  const estNotice = p.weight_was_estimated ? ' (Est.)' : '';
  document.getElementById('resultWeightBadge').textContent = `${p.weight_kg} kg${estNotice}`;
  
  // Pregnancy Badge
  const pregBadge = document.getElementById('resultPregnancyBadge');
  if (p.is_pregnant) {
    pregBadge.classList.remove('hidden');
    pregBadge.classList.add('flex');
    const triLabel = p.trimester ? ` (Trimester ${p.trimester})` : '';
    document.getElementById('resultPregnancyText').textContent = `Pregnant${triLabel}`;
  } else {
    pregBadge.classList.add('hidden');
    pregBadge.classList.remove('flex');
  }

  // Comorbidity Badge
  const comorbBadge = document.getElementById('resultComorbidityBadge');
  const primaryComorb = p.comorbidities && p.comorbidities[0] !== 'none' ? p.comorbidities[0] : null;
  if (primaryComorb) {
    comorbBadge.classList.remove('hidden');
    comorbBadge.classList.add('flex');
    const names = {
      'heart_disease': 'Heart Condition',
      'asthma': 'Asthma Patient',
      'diabetes': 'Diabetic Patient',
      'hypertension': 'Hypertension',
      'liver_disease': 'Liver Condition',
      'kidney_disease': 'Kidney Disease',
      'stomach_ulcers': 'Stomach Ulcers'
    };
    document.getElementById('resultComorbidityText').textContent = names[primaryComorb] || primaryComorb;
  } else {
    comorbBadge.classList.add('hidden');
    comorbBadge.classList.remove('flex');
  }

  // Temperature Badge
  const tempBadge = document.getElementById('resultTempBadge');
  if (p.temperature_f) {
    tempBadge.classList.remove('hidden');
    tempBadge.classList.add('flex');
    document.getElementById('resultTempText').textContent = `${p.temperature_f}°F`;
  } else {
    tempBadge.classList.add('hidden');
    tempBadge.classList.remove('flex');
  }
  
  // 2. Special Clinical Advisories (Pregnancy & Comorbidities)
  const specialBox = document.getElementById('specialAdvisoriesBox');
  if (data.special_advisories && data.special_advisories.length > 0) {
    specialBox.classList.remove('hidden');
    specialBox.innerHTML = '';
    data.special_advisories.forEach(adv => {
      const isPreg = adv.type === 'pregnancy';
      const bgClass = isPreg ? 'bg-pink-50 border-pink-400 text-pink-950' : 'bg-amber-50 border-amber-400 text-amber-950';
      const iconClass = isPreg ? 'fa-person-pregnant text-pink-600' : 'fa-shield-virus text-amber-600';
      
      specialBox.innerHTML += `
        <div class="p-4 rounded-xl border-l-4 ${bgClass} shadow-sm">
          <div class="flex items-start gap-3">
            <i class="fa-solid ${iconClass} text-xl mt-0.5 flex-shrink-0"></i>
            <div>
              <div class="font-bold text-sm text-slate-900">${adv.title}</div>
              <div class="text-xs mt-1 leading-relaxed">${adv.message}</div>
            </div>
          </div>
        </div>
      `;
    });
  } else {
    specialBox.classList.add('hidden');
  }

  // 3. Critical Alerts Box
  const alertsBox = document.getElementById('criticalAlertsBox');
  if (data.critical_alerts && data.critical_alerts.length > 0) {
    alertsBox.classList.remove('hidden');
    alertsBox.innerHTML = '';
    data.critical_alerts.forEach(a => {
      const isDanger = a.type === 'danger';
      const bg = isDanger ? 'bg-rose-50 border-rose-400 text-rose-900' : 'bg-amber-50 border-amber-400 text-amber-900';
      const icon = isDanger ? 'fa-circle-exclamation text-rose-600' : 'fa-triangle-exclamation text-amber-600';
      
      alertsBox.innerHTML += `
        <div class="p-4 rounded-xl border-l-4 ${bg} shadow-sm">
          <div class="flex items-start gap-2.5">
            <i class="fa-solid ${icon} text-lg mt-0.5 flex-shrink-0"></i>
            <div>
              <div class="font-bold text-sm">${a.title}</div>
              <div class="text-xs mt-0.5 leading-relaxed">${a.message}</div>
            </div>
          </div>
        </div>
      `;
    });
  } else {
    alertsBox.classList.add('hidden');
  }
  
  // 4. Recommended Medicines Container
  const medContainer = document.getElementById('medicinesContainer');
  medContainer.innerHTML = '';
  
  data.medicines.forEach(m => {
    const isContraindicated = m.is_contraindicated;
    
    // Status Badges
    let badgesHtml = '';
    if (isContraindicated) {
      badgesHtml += `<span class="bg-rose-600 text-white text-2xs font-black px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-xs"><i class="fa-solid fa-ban"></i> STRICTLY PROHIBITED</span>`;
    } else {
      if (m.is_first_line) {
        badgesHtml += `<span class="bg-emerald-100 text-emerald-900 border border-emerald-300 text-2xs font-black px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-2xs"><i class="fa-solid fa-star text-amber-500"></i> First Choice</span>`;
      } else {
        badgesHtml += `<span class="bg-slate-100 text-slate-700 text-2xs font-semibold px-2.5 py-0.5 rounded-full">Alternative</span>`;
      }
      
      if (p.is_pregnant && m.pregnancy_status && m.pregnancy_status.includes('SAFE')) {
        badgesHtml += `<span class="bg-gradient-to-r from-pink-500 to-rose-500 text-white text-2xs font-black px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs"><i class="fa-solid fa-shield-heart text-pink-100"></i> Safe in Pregnancy</span>`;
      }
    }
      
    // Dosage block
    let dosageHtml = '';
    if (isContraindicated) {
      dosageHtml = `
        <div class="bg-rose-50/90 border-2 border-rose-300 rounded-2xl p-4 sm:p-5 mb-4 shadow-2xs">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center text-lg flex-shrink-0 shadow-xs">
              <i class="fa-solid fa-ban"></i>
            </div>
            <div>
              <strong class="text-xs font-black text-rose-950 uppercase tracking-wider block">DO NOT ADMINISTER THIS MEDICINE:</strong>
              <p class="text-xs sm:text-sm text-rose-900 mt-1 leading-relaxed font-semibold">
                ${m.contraindication_reason}
              </p>
            </div>
          </div>
        </div>
      `;
    } else if (m.dose_mg) {
      dosageHtml = `
        <div class="bg-gradient-to-r from-teal-50/90 via-emerald-50/60 to-teal-50/90 border border-teal-200/90 rounded-2xl p-4 sm:p-5 mb-4 shadow-2xs">
          <div class="flex flex-wrap justify-between items-center gap-2 mb-2">
            <span class="text-2xs font-black uppercase tracking-wider text-teal-800 bg-teal-100/80 px-2.5 py-0.5 rounded-md border border-teal-200">
              <i class="fa-solid fa-bullseye text-teal-600 mr-1"></i> Recommended Single Dose
            </span>
            <span class="text-2xs font-bold text-teal-700 bg-white/80 px-2.5 py-0.5 rounded-md border border-teal-100">
              Safe Range: ${m.dose_mg.range_min} mg - ${m.dose_mg.range_max} mg
            </span>
          </div>
          
          <div class="flex items-baseline gap-2 mt-1">
            <span class="text-3xl sm:text-4xl font-black text-teal-950">${m.dose_mg.recommended}</span>
            <span class="text-sm font-extrabold text-teal-800">mg per dose</span>
          </div>

          <div class="mt-3.5 pt-3 border-t border-teal-200/70 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div class="flex items-center gap-2 text-slate-800 font-bold">
              <div class="w-7 h-7 rounded-lg bg-white text-teal-600 flex items-center justify-center shadow-2xs border border-teal-100">
                <i class="fa-regular fa-clock text-xs"></i>
              </div>
              <span>Interval: <strong class="text-teal-900">${m.dose_mg.interval}</strong></span>
            </div>
            <div class="flex items-center gap-2 text-rose-800 font-bold">
              <div class="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shadow-2xs border border-rose-200">
                <i class="fa-solid fa-shield-halved text-xs"></i>
              </div>
              <span>Max ${m.dose_mg.max_doses_per_day} doses/24h (Max: ${m.dose_mg.max_daily_mg} mg)</span>
            </div>
          </div>
        </div>
      `;
    } else if (m.rule_dose) {
      dosageHtml = `
        <div class="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 sm:p-5 mb-4 shadow-2xs">
          <div class="flex items-center gap-2 text-2xs font-black text-amber-900 uppercase tracking-wider mb-1.5">
            <i class="fa-solid fa-clipboard-check text-amber-600 text-sm"></i>
            <span>Prescribed Dose & Schedule:</span>
          </div>
          <div class="text-sm font-bold text-amber-950 leading-relaxed">
            ${m.rule_dose}
          </div>
        </div>
      `;
    }
    
    // Liquid Formulations Breakdown (ml translation)
    let formsHtml = '';
    if (!isContraindicated && m.formulations_calculated && m.formulations_calculated.length > 0) {
      formsHtml = `
        <div class="mt-4">
          <div class="text-xs font-black text-slate-800 uppercase tracking-wide mb-2.5 flex items-center gap-2">
            <i class="fa-solid fa-prescription-bottle-medical text-teal-600"></i>
            <span>Available Bottle Strengths & Milliliters (ml) to Give:</span>
          </div>
          <div class="space-y-2.5">
      `;
      
      m.formulations_calculated.forEach(f => {
        let formIcon = 'fa-bottle-droplet text-emerald-600';
        let iconBg = 'bg-emerald-50';
        if (f.type === 'drops') {
          formIcon = 'fa-eye-dropper text-teal-600';
          iconBg = 'bg-teal-50';
        } else if (f.type.includes('250') || f.type.includes('ds')) {
          formIcon = 'fa-flask-vial text-indigo-600';
          iconBg = 'bg-indigo-50';
        } else if (f.type.includes('tablet')) {
          formIcon = 'fa-tablets text-blue-600';
          iconBg = 'bg-blue-50';
        }

        if (f.dose_ml) {
          formsHtml += `
            <div class="formulation-row p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-teal-300 flex flex-wrap justify-between items-center gap-3 shadow-2xs">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center text-lg flex-shrink-0 shadow-2xs">
                  <i class="fa-solid ${formIcon}"></i>
                </div>
                <div>
                  <div class="text-xs sm:text-sm font-extrabold text-slate-900">${f.label_en}</div>
                  <div class="text-2xs text-slate-500 font-medium">${f.popular_brands ? `(e.g., ${f.popular_brands})` : ''} • ${f.suitable_for || ''}</div>
                </div>
              </div>
              <div class="text-right">
                <span class="inline-block px-3.5 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-black text-base sm:text-lg shadow-2xs">${f.dose_ml} ml</span>
                <div class="text-2xs font-bold text-slate-700 mt-1 flex items-center justify-end gap-1">
                  <i class="fa-solid fa-spoon text-teal-600"></i>
                  <span>${f.measure_guide}</span>
                </div>
              </div>
            </div>
          `;
        } else if (f.dose_tablet) {
          formsHtml += `
            <div class="formulation-row p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-indigo-300 flex flex-wrap justify-between items-center gap-3 shadow-2xs">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center text-lg flex-shrink-0 shadow-2xs">
                  <i class="fa-solid ${formIcon}"></i>
                </div>
                <div>
                  <div class="text-xs sm:text-sm font-extrabold text-slate-900">${f.label_en}</div>
                  <div class="text-2xs text-slate-500 font-medium">${f.popular_brands ? `(e.g., ${f.popular_brands})` : ''}</div>
                </div>
              </div>
              <div class="text-right">
                <span class="inline-block px-3.5 py-1 bg-indigo-600 text-white rounded-xl font-black text-sm shadow-2xs">${f.dose_tablet}</span>
                <div class="text-2xs text-slate-500 mt-1">${f.suitable_for}</div>
              </div>
            </div>
          `;
        }
      });
      
      formsHtml += `</div></div>`;
    }
    
    // Preparation Instructions (ORS, etc.)
    let prepHtml = '';
    if (m.preparation) {
      prepHtml = `
        <div class="mt-4 bg-emerald-50/80 border border-emerald-200/80 p-4 rounded-2xl text-xs sm:text-sm text-emerald-950 shadow-2xs">
          <strong class="font-extrabold flex items-center gap-1.5 text-emerald-900 mb-1">
            <i class="fa-solid fa-circle-check text-emerald-600"></i>
            Proper Preparation & Mixing Instructions:
          </strong>
          ${m.preparation.en}
        </div>
      `;
    }
    
    // Warnings List
    let warningsHtml = '';
    if (m.warnings && m.warnings.length > 0) {
      warningsHtml = `
        <div class="mt-4 pt-3 border-t border-slate-100">
          <div class="text-2xs font-extrabold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <i class="fa-solid fa-triangle-exclamation text-amber-500"></i>
            <span>Safety Checklist & Precautions:</span>
          </div>
          <ul class="text-2xs text-slate-600 space-y-1 list-disc list-inside font-medium">
            ${m.warnings.map(w => `<li>${w}</li>`).join('')}
          </ul>
        </div>
      `;
    }

    const card = document.createElement('div');
    if (isContraindicated) {
      card.className = 'dose-card-contraindicated rounded-3xl p-5 sm:p-6 border-2 border-rose-300 shadow-sm fade-in-up';
    } else if (m.is_first_line) {
      card.className = 'bg-white dose-card-first-line rounded-3xl p-5 sm:p-6 border-2 border-emerald-300 shadow-md fade-in-up';
    } else {
      card.className = 'bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm fade-in-up';
    }

    card.innerHTML = `
      <div class="flex flex-wrap justify-between items-start gap-3 mb-4">
        <div class="flex items-center space-x-3">
          <div class="w-12 h-12 rounded-2xl ${isContraindicated ? 'bg-rose-100 text-rose-600' : 'bg-teal-50 text-teal-700'} flex items-center justify-center text-xl shadow-2xs flex-shrink-0">
            <i class="fa-solid ${isContraindicated ? 'fa-ban' : 'fa-capsules'}"></i>
          </div>
          <div>
            <h4 class="text-base sm:text-lg font-black text-slate-900 ${isContraindicated ? 'line-through opacity-70' : ''}">${m.name}</h4>
            <div class="text-xs text-slate-500 font-medium mt-0.5">
              ${m.brand_names ? `<span class="font-bold text-slate-700">Brands:</span> ${m.brand_names}` : ''}
            </div>
          </div>
        </div>
        <div class="flex flex-wrap gap-1.5">
          ${badgesHtml}
        </div>
      </div>
      
      ${dosageHtml}
      ${formsHtml}
      ${prepHtml}
      ${warningsHtml}
    `;
    
    medContainer.appendChild(card);
  });
  
  // 5. Home Care Tips
  const homeCareList = document.getElementById('homeCareList');
  homeCareList.innerHTML = '';
  if (disease.home_care && disease.home_care.length > 0) {
    disease.home_care.forEach(item => {
      homeCareList.innerHTML += `<li>${item}</li>`;
    });
  }
  
  // 6. Red Flags Checklist
  const redFlagsList = document.getElementById('redFlagsList');
  redFlagsList.innerHTML = '';
  if (disease.red_flags && disease.red_flags.length > 0) {
    disease.red_flags.forEach(item => {
      redFlagsList.innerHTML += `<li>${item}</li>`;
    });
  }
}

// WhatsApp Share Formatter
function shareOnWhatsApp() {
  if (!currentCalculationResult) return;
  const d = currentCalculationResult;
  const p = d.patient;
  
  let msg = `🏥 *SwasthyaCare - Safe Clinical Dosage Slip*\n`;
  msg += `👤 *Patient*: Gender: ${p.gender.toUpperCase()} | Age: ${p.age_years}y ${p.age_months}m | Weight: ${p.weight_kg}kg\n`;
  if (p.is_pregnant) msg += `🤰 *Status*: PREGNANT (Trimester ${p.trimester || 'Active'})\n`;
  if (p.comorbidities && p.comorbidities[0] !== 'none') msg += `🩺 *Chronic Condition*: ${p.comorbidities[0].toUpperCase()}\n`;
  msg += `🩺 *Illness*: ${d.disease.name_en}\n`;
  if (p.temperature_f) msg += `🌡️ *Fever Temperature*: ${p.temperature_f}°F\n`;
  msg += `----------------------------\n`;
  
  d.medicines.forEach(m => {
    if (m.is_contraindicated) {
      msg += `❌ *${m.name}*: PROHIBITED / CONTRAINDICATED\n`;
      msg += `   Reason: ${m.contraindication_reason}\n\n`;
    } else {
      msg += `💊 *${m.name}* (${m.brand_names || ''})\n`;
      if (m.dose_mg) {
        msg += `• Recommended Dose: *${m.dose_mg.recommended} mg*\n`;
        msg += `• Interval: ${m.dose_mg.interval} (Max ${m.dose_mg.max_doses_per_day} times/day)\n`;
      }
      if (m.formulations_calculated) {
        m.formulations_calculated.forEach(f => {
          if (f.dose_ml) {
            msg += `  👉 ${f.label_en}: *${f.dose_ml} ml* (${f.measure_guide})\n`;
          }
        });
      }
      if (m.rule_dose) {
        msg += `• Dose: ${m.rule_dose}\n`;
      }
      msg += `\n`;
    }
  });
  
  msg += `⚠️ *Notice*: For educational & first-aid reference. Always consult a certified physician/pediatrician.\n`;
  msg += `📞 *Emergency*: 108 (Ambulance), 1098 (Childline)\n`;
  
  const encoded = encodeURIComponent(msg);
  window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
}
