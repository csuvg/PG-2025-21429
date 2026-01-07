# Implementación de infraestructura cloud con políticas de seguridad para un sistema integrador de aplicaciones y modelos de inteligencia artificial de orientación vocacional

**Proyecto de Graduación 2025**  
**Estudiante:** José Daniel Gómez Cabrera  
**Carnet:** 21429  
**Universidad del Valle de Guatemala**

---

## 📋 Descripción del Proyecto

Este proyecto implementa una infraestructura cloud serverless con políticas de seguridad avanzadas para **Mirai**, un sistema integrador de aplicaciones y modelos de inteligencia artificial diseñado para la orientación vocacional de estudiantes en Guatemala y Latinoamérica.

El sistema proporciona una plataforma completa que permite a los estudiantes explorar carreras, interactuar con contenido educativo, participar en foros de discusión, realizar evaluaciones vocacionales y recibir recomendaciones personalizadas basadas en inteligencia artificial.

**📹 Video Demo:** Ver demostración del sistema en [`demo/demo.mp4`](demo/demo.mp4)

**📄 Informe Final:** Ver informe completo del proyecto en [`docs/informe_final.pdf`](docs/informe_final.pdf)

## 🏗️ Arquitectura

### Infraestructura AWS

El sistema está desplegado en **AWS** utilizando una arquitectura serverless y microservicios dentro de una **VPC (Virtual Private Cloud)** en la región **us-east-2 (Ohio)**.

#### Componentes Principales

1. **Edge y Frontend Services**

   - **Web Application Firewall (WAF)**: Protección contra amenazas web
   - **CloudFront CDN**: Distribución global de contenido
   - **API Gateway**: Punto de entrada para todas las peticiones API

2. **Capa de Autorización**

   - **Lambda Authorizer (JWT)**: Validación de tokens JWT para autenticación de usuarios
   - **Webhook Authorizer (Signed)**: Validación de webhooks firmados desde Clerk

3. **Backend Serverless (VPC - Private Subnets)**

   - **36 Lambda Functions** distribuidas en:
     - **34 funciones Lambda** de features (endpoints principales)
     - **2 funciones Lambda** de autorización (middleware)
   - **Security Groups**: Control de acceso a nivel de red

4. **Microservicio de Recomendaciones**

   - **EC2 Instance**: Microservicio dedicado para recomendaciones basadas en IA
   - **VPC Link**: Conexión privada desde API Gateway
   - Endpoints: `/recommendations` y `/proxy+`

5. **Base de Datos**

   - **DocumentDB (MongoDB)**: Base de datos NoSQL para almacenamiento de datos
   - **Security Groups**: Aislamiento de red para la base de datos

6. **Autenticación Externa**
   - **Clerk**: Servicio de autenticación y gestión de usuarios
   - Integración mediante webhooks firmados

### Características de Seguridad

- **Encriptación en Reposo (AES-256-CBC)**: Datos personales (PII) encriptados antes de almacenarse en MongoDB
- **Encriptación en Tránsito (AES-256-GCM)**: Cifrado adicional para datos sensibles en tráfico de red
- **VPC con Subnets Privadas**: Aislamiento de recursos backend
- **Security Groups**: Control granular de acceso a nivel de red
- **WAF**: Protección contra ataques comunes (OWASP Top 10)
- **JWT Validation**: Autenticación basada en tokens

## 🛠️ Stack Tecnológico

### Backend

- **Runtime**: Node.js 18.x o superior (ES Modules)
- **Base de Datos**: MongoDB 6.0+ (DocumentDB en AWS)
- **ODM**: Mongoose 7.6+
- **Autenticación**: JWT con Clerk
- **Arquitectura**: Serverless (AWS Lambda)
- **Dependencias principales**:
  - `mongoose`: ^7.6.1
  - `dotenv`: ^17.2.3

### Infraestructura

- **Cloud Provider**: AWS (con soporte multi-cloud: AWS, Azure, GCP)
- **Compute**: AWS Lambda (36 funciones)
- **API Gateway**: AWS API Gateway
- **CDN**: CloudFront
- **WAF**: AWS WAF
- **Networking**: VPC con subnets privadas
- **Base de Datos**: AWS DocumentDB
- **Microservicios**: EC2 para recomendaciones
- **IaC**: Terraform >= 1.0

### Seguridad

