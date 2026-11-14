# SeriesHub

**SeriesHub** es una aplicación web para descubrir series, organizarlas en listas personales y participar en una comunidad mediante reseñas y foros. Está orientada a personas que quieren seguir las series que ven, guardar las que les interesan y compartir opiniones.

## Funcionalidades principales

- Explorar series en tendencia y buscar títulos.
- Consultar información de series a través de la API de TMDB.
- Agregar o quitar series de **Favoritos**, **Pendientes**, **Viendo** y **Ya vistas**.
- Crear, consultar, editar y eliminar reseñas con puntuaciones.
- Participar en foros de la comunidad y sus conversaciones.
- Personalizar el perfil y consultar la actividad relacionada con series.
- Conservar datos en **Cloud Firestore** para que sigan disponibles al recargar la página.

## Tecnologías

- **React** para la interfaz y sus componentes.
- **Vite** para el entorno de desarrollo y la compilación.
- **React Router** para la navegación.
- **Firebase Authentication** (inicio de sesión anónimo).
- **Cloud Firestore** para guardar y consultar información.
- **TMDB API** para obtener datos sobre series.

## Requisitos previos

- Node.js y npm instalados. Se recomienda usar una versión reciente y compatible con las dependencias del proyecto.
- Un proyecto de Firebase con **Cloud Firestore** habilitado y **Authentication > Anonymous** activado.
- Una clave **API v3** de TMDB.

## Instalación y ejecución local

1. Clonar el repositorio:

   ```bash
   git clone https://github.com/milivulcano/serieshub.git
   cd serieshub
   ```

2. Instalar dependencias:

   ```bash
   npm install
   ```

3. Crear un archivo `.env` en la carpeta raíz usando `.env.example` como referencia. Completar estas variables con los datos correspondientes:

   ```dotenv
   VITE_FIREBASE_API_KEY=
   VITE_FIREBASE_AUTH_DOMAIN=
   VITE_FIREBASE_PROJECT_ID=
   VITE_FIREBASE_STORAGE_BUCKET=
   VITE_FIREBASE_MESSAGING_SENDER_ID=
   VITE_FIREBASE_APP_ID=
   VITE_TMDB_API_KEY=
   ```

   Los datos de Firebase se obtienen en la configuración de la aplicación web de Firebase. La clave de TMDB se obtiene desde una cuenta de TMDB con acceso a su API.

4. En Firebase Console, habilitar **Authentication > Sign-in method > Anonymous**, crear la base de **Cloud Firestore** y publicar reglas de seguridad adecuadas. El archivo [`firestore.rules`](./firestore.rules) documenta las reglas utilizadas por este proyecto. **Agregar el archivo a GitHub no publica las reglas automáticamente en Firebase.**

5. Iniciar la aplicación:

   ```bash
   npm run dev
   ```

6. Abrir en el navegador la dirección local indicada por Vite (habitualmente `http://localhost:5173`).

> Importante: las variables `VITE_` se incluyen en el código enviado al navegador. No guardar contraseñas ni credenciales privadas en ellas. El archivo `.env` se excluye del repositorio mediante `.gitignore`.

## Compilación para producción

```bash
npm run build
```

La versión compilada se genera en `dist/`. Para probarla localmente:

```bash
npm run preview
```

## Persistencia y cuentas anónimas

Los datos de listas, reseñas, foros y perfiles se administran con Firestore. La aplicación usa autenticación anónima para asociar datos a un usuario. Si se abre desde otro navegador o dispositivo, puede generarse una identidad anónima distinta y no recuperarse automáticamente las mismas listas personales.

## Estructura principal

```text
src/
├── components/       # Componentes reutilizables
├── context/          # Estado y listas de series
├── pages/            # Vistas de la aplicación
├── services/         # Consultas a TMDB y a Firestore
├── firebase.js       # Inicialización de Firebase
├── App.jsx           # Rutas principales
└── main.jsx          # Punto de entrada
```

## Publicación

La aplicación está prevista para desplegarse en **Vercel** conectando este repositorio de GitHub. En Vercel se configuran las mismas variables de entorno del `.env` para **Production**, se usa `npm run build` como comando de compilación y `dist` como directorio de salida. La URL pública se incorporará a la entrega cuando se complete el despliegue.

## Material de entrega

Trabajo Práctico 2 — Desarrollo Frontend II (2026). El repositorio incluye el código fuente y la copia de las reglas de Firestore. El informe, la bitácora de iteraciones y la demostración se presentan como parte de la entrega académica.