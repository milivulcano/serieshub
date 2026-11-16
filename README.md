# SeriesHub

**SeriesHub** es una aplicación web para descubrir series, organizarlas en listas personales, registrar lo que se vio y participar en una comunidad mediante reseñas y foros. Está orientada a personas que quieren seguir sus series, guardar las que les interesan y compartir opiniones.

## Funcionalidades principales

- Explorar series en tendencia y buscar títulos desde la página principal y el menú.
- Consultar información de series mediante **TMDB**: sinopsis, plataformas disponibles, tráiler, reparto, equipo y series similares.
- Organizar series en **Favoritos**, **Pendientes**, **Viendo** y **Series vistas**.
- Registrar una serie con puntuación y fecha de visualización, con o sin comentario; editar o eliminar registros propios.
- Consultar el **Diario**, ordenado por fecha de visualización y separado por años, y la **Actividad reciente**, ordenada por publicación.
- Crear foros, seguirlos y participar mediante publicaciones; editar y eliminar contenido propio según los permisos establecidos.
- Personalizar el perfil con avatares SVG y colores; elegir iconos para los foros.
- Guardar listas, perfiles, registros y contenido de la comunidad en **Cloud Firestore**.

## Tecnologías

- **React** para la interfaz y los componentes.
- **Vite** para el entorno de desarrollo y la compilación.
- **React Router** para la navegación.
- **Firebase Authentication** con inicio de sesión anónimo.
- **Cloud Firestore** para persistencia y operaciones sobre los datos.
- **TMDB API** para los datos de series.
- **Vercel** para publicar la aplicación.

## Requisitos previos

- Node.js y npm instalados, en versiones compatibles con las dependencias del proyecto.
- Un proyecto Firebase con **Cloud Firestore** y **Authentication > Anonymous** habilitado.
- Una clave de la **API v3 de TMDB**.

## Instalación y ejecución local

1. Clonar el repositorio:

   ```bash
   git clone https://github.com/milivulcano/serieshub.git
   cd serieshub
   ```

2. Instalar las dependencias:

   ```bash
   npm install
   ```

3. Crear un archivo `.env` en la raíz del proyecto tomando `.env.example` como referencia y completar los valores:

   ```dotenv
   VITE_FIREBASE_API_KEY=
   VITE_FIREBASE_AUTH_DOMAIN=
   VITE_FIREBASE_PROJECT_ID=
   VITE_FIREBASE_STORAGE_BUCKET=
   VITE_FIREBASE_MESSAGING_SENDER_ID=
   VITE_FIREBASE_APP_ID=
   VITE_TMDB_API_KEY=
   ```

   Los datos de Firebase se obtienen desde la configuración de su aplicación web en Firebase Console. La clave de TMDB se obtiene desde la configuración de API de una cuenta de TMDB.

4. En Firebase Console, habilitar **Authentication > Sign-in method > Anonymous**, configurar **Cloud Firestore** y publicar las reglas correspondientes. El archivo [`firestore.rules`](./firestore.rules) contiene una copia de las reglas utilizadas por el proyecto. **Subir ese archivo a GitHub no publica las reglas automáticamente en Firebase.**

5. Ejecutar:

   ```bash
   npm run dev
   ```

6. Abrir la dirección indicada por Vite en la terminal, normalmente `http://localhost:5173`.

> **Seguridad:** las variables con prefijo `VITE_` se incorporan al código que recibe el navegador. No incluir contraseñas ni secretos de servidor. La seguridad de los datos en Firestore depende de las reglas publicadas y la autenticación. El archivo `.env` real no debe subirse al repositorio.

## Compilación para producción

```bash
npm run build
```

Los archivos compilados se generan en `dist/`. Para revisar localmente la compilación:

```bash
npm run preview
```

## Persistencia y cuentas anónimas

Las listas, registros, perfiles y foros se almacenan en Firestore. Firebase Authentication asigna una identidad anónima a cada usuario. Si se abre SeriesHub desde otro navegador o dispositivo, puede crearse otra identidad y no recuperarse automáticamente los datos personales de la sesión anterior.

Los datos de series y las recomendaciones visualizadas provienen de TMDB, por lo que su disponibilidad depende de esa API.

## Estructura principal

```text
public/
└── assets/           # Isologo, favicon, avatares e iconos de foros
src/
├── components/       # Componentes reutilizables
├── context/          # Estado y listas de series
├── pages/            # Vistas de la aplicación
├── services/         # Consultas a TMDB, Firestore y recursos visuales
├── firebase.js       # Inicialización de Firebase
├── App.jsx           # Rutas principales
└── main.jsx          # Punto de entrada
firestore.rules        # Copia de las reglas de Firestore
.env.example           # Nombres de las variables de entorno
```

## Publicación

SeriesHub está desplegada en **Vercel** a partir del repositorio de GitHub. La configuración de producción utiliza `npm run build` y el directorio de salida `dist/`. Las variables de entorno se configuran en el panel de Vercel para el entorno de producción.

**URL de la aplicación:** https://serieshub-plum.vercel.app/

## Material de entrega

**Trabajo Práctico 2 — Desarrollo Frontend II (2026).** Este repositorio contiene el código fuente, las instrucciones de instalación, la configuración de ejemplo y una copia de las reglas de Firestore.