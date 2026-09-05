import os
import json
from flask import Flask, render_template, request, jsonify
from calculator import calculate_dosage, load_db, estimate_child_weight

# Smart template and static paths (supports both subfolders and flat root)
template_dir = 'templates' if os.path.exists(os.path.join(os.path.dirname(__file__), 'templates', 'index.html')) else '.'
static_dir = 'static' if os.path.exists(os.path.join(os.path.dirname(__file__), 'static', 'css', 'styles.css')) else '.'

app = Flask(__name__, template_folder=template_dir, static_folder=static_dir, static_url_path='/static')

@app.route('/')
def index():
    db = load_db()
    return render_template('index.html', diseases=db.get('diseases', []))

@app.route('/standalone')
@app.route('/offline')
def standalone():
    from flask import send_file
    standalone_path = os.path.join(os.path.dirname(__file__), 'standalone.html')
    return send_file(standalone_path)

@app.route('/static/css/styles.css')
@app.route('/styles.css')
def root_css():
    from flask import send_from_directory
    root_dir = os.path.dirname(__file__)
    if os.path.exists(os.path.join(root_dir, 'static', 'css', 'styles.css')):
        return send_from_directory(os.path.join(root_dir, 'static', 'css'), 'styles.css')
    return send_from_directory(root_dir, 'styles.css')

@app.route('/static/js/app.js')
@app.route('/app.js')
def root_js():
    from flask import send_from_directory
    root_dir = os.path.dirname(__file__)
    if os.path.exists(os.path.join(root_dir, 'static', 'js', 'app.js')):
        return send_from_directory(os.path.join(root_dir, 'static', 'js'), 'app.js')
    return send_from_directory(root_dir, 'app.js')

@app.route('/api/diseases', methods=['GET'])
def get_diseases():
    db = load_db()
    return jsonify({
        'status': 'success',
        'diseases': db.get('diseases', [])
    })

@app.route('/api/estimate-weight', methods=['GET'])
def get_estimated_weight():
    try:
        years = float(request.args.get('years', 0))
        months = float(request.args.get('months', 0))
        total_years = years + (months / 12.0)
        weight = estimate_child_weight(total_years)
        return jsonify({
            'status': 'success',
            'total_years': round(total_years, 2),
            'estimated_weight_kg': weight
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 400

@app.route('/api/calculate', methods=['POST'])
def calculate():
    try:
        data = request.get_json() or {}
        disease_id = data.get('disease_id')
        if not disease_id:
            return jsonify({'status': 'error', 'message': 'disease_id is required'}), 400

        age_years = int(data.get('age_years', 0))
        age_months = int(data.get('age_months', 0))
        weight_kg = float(data.get('weight_kg', 0.0))
        temp_val = data.get('temperature_f')
        temperature_f = float(temp_val) if temp_val not in (None, '', 0) else None
        
        gender = data.get('gender', 'male')
        is_pregnant = bool(data.get('is_pregnant', False))
        trimester = int(data['trimester']) if data.get('trimester') else None
        is_breastfeeding = bool(data.get('is_breastfeeding', False))
        comorbidities = data.get('comorbidities', ['none'])

        result = calculate_dosage(
            disease_id=disease_id,
            age_years=age_years,
            age_months=age_months,
            weight_kg=weight_kg,
            temperature_f=temperature_f,
            gender=gender,
            is_pregnant=is_pregnant,
            trimester=trimester,
            is_breastfeeding=is_breastfeeding,
            comorbidities=comorbidities
        )
        return jsonify({
            'status': 'success',
            'data': result
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"Starting SwasthyaCare on http://127.0.0.1:{port}")
    app.run(host='0.0.0.0', port=port, debug=True)
