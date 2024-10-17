const { spawn } = require('child_process');

console.log("inicio");
const pythonProcess = spawn('python', ['./random.py','text','4']);

// Escuchar eventos de salida del proceso de Python
pythonProcess.stdout.on('data', (data) => {
  const messageFromPython = data.toString().trim();
  console.log('[Mensaje recibido desde Python:] ', messageFromPython,"  [end message]");

});

// Manejar la finalización del proceso de Python
pythonProcess.on('close', (code) => {
  console.log(`El proceso de Python se cerró con el código ${code}`);
});


pythonProcess.stderr.on('data', (data) => {
  console.error('Error en el proceso de Python:', data.toString().trim());
});
