import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine if we're in a serverless environment (read-only file system)
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.FUNCTION_NAME;

let logFile = null;

// Only use file logging in development (non-serverless)
if (!isServerless) {
  const logDir = path.join(__dirname, '../logs');
  logFile = path.join(logDir, 'error.log');

  // Créer le dossier logs/ s'il n'existe pas
  if (!fs.existsSync(logDir)) {
    try {
      fs.mkdirSync(logDir, { recursive: true });
    } catch (err) {
      console.error('Erreur lors de la création du dossier de log:', err.message);
    }
  }
}

const logger = {
  error: (message) => {
    const logMessage = `${new Date().toISOString()} - ERROR - ${message}\n`;

    // Always log to console (works in all environments)
    console.error(logMessage);

    // Only write to file in non-serverless environments
    if (logFile) {
      try {
        fs.appendFileSync(logFile, logMessage);
      } catch (err) {
        // Silently fail file logging in case of errors
        console.error('Erreur lors de l\'écriture dans le fichier de log:', err.message);
      }
    }
  }
};

export default logger;