- **Encriptación en Reposo**: AES-256-CBC
- **Encriptación en Tránsito**: AES-256-GCM (TLS 1.3 style)
- **Autenticación**: JWT tokens con validación de clave pública
- **Webhooks**: Firma criptográfica para webhooks de Clerk

### DevOps

- **Infrastructure as Code**: Terraform
- **Testing**: K6 para pruebas de rendimiento
- **Monitoreo**: CloudWatch Logs

## 📦 Prerrequisitos

Antes de comenzar, asegúrate de tener instalado el siguiente software:

### Software Requerido

1. **Node.js** (versión 18.x o superior)

   - Descargar desde: https://nodejs.org/
   - Verificar instalación: `node --version`
   - Instalar npm (incluido con Node.js): `npm --version`

2. **Terraform** (versión 1.0 o superior)

   - macOS: `brew install terraform`
   - Linux: Descargar desde https://www.terraform.io/downloads
   - Verificar instalación: `terraform --version`

3. **AWS CLI** (para despliegue en AWS)

   - Instalar desde: https://aws.amazon.com/cli/
   - Verificar instalación: `aws --version`
   - Configurar credenciales: `aws configure`

4. **Git** (para clonar el repositorio)
   - Verificar instalación: `git --version`

### Cuentas y Servicios Externos

1. **MongoDB/DocumentDB**: Instancia de base de datos configurada

   - MongoDB Atlas (desarrollo)
   - AWS DocumentDB (producción)

2. **Clerk**: Cuenta de autenticación

   - Crear cuenta en: https://clerk.com/
   - Obtener claves API y configuración de webhooks

3. **AWS Account** (para despliegue en producción)
   - Configurar credenciales de acceso
   - Permisos para: Lambda, API Gateway, VPC, DocumentDB, IAM

### Variables de Entorno Necesarias

- `URI`: Cadena de conexión de MongoDB/DocumentDB
- `ENCRYPTION_KEY`: Clave para encriptación en reposo (base64)
- `TRAFFIC_ENCRYPTION_KEY`: Clave para encriptación en tránsito (base64)
- Variables específicas de Clerk (claves API, webhook secrets)

## 🚀 Instalación

### Paso 1: Clonar el Repositorio

```bash
git clone <url-del-repositorio>
cd PG-2025-21429
```

### Paso 2: Instalar Dependencias del Proyecto Principal

```bash
cd src
npm install
```

### Paso 3: Instalar Dependencias de las Funciones Lambda

Cada función Lambda tiene sus propias dependencias. Para instalar todas las dependencias:

```bash
# Instalar dependencias en cada función Lambda
find src/features -name "package.json" -execdir npm install \;
find src/middleware -name "package.json" -execdir npm install \;
```

**Nota:** Esto instalará las dependencias en todas las funciones Lambda del proyecto. El proceso puede tardar varios minutos.

### Paso 4: Configurar Variables de Entorno

1. **Crear archivo `.env` en cada función Lambda** (opcional para desarrollo local):

   ```bash
   # Ejemplo: src/features/auth/register/.env
   URI=mongodb://tu-connection-string
   ENCRYPTION_KEY=tu-clave-encriptacion-base64
   TRAFFIC_ENCRYPTION_KEY=tu-clave-trafico-base64
   ```

2. **Para despliegue con Terraform**, configurar variables en `terraform.tfvars` (ver sección de despliegue).

### Paso 5: Verificar Instalación

```bash
# Verificar estructura del proyecto
cd src
ls -la features/

# Verificar que las dependencias estén instaladas
cd features/auth/register
ls node_modules/  # Debe mostrar las dependencias instaladas
```

## ▶️ Ejecución

### Desarrollo Local

#### Ejecutar una Función Lambda Individualmente

Para probar una función Lambda localmente, puedes usar herramientas como:

1. **AWS SAM CLI** (recomendado):

   ```bash
   # Instalar SAM CLI
   brew install aws-sam-cli  # macOS

   # Inicializar proyecto SAM
   sam init

   # Ejecutar función localmente
   sam local invoke FunctionName --event event.json
   ```

2. **Serverless Framework**:

   ```bash
   npm install -g serverless
   serverless offline
   ```

3. **Node.js directo** (para pruebas básicas):
   ```bash
   cd src/features/auth/register
   node index.js
   ```

#### Ejecutar Pruebas de Rendimiento

