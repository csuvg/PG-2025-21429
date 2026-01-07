import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

// TLS 1.3 usa cifrados AEAD como AES-256-GCM
const TRAFFIC_ENCRYPTION_KEY = process.env.TRAFFIC_ENCRYPTION_KEY; // Debe ser una llave de 32 bytes en base64
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // GCM recomienda 12 bytes para el nonce/IV
const AUTH_TAG_LENGTH = 16; // Tag de autenticación de 16 bytes (128 bits)

if (!TRAFFIC_ENCRYPTION_KEY) {
  throw new Error("TRAFFIC_ENCRYPTION_KEY not found in environment variables");
}

// Convertir la llave de base64 a Buffer
const key = Buffer.from(TRAFFIC_ENCRYPTION_KEY, "base64");

if (key.length !== 32) {
  throw new Error("TRAFFIC_ENCRYPTION_KEY must be 32 bytes (256 bits)");
}

/**
 * Encripta un texto usando AES-256-GCM (TLS 1.3 AEAD cipher)
 * AES-GCM proporciona tanto confidencialidad como autenticidad (AEAD - Authenticated Encryption with Associated Data)
 * 
 * @param {string} text - El texto a encriptar
 * @returns {string} - El texto encriptado en formato "nonce:authTag:encryptedData" (todos en base64)
 */
export function encrypt(text) {
  if (!text || text === null || text === undefined) {
    return null;
  }

  try {
    // Generar un nonce/IV aleatorio para cada encriptación (12 bytes recomendado para GCM)
    const nonce = crypto.randomBytes(IV_LENGTH);

    // Crear el cipher con AES-256-GCM
    const cipher = crypto.createCipheriv(ALGORITHM, key, nonce);

    // Encriptar el texto
    let encrypted = cipher.update(text, "utf8", "base64");
    encrypted += cipher.final("base64");

    // Obtener el auth tag (esto es lo que hace GCM un AEAD - provee autenticación)
    const authTag = cipher.getAuthTag();

    // Retornar nonce:authTag:encryptedData (todos en base64)
    return `${nonce.toString("base64")}:${authTag.toString("base64")}:${encrypted}`;
  } catch (error) {
    throw new Error(`Traffic encryption failed: ${error.message}`);
  }
}

/**
 * Desencripta un texto encriptado con AES-256-GCM (TLS 1.3 AEAD cipher)
 * Verifica la autenticidad del mensaje usando el auth tag
 * 
 * @param {string} encryptedText - El texto encriptado en formato "nonce:authTag:encryptedData"
 * @returns {string} - El texto desencriptado
 */
export function decrypt(encryptedText) {
  if (!encryptedText || encryptedText === null || encryptedText === undefined) {
    return null;
  }

  try {
    // Separar el nonce, auth tag y datos encriptados
    const parts = encryptedText.split(":");
    if (parts.length !== 3) {
      throw new Error("Invalid encrypted traffic data format");
    }

    const nonce = Buffer.from(parts[0], "base64");
    const authTag = Buffer.from(parts[1], "base64");
    const encrypted = parts[2];

    // Validar tamaños
    if (nonce.length !== IV_LENGTH) {
      throw new Error("Invalid nonce length");
    }
    if (authTag.length !== AUTH_TAG_LENGTH) {
      throw new Error("Invalid auth tag length");
    }

    // Crear el decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, nonce);
    
    // Establecer el auth tag para verificación
    decipher.setAuthTag(authTag);

    // Desencriptar y verificar autenticidad
    let decrypted = decipher.update(encrypted, "base64", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    // Si el auth tag no coincide, el decipher.final() lanzará un error
    throw new Error(`Traffic decryption failed: ${error.message}`);
  }
}

/**
 * Encripta un objeto con campos específicos para tránsito
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
 * Desencripta un objeto con campos específicos recibidos del tránsito
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

/**
 * Encripta un payload completo para envío seguro (útil para APIs)
 * @param {object} payload - El payload a encriptar
 * @returns {string} - El payload encriptado como string
 */
export function encryptPayload(payload) {
  const jsonString = JSON.stringify(payload);
  return encrypt(jsonString);
}

/**
 * Desencripta un payload recibido de forma segura
 * @param {string} encryptedPayload - El payload encriptado
 * @returns {object} - El payload desencriptado como objeto
 */
export function decryptPayload(encryptedPayload) {
  const decryptedString = decrypt(encryptedPayload);
  return JSON.parse(decryptedString);
}
