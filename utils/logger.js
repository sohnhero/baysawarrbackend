import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logDir = path.join(__dirname, '../logs');
const logFile = path.join(logDir, 'error.log');

// Créer le dossier logs/ s'il n'existe pas
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Créer le fichier error.log s'il n'existe pas
if (!fs.existsSync(logFile)) {
  try {
    fs.writeFileSync(logFile, ''); // Créer un fichier vide
  } catch (err) {
    console.error('Erreur lors de la création du fichier de log:', err.message);
  }
}

const logger = {
  error: (message) => {
    const logMessage = `${new Date().toISOString()} - ERROR - ${message}\n`;
    try {
      fs.appendFileSync(logFile, logMessage);
      console.error(logMessage);
    } catch (err) {
      console.error('Erreur lors de l’écriture dans le fichier de log:', err.message);
    }
  }
};

export default logger;
