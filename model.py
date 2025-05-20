def filtro_mayusculas(texto):
    """Convierte el texto a mayúsculas."""
    return texto.upper()

def filtro_eliminar_vocales(texto):
    """Elimina las vocales del texto."""
    vocales = "AEIOUÁÉÍÓÚaeiouáéíóú"
    return ''.join(c for c in texto if c not in vocales)

def filtro_contar_palabras(texto):
    """Cuenta las palabras y añade el conteo al final."""
    num_palabras = len(texto.split())
    return f"{texto} (Número de palabras: {num_palabras})"

pipeline_filtros = [filtro_mayusculas, filtro_eliminar_vocales, filtro_contar_palabras]

def ejecutar_pipeline(texto_inicial):
    """Ejecuta la secuencia de filtros en el texto."""
    texto_actual = texto_inicial
    resultados_intermedios = {'Inicial': texto_inicial}

    for i, filtro in enumerate(pipeline_filtros):
        texto_actual = filtro(texto_actual)
        nombre_filtro = filtro.__name__.replace('filtro_', '').replace('_', ' ').title()
        resultados_intermedios[f'Paso {i+1}: {nombre_filtro}'] = texto_actual

    return texto_actual, resultados_intermedios