```bash
# Instalar K6 (si no está instalado)
# macOS
brew install k6

# Linux
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Ejecutar pruebas
cd src/testing/performance
k6 run load.test.js
k6 run stress.test.js
k6 run spike.test.js
k6 run soak.test.js
```

### Despliegue en AWS

#### Paso 1: Configurar Credenciales de AWS

```bash
aws configure
# Ingresar:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region (ej: us-east-2)
# - Default output format (json)
```

#### Paso 2: Configurar Terraform

```bash
cd src/terraform
cp terraform.tfvars.example terraform.tfvars
```

Editar `terraform.tfvars` con tus valores:

```hcl
cloud_provider = "aws"
aws_region     = "us-east-2"
mongodb_uri    = "mongodb://tu-connection-string"
backend_url    = "https://tu-api-gateway-url"
```

#### Paso 3: Inicializar Terraform

```bash
terraform init
```

#### Paso 4: Revisar Plan de Despliegue

```bash
terraform plan
```

Esto mostrará todos los recursos que se crearán/modificarán.

#### Paso 5: Desplegar Infraestructura

```bash
terraform apply
```

Ingresar `yes` cuando se solicite confirmación.

El despliegue puede tardar varios minutos (15-30 minutos dependiendo de la cantidad de funciones).

#### Paso 6: Verificar Despliegue

```bash
# Ver outputs de Terraform
terraform output

# Listar funciones Lambda desplegadas
aws lambda list-functions --region us-east-2
```

### Despliegue Manual de Funciones Lambda

Si prefieres desplegar funciones individualmente:

```bash
# Navegar a la función
cd src/features/auth/register

# Crear paquete ZIP
zip -r function.zip . -x "*.git*" -x "node_modules/.cache/*"

# Desplegar a AWS Lambda (requiere AWS CLI)
aws lambda update-function-code \
  --function-name mirai-auth-register \
  --zip-file fileb://function.zip \
  --region us-east-2
```

**Nota:** El despliegue manual requiere que las funciones Lambda ya existan en AWS. Es recomendable usar Terraform para el despliegue completo.

## 🚀 Funcionalidades

### 🔐 Autenticación y Gestión de Usuarios

- **Registro de Usuarios** (`POST /auth/register`)

  - Creación de cuentas con integración Clerk
  - Validación de datos y prevención de duplicados
  - Encriptación de datos personales (PII)

- **Actualización de Usuario** (`PUT /auth/updateUser`)

  - Modificación de información de perfil
  - Encriptación automática de campos sensibles

- **Eliminación de Usuario** (`DELETE /auth/delete`)

  - Eliminación segura de cuentas de usuario

- **Obtener Usuario** (`GET /users/getUser`)

  - Consulta de perfil de usuario con desencriptación automática

- **Obtener Usuarios** (`GET /users/getUsers`)

  - Listado de usuarios con filtros y paginación

- **Editar Usuario** (`PUT /users/editUser`)
  - Edición de información de usuario

### 🎓 Carreras

- **Obtener Carreras** (`GET /careers/getCareers`)

  - Listado de carreras disponibles
  - Filtros por facultad, duración y nombre
  - Proyección optimizada de campos

- **Obtener Carrera** (`GET /careers/getCareer`)

  - Detalles completos de una carrera específica
  - Información de insights y estadísticas

- **Editar Insights de Carrera** (`PUT /careers/editCareerInsights`)
  - Actualización de información y estadísticas de carreras

### 🔍 Exploración de Contenido

- **Feed de Contenido** (`GET /explore/getFeed`)

  - Feed paginado de contenido
  - Filtrado por tipos: `career`, `alumni_story`, `what_if`, `short_question`
  - Ordenamiento basado en prioridad

- **Gestión de Tarjetas (Cards)**

  - **Crear Tarjeta** (`POST /explore/cards/newCard`): Creación de contenido con metadatos (solo admins/directores/maestros)
  - **Obtener Tarjeta** (`GET /explore/cards/getCard`): Consulta de tarjeta por ID
  - **Editar Tarjeta** (`PUT /explore/cards/editCard`): Modificación de contenido
  - **Eliminar Tarjeta** (`DELETE /explore/cards/deleteCard`): Eliminación de contenido

- **Testimonios** (`GET /explore/getTestimonies`)

  - Obtención de testimonios de estudiantes y egresados

