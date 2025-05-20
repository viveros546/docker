from flask import Flask, request, render_template, jsonify
import json
from model import ejecutar_pipeline  # Importa la función del modelo

app = Flask(__name__, static_folder='static', template_folder='templates')

# --- Función para validar resultados antes de serializarlos ---
def validar_resultados(resultados):
    """Asegura que los resultados sean serializables por JSON."""
    return {key: str(value) if value is not None else "Valor no disponible" for key, value in resultados.items()}

# --- Rutas de Flask ---
@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        texto_entrada = request.form['texto']
        if texto_entrada:
            texto_final, resultados = ejecutar_pipeline(texto_entrada)

            try:
                # Verifica si los resultados son serializables
                json.dumps(resultados)  # Prueba de serialización
            except (TypeError, ValueError) as e:
                # Si no es serializable, manejar el error
                return render_template('index.html', error="Error al procesar los resultados para JSON")

            # Validar y convertir resultados a datos serializables
            resultados = validar_resultados(resultados)

            return render_template(
                'index.html',
                resultados=resultados,  # Manteniendo `resultados` como diccionario
                texto_final=texto_final,
                texto_inicial=texto_entrada
            )
        else:
            return render_template('index.html', error="Por favor, ingresa algún texto.")

    return render_template('index.html')

@app.route('/api/resultados', methods=['POST'])
def api_resultados():
    """Endpoint para obtener resultados en formato JSON."""
    data = request.get_json()
    texto_entrada = data.get("texto", "")

    if not texto_entrada:
        return jsonify({"error": "No se proporcionó texto"}), 400

    texto_final, resultados = ejecutar_pipeline(texto_entrada)

    # Validar y convertir resultados a datos serializables
    resultados = validar_resultados(resultados)

    return jsonify({
        "texto_final": texto_final,
        "resultados": resultados
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)