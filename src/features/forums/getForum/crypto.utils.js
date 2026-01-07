import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // Debe ser una llave de 32 bytes en base64
const ALGORITHM = "aes-256-cbc";

if (!ENCRYPTION_KEY) {
  throw new Error("ENCRYPTION_KEY not found in environment variables");
}

// Convertir la llave de base64 a Buffer
const key = Buffer.from(ENCRYPTION_KEY, "base64");

if (key.length !== 32) {
  throw new Error("ENCRYPTION_KEY must be 32 bytes (256 bits)");
}

/**
 * Encripta un texto usando AES-256-CBC
 * @param {string} text - El texto a encriptar
 * @returns {string} - El texto encriptado en formato "iv:encryptedData" (ambos en base64)
 */
export function encrypt(text) {
  if (!text || text === null || text === undefined) {
    return null;
  }

  // Generar un IV aleatorio para cada encriptación
  const iv = crypto.randomBytes(16);

  // Crear el cipher
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  // Encriptar el texto
  let encrypted = cipher.update(text, "utf8", "base64");
  encrypted += cipher.final("base64");

  // Retornar iv:encryptedData (ambos en base64)
  return `${iv.toString("base64")}:${encrypted}`;
}

/**
 * Desencripta un texto encriptado con AES-256-CBC
 * @param {string} encryptedText - El texto encriptado en formato "iv:encryptedData"
 * @returns {string} - El texto desencriptado
 */
export function decrypt(encryptedText) {
  if (!encryptedText || encryptedText === null || encryptedText === undefined) {
    return null;
  }

  try {
    // Separar el IV y los datos encriptados
    const parts = encryptedText.split(":");
    if (parts.length !== 2) {
      throw new Error("Invalid encrypted text format");
    }

    const iv = Buffer.from(parts[0], "base64");
    const encrypted = parts[1];

    // Crear el decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

    // Desencriptar
    let decrypted = decipher.update(encrypted, "base64", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    throw new Error(`Decryption failed: ${error.message}`);
  }
}

/**
 * Encripta un objeto con campos específicos
 * @param {object} obj - El objeto con los datos a encriptar
 * @param {string[]} fields - Los campos a encriptar
 * @returns {object} - El objeto con los campos encriptados
 */
export function encryptFields(obj, fields) {
  const result = { ...obj };
  fields.forEach((field) => {
    if (result[field]) {
      result[field] = encrypt(result[field]);
    }
  });
  return result;
}

/**
 * Desencripta un objeto con campos específicos
 * @param {object} obj - El objeto con los datos encriptados
 * @param {string[]} fields - Los campos a desencriptar
 * @returns {object} - El objeto con los campos desencriptados
 */
export function decryptFields(obj, fields) {
  const result = { ...obj };
  fields.forEach((field) => {
    if (result[field]) {
      result[field] = decrypt(result[field]);
    }
  });
  return result;
}
