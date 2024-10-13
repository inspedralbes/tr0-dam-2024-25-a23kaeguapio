import os
import json
import pandas as pd
import matplotlib.pyplot as plt
from IPython.display import display

# Ruta a la carpeta de estadísticas
stats_dir = 'stats'

# Función para leer estadísticas desde los archivos JSON
def leer_estadisticas():
    all_stats = []

    for dirpath, _, filenames in os.walk(stats_dir):
        for filename in filenames:
            if filename.endswith('.json'):
                file_path = os.path.join(dirpath, filename)

                with open(file_path, 'r') as f:
                    try:
                        data = json.load(f)
                        all_stats.append(data)
                    except json.JSONDecodeError:
                        print(f'Error al leer el archivo {file_path}')

    return all_stats

# Función para analizar las estadísticas y mostrar gráficos
def analizar_estadisticas(stats):
    data = []

    # Extraer los tiempos de respuesta de cada pregunta
    for partida in stats:
        userid = partida["partidas"]["userid"]
        for pregunta in partida["partidas"]["preguntas"]:
            pregunta_text = pregunta["pregunta"]
            tiempo_respuesta = pregunta["tiempoRespuesta"]
            data.append({"userid": userid, "pregunta": pregunta_text, "tiempoRespuesta": tiempo_respuesta})

    # Crear un DataFrame a partir de los datos
    df = pd.DataFrame(data)

    # Gráfico de líneas para el tiempo de respuesta
    plt.figure(figsize=(12, 6))

    # Agrupar por pregunta y calcular la media de tiempo de respuesta
    tiempo_medio = df.groupby("pregunta")["tiempoRespuesta"].mean().reset_index()

    plt.plot(tiempo_medio["pregunta"], tiempo_medio["tiempoRespuesta"], marker='o', label='Tiempo Medio de Respuesta')

    plt.xticks(rotation=45, ha='right')
    plt.xlabel('Preguntas')
    plt.ylabel('Tiempo de Respuesta (segundos)')
    plt.title('Tiempo de Respuesta por Pregunta')
    plt.legend()
    plt.grid()
    plt.tight_layout()
    plt.show()

stats = leer_estadisticas()

if stats:
    analizar_estadisticas(stats)
else:
    print('No se encontraron estadísticas.')