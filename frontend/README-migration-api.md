Plan de migración: API de frontend a backend
- Objetivo: Reemplazar los datos basados ​​en localStorage por una API centralizada de backend.
- Pasos:
1) Introducir apiClient.ts en src/services para encapsular los endpoints de backend.
2) Introducir AuthContext para gestionar el inicio de sesión, el registro y el cierre de sesión, así como la gestión de tokens (evitar localStorage; usar sessionStorage como alternativa).
3) Exponer un gancho useAuth() para que los componentes accedan al estado de autenticación.
4) Adaptar los componentes para que invoquen métodos de apiClient en lugar de servicios respaldados por localStorage.
5) Añadir la variable de entorno REACT_APP_API_BASE_URL para que apunte al backend (predeterminado: http://localhost:3000).
- MVP: implementar inicio de sesión, registro, obtención de billeteras, creación de billeteras, obtención y adición de transacciones. Los cambios en la interfaz de usuario son incrementales.
- Seguridad: nunca codificar credenciales de forma rígida; almacenar tokens de forma segura en la memoria/almacenamiento de sesión; validar entradas en la interfaz de usuario y el servidor.
