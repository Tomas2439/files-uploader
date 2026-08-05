# Odin Drive - File Uploader 📁☁️

Un clon moderno y funcional de **Google Drive** desarrollado para el módulo de Node.js de [The Odin Project](https://www.theodinproject.com/lessons/nodejs-file-uploader).

## 🚀 Características

- 🔐 **Autenticación de Usuarios**: Registro e inicio de sesión seguro con Passport.js y bcrypt.
- 💾 **Persistencia de Sesiones**: Sesiones de usuario almacenadas en base de datos mediante Prisma ORM.
- 📁 **Gestión de Carpetas (CRUD)**: Creación de carpetas principales y subcarpetas anidadas, renombrado, eliminación en cascada y navegación por migas de pan (Breadcrumbs).
- 📤 **Carga de Archivos**: Subida multipart mediante `multer` con validación de tamaño máximo (15 MB) y tipos de archivo.
- ☁️ **Almacenamiento en la Nube / Local**: Integración directa con **Cloudinary** SDK y motor de respaldo local automático.
- 🔗 **Compartir Carpetas (Crédito Extra)**: Generación de enlaces temporales con expiración personalizable (1h, 1d, 7d, 10d, 30d) accesibles públicamente.
- 🎨 **Diseño Moderno**: Interfaz oscura con efectos glassmorphism, modales y diseño adaptable.

## 🛠️ Tecnologías Utilizadas

- **Backend**: Node.js, Express.js
- **Base de Datos & ORM**: SQLite / PostgreSQL, Prisma ORM
- **Autenticación**: Passport.js (Estrategia Local), `express-session`, `bcryptjs`
- **Subida & Nube**: `multer`, Cloudinary SDK
- **Frontend & Estilos**: EJS templates, Vanilla CSS3 (Glassmorphism & Flex/Grid)

## 💻 Instalación y Configuración Local

1. **Clonar el repositorio**:
   ```bash
   git clone https://github.com/Tomas2439/files-uploader.git
   cd files-uploader
   ```

2. **Instalar dependencias**:
   ```bash
   pnpm install
   ```

3. **Configurar variables de entorno**:
   Crea un archivo `.env` basado en `.env.example`:
   ```env
   PORT=3000
   DATABASE_URL="file:./dev.db"
   SESSION_SECRET="tu-secreto-de-sesion"

   # Opcional (si deseas usar Cloudinary en lugar de almacenamiento local)
   CLOUDINARY_CLOUD_NAME="tu_cloud_name"
   CLOUDINARY_API_KEY="tu_api_key"
   CLOUDINARY_API_SECRET="tu_api_secret"
   ```

4. **Sincronizar base de datos**:
   ```bash
   npx prisma db push
   ```

5. **Iniciar en modo desarrollo**:
   ```bash
   pnpm dev
   ```

Visita `http://localhost:3000` en tu navegador.