- **Interacciones**

  - **Nueva Interacción** (`POST /explore/interactions/newInteraction`): Registro de interacciones (`view`, `tap`, `save`, `share`, `like`, `unlike`, `unsave`)
  - Tracking de duración y metadatos

- **Likes** (`POST /explore/likes/handleLikes`)
  - Gestión de likes en contenido

### 💬 Foros y Comentarios

- **Foros**

  - **Crear Foro** (`POST /forums/newForum`): Creación de nuevos foros de discusión
  - **Obtener Foros** (`GET /forums/getForums`): Listado de foros con desencriptación
  - **Obtener Foro** (`GET /forums/getForum`): Detalles de un foro específico
  - **Editar Foro** (`PUT /forums/editForum`): Modificación de foros
  - **Eliminar Foro** (`DELETE /forums/deleteForum`): Eliminación de foros

- **Comentarios**

  - **Nuevo Comentario** (`POST /forums/comments/newComment`): Creación de comentarios
  - **Editar Comentario** (`PUT /forums/comments/editComment`): Modificación de comentarios
  - **Eliminar Comentario** (`DELETE /forums/comments/deleteComment`): Eliminación de comentarios

- **Respuestas a Comentarios**
  - **Nueva Respuesta** (`POST /forums/comments/answers/newAnswer`): Respuestas a comentarios
  - **Editar Respuesta** (`PUT /forums/comments/answers/editAnswer`): Modificación de respuestas
  - **Eliminar Respuesta** (`DELETE /forums/comments/answers/deleteAnswer`): Eliminación de respuestas

### 📊 Cuestionarios y Resultados

- **Resultados de Quiz** (`GET /quiz/results/getResults`)

  - Obtención de resultados de evaluaciones vocacionales
  - Análisis de respuestas y recomendaciones

- **Eliminar Resultados** (`DELETE /quiz/results/deleteResults`)
  - Eliminación de resultados de quiz

### 📈 Analíticas

- **Obtener Analíticas** (`GET /analytics/getAnalytics`)
  - Estadísticas de estudiantes
  - Análisis de completitud de cuestionarios
  - Métricas de crecimiento mensual
  - Estadísticas de resultados de quiz

### 💾 Contenido Guardado

- **Guardar Item** (`POST /users/saved/saveItem`): Guardar contenido para lectura posterior
- **Obtener Items Guardados** (`GET /users/saved/getSavedItems`): Consulta de contenido guardado
- **Desguardar Item** (`DELETE /users/saved/unsaveItem`): Eliminar de contenido guardado

### 🤖 Recomendaciones

- **Obtener Recomendaciones** (`GET /recommendations`)
  - Recomendaciones personalizadas basadas en IA (Microservicio EC2)

## 📁 Estructura del Proyecto

