# 🔐 Encriptación AES-256 para Datos Personales (PII)

## Resumen

Este sistema implementa encriptación **AES-256-CBC** en reposo para proteger datos personales identificables (PII) almacenados en MongoDB.

## Campos Encriptados

Los siguientes campos se encriptan antes de guardar en la base de datos:

- `first_name`
- `last_name`
- `username`
- `image_url`
- `email`

## Configuración Inicial

### 1. Generar la Llave de Encriptación

```bash
node generate-encryption-key.js
```

### 2. Agregar la Llave al archivo .env

```bash
# En tu archivo .env (NO subir a git)
ENCRYPTION_KEY=f8do2utrlBwEKgHFrEnC7uqiYMlBOQvPpMEwp0ApBvA=
```

### 3. Asegurar que .env está en .gitignore

```bash
echo ".env" >> .gitignore
```

## Cómo Funciona

### Encriptación

Cuando se registra un usuario, los datos PII se encriptan automáticamente:

```javascript
import { encrypt } from "./crypto.utils.js";

const encryptedName = encrypt("John Doe");
// Resultado: "iv:datosEncriptados" en base64
```

### Desencriptación

Para leer los datos, debes desencriptarlos:

```javascript
import { decrypt } from "./crypto.utils.js";

const user = await UserModel.findOne({ clerk_id: "user_123" });
const decryptedName = decrypt(user.first_name);
```

### Ejemplo Completo de Lectura

```javascript
import { decrypt } from "../auth/register/crypto.utils.js";

// Obtener usuario de la BD
const user = await UserModel.findOne({ clerk_id: userId });

// Desencriptar campos
const userData = {
  clerk_id: user.clerk_id,
  first_name: decrypt(user.first_name),
  last_name: decrypt(user.last_name),
  username: decrypt(user.username),
  email: decrypt(user.email),
  image_url: user.image_url ? decrypt(user.image_url) : null,
  role: user.role, // Este NO está encriptado
  created_at: user.created_at,
};
```

### Utilidades Adicionales

```javascript
import { encryptFields, decryptFields } from "./crypto.utils.js";

// Encriptar múltiples campos
const encryptedData = encryptFields(
  { first_name: "John", last_name: "Doe", role: "student" },
  ["first_name", "last_name"]
);

// Desencriptar múltiples campos
const decryptedData = decryptFields(user, [
  "first_name",
  "last_name",
  "username",
  "email",
  "image_url",
]);
```

## Seguridad

### ✅ Mejores Prácticas

1. **NUNCA** subas la llave de encriptación a git
2. **USA** la misma llave en todos los ambientes que comparten la misma BD
3. **GUARDA** la llave en un gestor de secretos (AWS Secrets Manager, HashiCorp Vault, etc.)
4. **ROTA** la llave periódicamente (requiere re-encriptar todos los datos)
5. **LIMITA** el acceso a la llave solo a personas autorizadas

### ⚠️ Advertencias

- Si pierdes la llave, **NO podrás recuperar los datos encriptados**
- Cada dato se encripta con un IV (Initialization Vector) único
- El formato almacenado es: `iv:datosEncriptados` (ambos en base64)

## Implementación en Otros Endpoints

Para usar encriptación en otros endpoints (ej: editar usuario):

```javascript
import { encrypt, decrypt } from "../auth/register/crypto.utils.js";

// Al actualizar
const updateData = {
  first_name: newFirstName ? encrypt(newFirstName) : user.first_name,
  last_name: newLastName ? encrypt(newLastName) : user.last_name,
};

await UserModel.updateOne({ clerk_id: userId }, updateData);
```

## Migración de Datos Existentes

Si ya tienes datos sin encriptar en la BD, necesitarás un script de migración:

```javascript
import { UserModel } from "./schema.js";
import { encrypt } from "./crypto.utils.js";

async function migrateExistingUsers() {
  const users = await UserModel.find({});

  for (const user of users) {
    // Solo encriptar si no está ya encriptado
    // (detectar por formato "iv:data")
    if (user.first_name && !user.first_name.includes(":")) {
      user.first_name = encrypt(user.first_name);
      user.last_name = encrypt(user.last_name);
      user.username = encrypt(user.username);
      user.email = encrypt(user.email);
      if (user.image_url) {
        user.image_url = encrypt(user.image_url);
      }
      await user.save();
    }
  }
}
```

## Rendimiento

- La encriptación AES-256 es muy rápida (< 1ms por campo)
- El IV aleatorio asegura que el mismo texto genere diferentes resultados
- El overhead de almacenamiento es ~1.5x el tamaño original

## Soporte

Para preguntas o problemas, contacta al equipo de seguridad.
