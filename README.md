# Stargaze
**Stargaze** es un Sistema Inteligente de Organización de Tareas por Voz basado en Inteligencia Artificial Conversacional. Permite a los usuarios gestionar actividades mediante interacción natural por voz en tiempo real, integrando reconocimiento de voz, procesamiento contextual mediante LLM y respuestas habladas.

---

## Características

- Registro e inicio de sesión mediante Firebase Authentication.
- Grabación de audio desde el navegador.
- Conversión de voz a texto (Speech-to-Text).
- Interpretación contextual mediante LLM.
- Gestión CRUD de tareas.
- Conversión de respuestas de texto a voz (Text-to-Speech).
- Interfaz temática espacial para visualización de tareas.
- Procesamiento conversacional en tiempo real.
- Registro de métricas y monitoreo del sistema.

---

## Tecnologías

- Backend: FastAPI + Python
- Frontend: React + Vite
- Base de datos: PostgreSQL
- Autenticación: Firebase Authentication
- Speech-to-Text: Faster-Whisper
- Text-to-Speech: Coqui TTS
- LLM: Gemini API
- Contenedores: Docker + Docker Compose
- CI/CD: GitHub Actions
- Monitoreo: Prometheus + Grafana
- Despliegue: Render + Vercel

---

## Requisitos

- Docker >= 24.x
- Docker Compose >= 2.x
- Cuenta y credenciales de Firebase
- API Key de Gemini
---

## Instalación y Ejecución

1. Clona el repositorio:
```
git clone https://github.com/Juanmaperea/Stargaze.git
cd Stargaze
```
2. Configurar el archivo .env de acuerdo al archivo .env.example
   
3. Coloca el archivo firebase-credentials.json en la ubicacion app/firebase/firebase_credentials.json

4. Construye y levanta los contenedores con Docker Compose:
```
docker-compose up --build
```
Esto iniciará tres servicios principales:
- backend: API de FastAPI
- frontend: Aplicación React
- db: Base de datos PostgreSQL

Para ver los contenedores levantados puedes usar el comando 
```
docker ps
```
<img width="1211" height="141" alt="image" src="https://github.com/user-attachments/assets/a0650d40-ba51-432f-a848-c36339f7f9c1" />

5. Accede a la aplicación:

* Frontend: http://localhost:80
* API: http://localhost:8000/docs

---

## Uso

1. Inicia sesión o regístrate en la plataforma.
2. Presiona el botón de grabación en la interfaz.
3. Habla naturalmente indicando la acción que deseas realizar.
4. El sistema procesará tu voz y ejecutará la acción correspondiente.
5. Escucharás una respuesta generada automáticamente y verás la actualización de tus tareas en pantalla.

---

## Estructura del Proyecto
```
├─ backend/         # Código de FastAPI
├─ frontend_stargaze/        # Código de React + Vite
├─ docker-compose.yml
└─ README.md
```






