const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

const questionsFilePath = path.join(__dirname, 'preguntas.json');
const statsBasePath = path.join(__dirname, 'stats'); // Carpeta base para las estadísticas

app.use(cors());
app.use(express.json());

// Función auxiliar para leer el archivo JSON
const leerPreguntas = () => {
  return new Promise((resolve, reject) => {
    fs.readFile(questionsFilePath, 'utf8', (err, data) => {
      if (err) {
        reject('Error al leer el archivo');
      } else {
        resolve(JSON.parse(data));
      }
    });
  });
};

// Función auxiliar para escribir en el archivo JSON
const escribirPreguntas = (data) => {
  return new Promise((resolve, reject) => {
    fs.writeFile(questionsFilePath, JSON.stringify(data, null, 2), (err) => {
      if (err) {
        reject('Error al escribir en el archivo');
      } else {
        resolve();
      }
    });
  });
};

// Ruta GET: Obtener todas las preguntas
app.get('/preguntas', async (req, res) => {
  try {
    const preguntas = await leerPreguntas();
    res.json(preguntas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener las preguntas' });
  }
});

// Ruta POST: Crear una nueva pregunta
app.post('/preguntas', async (req, res) => {
  const nuevaPregunta = req.body;

  // Validar que la nueva pregunta tenga todos los campos requeridos
  if (!nuevaPregunta.pregunta || !nuevaPregunta.resposta_correcta || !nuevaPregunta.respostes_incorrectes) {
    return res.status(400).json({ error: 'Faltan campos requeridos en la pregunta' });
  }

  try {
    const preguntas = await leerPreguntas();
    preguntas.preguntes.push(nuevaPregunta);
    await escribirPreguntas(preguntas);
    res.status(201).json({ message: 'Pregunta creada exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear la pregunta' });
  }
});

// Ruta PUT: Actualizar una pregunta
app.put('/preguntas/:index', async (req, res) => {
  const preguntaActualizada = req.body;
  const index = parseInt(req.params.index);

  if (!preguntaActualizada.pregunta || !preguntaActualizada.resposta_correcta || !preguntaActualizada.respostes_incorrectes) {
    return res.status(400).json({ error: 'Faltan campos requeridos en la pregunta' });
  }

  try {
    const preguntas = await leerPreguntas();
    
    if (index < 0 || index >= preguntas.preguntes.length) {
      return res.status(404).json({ error: 'Pregunta no encontrada' });
    }

    preguntas.preguntes[index] = preguntaActualizada;
    await escribirPreguntas(preguntas);

    res.json({ message: 'Pregunta actualizada exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar la pregunta' });
  }
});

// Ruta DELETE: Eliminar una pregunta por su índice
app.delete('/preguntas/:index', async (req, res) => {
  const index = parseInt(req.params.index);

  try {
    const preguntas = await leerPreguntas();
    
    if (index < 0 || index >= preguntas.preguntes.length) {
      return res.status(404).json({ error: 'Pregunta no encontrada' });
    }

    preguntas.preguntes.splice(index, 1);
    await escribirPreguntas(preguntas);

    res.json({ message: 'Pregunta eliminada exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar la pregunta' });
  }
});

// Ruta para guardar estadísticas
app.post('/guardarEstadisticas', async (req, res) => {
  const { usuarioId, preguntas } = req.body;

  // Validar que las preguntas tengan todos los campos requeridos
  if (!preguntas || !Array.isArray(preguntas) || preguntas.length === 0) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }

  const estadisticas = {
    partidas: {
      userid: usuarioId,
      preguntas: preguntas.map(pregunta => ({
        pregunta: pregunta.pregunta,
        tiempoRespuesta: pregunta.tiempoRespuesta
      }))
    }
  };

  try {
    // Crear la carpeta para las estadísticas si no existe
    const date = new Date();
    const folderName = `${date.toISOString().split('T')[0]}_${date.getHours()}-${date.getMinutes()}`;
    const userStatsPath = path.join(statsBasePath, folderName);
    
    if (!fs.existsSync(userStatsPath)){
      fs.mkdirSync(userStatsPath, { recursive: true });
    }

    // Escribir estadísticas en un archivo por usuario
    const filePath = path.join(userStatsPath, `${usuarioId}_estadisticas.json`);
    await escribirEstadisticas(estadisticas, filePath);
    res.status(200).json({ message: 'Estadísticas guardadas exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al guardar las estadísticas' });
  }
});

// Función auxiliar para escribir en el archivo JSON de estadísticas
const escribirEstadisticas = (data, filePath) => {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, JSON.stringify(data, null, 2), (err) => {
      if (err) {
        reject('Error al escribir en el archivo de estadísticas');
      } else {
        resolve();
      }
    });
  });
};

// Ruta GET: Obtener todas las estadísticas
app.get('/estadisticas', async (req, res) => {
  try {
    const estadisticas = await leerEstadisticas(statsBasePath);
    res.json(estadisticas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener las estadísticas' });
  }
});

// Función auxiliar para leer todas las estadísticas
const leerEstadisticas = (statsBasePath) => {
  return new Promise((resolve, reject) => {
    fs.readdir(statsBasePath, (err, folders) => {
      if (err) {
        reject('Error al leer la carpeta de estadísticas');
      } else {
        const allStats = [];
        
        folders.forEach(folder => {
          const folderPath = path.join(statsBasePath, folder);
          const files = fs.readdirSync(folderPath);

          files.forEach(file => {
            if (file.endsWith('.json')) {
              const filePath = path.join(folderPath, file);
              const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
              allStats.push(data);
            }
          });
        });
        
        resolve(allStats);
      }
    });
  });
}

app.listen(22222, () => {
  console.log(`Servidor ejecutándose en http://dam.inspedralbes.cat:22222/preguntas`);
});