```
PG-2025-21429/
├── src/
│   ├── features/              # Funciones Lambda por funcionalidad (34 funciones)
│   │   ├── analytics/         # Analíticas y estadísticas
│   │   │   └── getAnalytics/
│   │   ├── auth/              # Autenticación
│   │   │   ├── register/
│   │   │   ├── updateUser/
│   │   │   └── delete/
│   │   ├── careers/           # Gestión de carreras
│   │   │   ├── getCareers/
│   │   │   ├── getCareer/
│   │   │   └── editCareerInsights/
│   │   ├── explore/           # Exploración de contenido
│   │   │   ├── cards/         # Gestión de tarjetas
│   │   │   │   ├── newCard/
│   │   │   │   ├── getCard/
│   │   │   │   ├── editCard/
│   │   │   │   └── deleteCard/
│   │   │   ├── getFeed/
│   │   │   ├── getTestimonies/
│   │   │   ├── interactions/
│   │   │   │   └── newInteraction/
│   │   │   └── likes/
│   │   │       └── handleLikes/
│   │   ├── forums/            # Foros y comentarios
│   │   │   ├── newForum/
│   │   │   ├── getForums/
│   │   │   ├── getForum/
│   │   │   ├── editForum/
│   │   │   ├── deleteForum/
│   │   │   └── comments/
│   │   │       ├── newComment/
│   │   │       ├── editComment/
│   │   │       ├── deleteComment/
│   │   │       └── answers/
│   │   │           ├── newAnswer/
│   │   │           ├── editAnswer/
│   │   │           └── deleteAnswer/
│   │   ├── quiz/              # Cuestionarios vocacionales
│   │   │   └── results/
│   │   │       ├── getResults/
│   │   │       └── deleteResults/
│   │   └── users/             # Gestión de usuarios
│   │       ├── getUser/
│   │       ├── getUsers/
│   │       ├── editUser/
│   │       └── saved/
│   │           ├── saveItem/
│   │           ├── getSavedItems/
│   │           └── unsaveItem/
│   ├── middleware/            # Middleware de autorización (2 funciones)
│   │   ├── auth/              # Lambda Authorizer (JWT)
│   │   └── webhook-auth/      # Webhook Authorizer
│   ├── utils/                 # Utilidades compartidas
│   │   ├── repose.crypto.js   # Encriptación en reposo
│   │   ├── traffic.crypto.js  # Encriptación en tránsito
│   │   ├── ENCRYPTION.md      # Documentación de encriptación
│   │   └── TRAFFIC_ENCRYPTION.md
│   ├── terraform/             # Infraestructura como código
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   ├── deploy.sh
│   │   ├── terraform.tfvars.example
│   │   ├── README.md
│   │   ├── QUICKSTART.md
│   │   ├── modules/           # Módulos para AWS, Azure, GCP
│   │   │   ├── aws/
│   │   │   ├── azure/
│   │   │   └── gcp/
│   │   └── scripts/
│   │       └── list-functions.sh
│   ├── testing/               # Pruebas de rendimiento
│   │   └── performance/       # Tests de carga, estrés, spike, soak
│   │       ├── load.test.js
│   │       ├── stress.test.js
│   │       ├── spike.test.js
│   │       └── soak.test.js
│   └── public/                # Documentación y resultados
│       └── tests/             # Reportes de pruebas de rendimiento
├── docs/                      # Documentación del proyecto
│   └── informe_final.pdf      # Informe final de graduación
├── demo/                      # Demostraciones
│   └── demo.mp4               # Video demostración del sistema
└── README.md                  # Este archivo
```

## 🔒 Seguridad

### Encriptación de Datos Personales (PII)

El sistema implementa encriptación **AES-256-CBC** para los siguientes campos:

- `first_name`
- `last_name`
- `username`
- `email`
- `image_url`

**Configuración:**

```bash
ENCRYPTION_KEY=tu_clave_generada_en_base64
```

Para generar una clave de encriptación:

