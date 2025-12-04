const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Servir imágenes estáticas (los gráficos de estrategia)
// URL accesible: http://localhost:5001/strategies/imagen.png
const strategiesDir = path.join(__dirname, 'public', 'strategies');
if (!fs.existsSync(strategiesDir)) {
    fs.mkdirSync(strategiesDir, { recursive: true });
}
app.use('/strategies', express.static(strategiesDir));

// --- ENDPOINT: PREDICCIÓN DE ESTRATEGIA (ML) ---
app.post('/api/predict-strategy', (req, res) => {
    const { driver, gp, year } = req.body;

    if (!driver || !gp || !year) {
        return res.status(400).json({ error: "Faltan datos: driver, gp, year" });
    }

    console.log(`🏁 Solicitando estrategia ML: ${driver} @ ${gp} ${year}`);

    // Ruta absoluta al script Python
    const scriptPath = path.join(__dirname, 'ml', 'f1_strategy_predictor.py');
    
    // --- CAMBIO AQUÍ: Detectar el Python del entorno virtual (venv) ---
    // Buscamos el ejecutable de Python en la carpeta venv de la raíz del proyecto
    let pythonCmd = 'python3'; // Fallback global
    
    // Ruta relativa desde backend/ hacia arriba: ../venv/bin/python (Mac/Linux) o ../venv/Scripts/python.exe (Windows)
    const venvPathLinux = path.join(__dirname, '..', 'venv', 'bin', 'python');
    const venvPathWin = path.join(__dirname, '..', 'venv', 'Scripts', 'python.exe');

    if (fs.existsSync(venvPathLinux)) {
        pythonCmd = venvPathLinux;
    } else if (fs.existsSync(venvPathWin)) {
        pythonCmd = venvPathWin;
    }
    
    console.log(`🐍 Usando Python en: ${pythonCmd}`);
    // ------------------------------------------------------------------

    const pyProcess = spawn(pythonCmd, [scriptPath, driver, gp, year.toString()]);

    let dataString = '';
    let errorString = '';

    pyProcess.stdout.on('data', (data) => {
        dataString += data.toString();
    });

    pyProcess.stderr.on('data', (data) => {
        errorString += data.toString();
    });

    pyProcess.on('close', (code) => {
        if (code !== 0) {
            console.error("❌ Error Python:", errorString);
            return res.status(500).json({ error: "Fallo en el cálculo de estrategia", details: errorString });
        }

        try {
            // Buscamos el último JSON válido en la salida (por si hay logs previos)
            const lines = dataString.trim().split('\n');
            const lastLine = lines[lines.length - 1];
            const result = JSON.parse(lastLine);
            
            if (result.error) {
                return res.status(500).json(result);
            }
            
            res.json(result);
        } catch (e) {
            console.error("❌ Error parseando JSON:", e);
            console.log("Raw Output:", dataString);
            res.status(500).json({ error: "Respuesta inválida del modelo" });
        }
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor Backend corriendo en http://localhost:${PORT}`);
    console.log(`📂 Guardando estrategias en: ${strategiesDir}`);
});
