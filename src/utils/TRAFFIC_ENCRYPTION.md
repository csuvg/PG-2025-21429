# Traffic Encryption (TLS 1.3 Style)

This module provides **AES-256-GCM** encryption for data in transit/traffic between frontend and backend. It uses the same AEAD (Authenticated Encryption with Associated Data) cipher suite that TLS 1.3 uses.

## Why AES-256-GCM?

- **TLS 1.3 Standard**: AES-256-GCM is one of the mandatory cipher suites in TLS 1.3
- **AEAD**: Provides both **confidentiality** (encryption) and **authenticity** (authentication)
- **Secure**: Protects against tampering - any modification to the encrypted data will be detected
- **Performance**: Highly optimized in modern CPUs with hardware acceleration

## Setup

### 1. Generate a 256-bit Key

```bash
node -e "console.log('TRAFFIC_ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('base64'))"
```

Example output:

```
TRAFFIC_ENCRYPTION_KEY=2ouitNR1kd42Yokr/24Ue5y7RHOyGJpnvw3EzmvpbPQ=
```

### 2. Add to Environment Variables

Add the generated key to your `.env` file:

```env
TRAFFIC_ENCRYPTION_KEY=your_generated_key_here
```

**Important**: This key should be the **same** on both backend and frontend for the encryption/decryption to work properly.

## Usage

### Backend (Node.js)

```javascript
import {
  encrypt,
  decrypt,
  encryptPayload,
  decryptPayload,
  encryptFields,
  decryptFields,
} from "./utils/traffic.crypto.js";

// Encrypt a string
const sensitiveData = "user's email or password";
const encrypted = encrypt(sensitiveData);

// Decrypt a string
const decrypted = decrypt(encrypted);

// Encrypt entire payload (useful for API responses)
const payload = { userId: 123, email: "user@example.com", token: "abc123" };
const encryptedPayload = encryptPayload(payload);

// Decrypt payload (useful for API requests)
const decryptedPayload = decryptPayload(encryptedPayload);

// Encrypt specific fields in an object
const user = { name: "John", email: "john@example.com", phone: "+123456789" };
const userWithEncryptedFields = encryptFields(user, ["email", "phone"]);

// Decrypt specific fields in an object
const userWithDecryptedFields = decryptFields(userWithEncryptedFields, [
  "email",
  "phone",
]);
```

### Frontend (Browser with Web Crypto API)

For the frontend, you'll need to adapt the code to use the Web Crypto API since Node's `crypto` module isn't available in browsers. Here's a compatible version:

```javascript
// Frontend version (browser-compatible)
const TRAFFIC_ENCRYPTION_KEY = "your_key_in_base64"; // Store securely, consider using environment variables

// Convert base64 key to ArrayBuffer
async function importKey() {
  const keyData = Uint8Array.from(atob(TRAFFIC_ENCRYPTION_KEY), (c) =>
    c.charCodeAt(0)
  );
  return await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

// Encrypt function for frontend
async function encryptFrontend(text) {
  const key = await importKey();
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  const data = encoder.encode(text);

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: nonce },
    key,
    data
  );

  // Convert to base64 and format as "nonce:authTag:data"
  const encryptedArray = new Uint8Array(encrypted);
  const authTag = encryptedArray.slice(-16);
  const ciphertext = encryptedArray.slice(0, -16);

  return `${btoa(String.fromCharCode(...nonce))}:${btoa(
    String.fromCharCode(...authTag)
  )}:${btoa(String.fromCharCode(...ciphertext))}`;
}

// Decrypt function for frontend
async function decryptFrontend(encryptedText) {
  const key = await importKey();
  const [nonceB64, authTagB64, dataB64] = encryptedText.split(":");

  const nonce = Uint8Array.from(atob(nonceB64), (c) => c.charCodeAt(0));
  const authTag = Uint8Array.from(atob(authTagB64), (c) => c.charCodeAt(0));
  const ciphertext = Uint8Array.from(atob(dataB64), (c) => c.charCodeAt(0));

  // Combine ciphertext and authTag
  const encryptedData = new Uint8Array([...ciphertext, ...authTag]);

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: nonce },
    key,
    encryptedData
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}
```

## Use Cases

### 1. Protect Sensitive Data in API Calls

```javascript
// Backend - Send encrypted response
app.get("/api/user/sensitive-data", (req, res) => {
  const userData = {
    ssn: "123-45-6789",
    creditCard: "4111111111111111",
    address: "123 Main St",
  };

  const encryptedPayload = encryptPayload(userData);
  res.json({ data: encryptedPayload });
});

// Frontend - Decrypt response
const response = await fetch("/api/user/sensitive-data");
const { data } = await response.json();
const decryptedData = await decryptPayloadFrontend(data);
```

### 2. Encrypt Sensitive Fields Only

```javascript
// Encrypt only specific sensitive fields
const user = {
  id: 123,
  username: "john_doe",
  email: "john@example.com",
  phone: "+1234567890",
  address: "123 Main St",
};

// Only encrypt email, phone, and address
const encryptedUser = encryptFields(user, ["email", "phone", "address"]);
```

## Security Notes

1. **Key Management**: Never commit your `TRAFFIC_ENCRYPTION_KEY` to version control
2. **HTTPS Required**: This is NOT a replacement for HTTPS/TLS. Always use HTTPS in production
3. **Additional Layer**: This provides an extra layer of end-to-end encryption for sensitive data
4. **Frontend Security**: Be cautious about storing the encryption key in the frontend. Consider:
   - Deriving it from user credentials
   - Fetching it securely after authentication
   - Using a key exchange protocol
5. **Auth Tag**: The authentication tag prevents tampering. If data is modified, decryption will fail

## Differences from repose.crypto.js

| Feature        | repose.crypto.js | traffic.crypto.js      |
| -------------- | ---------------- | ---------------------- |
| Purpose        | Data at rest     | Data in transit        |
| Algorithm      | AES-256-CBC      | AES-256-GCM            |
| Authentication | No               | Yes (AEAD)             |
| Key            | ENCRYPTION_KEY   | TRAFFIC_ENCRYPTION_KEY |
| Use Case       | Database storage | Network transmission   |

## Format

Encrypted data format: `nonce:authTag:encryptedData` (all in base64)

- **nonce**: 12 bytes (96 bits) - unique for each encryption
- **authTag**: 16 bytes (128 bits) - authentication tag
- **encryptedData**: variable length - the actual encrypted content