```bash
# Generar clave de 32 bytes en base64
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Encriptación de Tráfico

Implementación de **AES-256-GCM** (estilo TLS 1.3) para datos en tránsito:

- Autenticación y encriptación (AEAD)
- Protección contra manipulación de datos
- Formato: `nonce:authTag:encryptedData`

**Configuración:**

```bash
TRAFFIC_ENCRYPTION_KEY=tu_clave_generada_en_base64
```

### Políticas de Seguridad

- ✅ Datos encriptados en reposo y en tránsito
- ✅ VPC con subnets privadas
- ✅ Security Groups para control de acceso
- ✅ WAF para protección contra amenazas web
- ✅ Validación JWT con clave pública
- ✅ Webhooks firmados criptográficamente
- ✅ Variables de entorno para secretos

Para más información sobre seguridad, consulta:

- **Encriptación en Reposo**: [`src/utils/ENCRYPTION.md`](src/utils/ENCRYPTION.md)
- **Encriptación en Tránsito**: [`src/utils/TRAFFIC_ENCRYPTION.md`](src/utils/TRAFFIC_ENCRYPTION.md)

## 📊 Endpoints API

### Autenticación

- `POST /auth/register` - Registrar nuevo usuario
- `PUT /auth/updateUser` - Actualizar usuario
- `DELETE /auth/delete` - Eliminar usuario

### Usuarios

- `GET /users/getUser` - Obtener perfil de usuario
- `GET /users/getUsers` - Listar usuarios
- `PUT /users/editUser` - Editar usuario

### Carreras

- `GET /careers/getCareers` - Listar carreras
- `GET /careers/getCareer` - Obtener carrera específica
- `PUT /careers/editCareerInsights` - Editar insights de carrera

### Exploración

- `GET /explore/getFeed` - Obtener feed de contenido
- `POST /explore/cards/newCard` - Crear tarjeta
- `GET /explore/cards/getCard` - Obtener tarjeta
- `PUT /explore/cards/editCard` - Editar tarjeta
- `DELETE /explore/cards/deleteCard` - Eliminar tarjeta
- `GET /explore/getTestimonies` - Obtener testimonios
- `POST /explore/interactions/newInteraction` - Registrar interacción
- `POST /explore/likes/handleLikes` - Gestionar likes

### Foros

- `POST /forums/newForum` - Crear foro
- `GET /forums/getForums` - Listar foros
- `GET /forums/getForum` - Obtener foro específico
- `PUT /forums/editForum` - Editar foro
- `DELETE /forums/deleteForum` - Eliminar foro

### Comentarios

- `POST /forums/comments/newComment` - Crear comentario
- `PUT /forums/comments/editComment` - Editar comentario
- `DELETE /forums/comments/deleteComment` - Eliminar comentario
- `POST /forums/comments/answers/newAnswer` - Crear respuesta
- `PUT /forums/comments/answers/editAnswer` - Editar respuesta
- `DELETE /forums/comments/answers/deleteAnswer` - Eliminar respuesta

### Quiz

- `GET /quiz/results/getResults` - Obtener resultados de quiz
- `DELETE /quiz/results/deleteResults` - Eliminar resultados

### Analíticas

- `GET /analytics/getAnalytics` - Obtener estadísticas del sistema

### Contenido Guardado

- `POST /users/saved/saveItem` - Guardar item
- `GET /users/saved/getSavedItems` - Obtener items guardados
- `DELETE /users/saved/unsaveItem` - Desguardar item

### Recomendaciones

- `GET /recommendations` - Obtener recomendaciones personalizadas (Microservicio EC2)

## 🧪 Testing

El proyecto incluye pruebas de rendimiento utilizando **K6**:

### Tipos de Pruebas

1. **Load Testing**: Pruebas de carga con usuarios constantes

   - `get-careers`: 50 usuarios
   - `get-feed`: 40 usuarios
   - `get-forums`: Ramp-up de 10 a 45 usuarios
   - `get-profile`: 50 usuarios

2. **Stress Testing**: Pruebas de estrés hasta límites del sistema

   - `edit-comment`: Hasta 6,000 usuarios
   - `get-career`: Hasta 6,000 usuarios

3. **Spike Testing**: Pruebas de picos de tráfico

   - `get-careers`: De 20 a 100 usuarios
   - `get-profile`: De 10 a 100 usuarios
   - `get-quiz-results`: De 10 a 100 usuarios

4. **Soak Testing**: Pruebas de resistencia a largo plazo
   - `get-careers`: Pruebas de duración extendida

Los reportes de pruebas están disponibles en [`src/public/tests/`](src/public/tests/).

### Ejecutar Pruebas

```bash
cd src/testing/performance
k6 run load.test.js
k6 run stress.test.js
k6 run spike.test.js
k6 run soak.test.js
```

## 📚 Documentación Adicional

- **Infraestructura**: Ver [`src/terraform/README.md`](src/terraform/README.md) y [`src/terraform/QUICKSTART.md`](src/terraform/QUICKSTART.md)
- **Encriptación en Reposo**: Ver [`src/utils/ENCRYPTION.md`](src/utils/ENCRYPTION.md)
- **Encriptación en Tránsito**: Ver [`src/utils/TRAFFIC_ENCRYPTION.md`](src/utils/TRAFFIC_ENCRYPTION.md)
- **Informe Final**: Ver [`docs/informe_final.pdf`](docs/informe_final.pdf)
- **Video Demo**: Ver [`demo/demo.mp4`](demo/demo.mp4)

## 🎯 Objetivos del Proyecto

1. **Orientación Vocacional**: Proporcionar herramientas para ayudar a estudiantes a descubrir su vocación
2. **Escalabilidad**: Arquitectura serverless que escala automáticamente
3. **Seguridad**: Implementación de múltiples capas de seguridad
4. **Integración IA**: Sistema de recomendaciones basado en inteligencia artificial
5. **Accesibilidad**: Plataforma accesible para estudiantes de Guatemala y Latinoamérica

## 👨‍💻 Autor

**José Daniel Gómez Cabrera**  
Carnet: 21429  
Universidad del Valle de Guatemala  
Guatemala, Guatemala

## 📄 Licencia

Este proyecto es parte de un Trabajo de Graduación de la Universidad del Valle de Guatemala.

---

**Nota**: Este README es un documento vivo. Por favor, actualízalo conforme el proyecto evolucione.
