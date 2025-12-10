# Sistema de Auto-Update - Guía de Configuración

## 🎯 Descripción

Se ha implementado un sistema completo de actualizaciones automáticas usando `electron-updater` con soporte para GitHub Releases.

### Características:
✅ Verificación automática de actualizaciones cada hora  
✅ Descarga en segundo plano  
✅ Notificación visual con barra de progreso  
✅ Instalación con reinicio de la aplicación  
✅ Manejo de errores robusto  
✅ Interfaz de usuario amigable  

---

## 📋 Cómo Configurar

### 1. Configurar GitHub Releases

#### Opción A: Usando tu propio repositorio (RECOMENDADO)

1. Crea un repositorio en GitHub: `https://github.com/tu-usuario/datawell-import-pro`

2. Actualiza `package.json` con tus datos:
```json
"publish": {
  "provider": "github",
  "owner": "tu-usuario",
  "repo": "datawell-import-pro"
}
```

3. Genera un Token de GitHub:
   - Ve a Settings → Developer Settings → Personal Access Tokens
   - Crea un token con permisos `repo` y `releases`
   - Guarda el token como `GH_TOKEN` en tus variables de entorno
   - **NOTA:** No compartas tu token en repositorios públicos. Úsalo solo en variables de entorno locales o secretos de GitHub Actions.

4. Sube tu código a GitHub:
```bash
git remote add origin https://github.com/hcabrera-geo/datawell-import-pro.git
git push -u origin main
```

### 2. Crear una Release en GitHub

1. Compila la aplicación:
```bash
npm run electron:build
```

2. Ve a GitHub → Releases → Create a new release

3. Crea una release con:
   - **Tag:** `v1.0.1` (incrementa la versión en `package.json`)
   - **Release Title:** `DataWell Pro v1.0.1`
   - **Description:** Cambios realizados
   - **Archivos:** Sube los .exe desde `release/`:
     - `DataWell Pro Setup 1.0.0.exe`
     - `DataWell Pro 1.0.0.exe`
     - `DataWell Pro 1.0.0.exe.blockmap`

### 3. Configurar Variables de Entorno

Para CI/CD (GitHub Actions):

1. Ve a Settings → Secrets and variables → Actions → New repository secret
2. Añade: `GH_TOKEN` con tu Personal Access Token

```bash
# Para desarrollo local:
set GH_TOKEN=your_token_here
npm run electron:build
```

---

## 🔄 Flujo de Actualización

### Lado del Cliente:

```
1. Aplicación inicia
   ↓
2. Verifica GitHub Releases por actualizaciones
   ↓
3. Si hay actualización disponible:
   - Muestra notificación en pantalla
   - Usuario puede descargar ahora o más tarde
   ↓
4. Si usuario confirma:
   - Descarga archivo .exe en segundo plano
   - Muestra barra de progreso
   ↓
5. Una vez descargado:
   - Notifica que está listo
   - Permite instalar ahora o más tarde
   ↓
6. Al instalar:
   - Cierra la aplicación
   - Ejecuta el instalador
   - Reinicia la aplicación con nueva versión
```

---

## 🔌 API Expuesta en Frontend

```typescript
// Verificar actualizaciones
const result = await window.electronAPI.checkForUpdates();
// Resultado: { updateAvailable: boolean, version: string, currentVersion: string }

// Descargar actualización
await window.electronAPI.downloadUpdate();

// Instalar actualización
await window.electronAPI.installUpdate();

// Obtener estado
const status = await window.electronAPI.getUpdateStatus();

// Escuchar cambios de estado
window.electronAPI.onUpdateStatus((data) => {
  console.log('Update status:', data);
  // data = { status, message, version, progress }
});

// Escuchar progreso de descarga
window.electronAPI.onUpdateProgress((data) => {
  console.log(`Downloading: ${data.percent}%`);
});
```

---

## 📱 Componente UpdateNotification

El componente `UpdateNotification.tsx` está integrado en `App.tsx` y maneja:

- ✅ Detección automática de actualizaciones
- ✅ Notificaciones visuales en tiempo real
- ✅ Barra de progreso de descarga
- ✅ Botones de acción (Descargar, Instalar, Más tarde)
- ✅ Minimizar notificaciones en segundo plano
- ✅ Auto-cierre de mensajes de éxito

### Estados:
- **checking** - Buscando actualizaciones
- **available** - Actualización disponible
- **downloading** - Descargando
- **downloaded** - Listo para instalar
- **not-available** - Ya está actualizado
- **error** - Error en proceso

---

## 🛠️ Configuración Alternativa: Servidor Personalizado

Si quieres usar un servidor propio en lugar de GitHub:

```json
"publish": {
  "provider": "generic",
  "url": "https://your-server.com/updates"
}
```

Estructura esperada en el servidor:
```
/updates/
├── latest.yml  (metadatos de la última versión)
├── DataWell Pro 1.0.1.exe
└── DataWell Pro 1.0.1.exe.blockmap
```

---

## 📝 Versionado Semántico

Recomendamos seguir [Semantic Versioning](https://semver.org/):

```
MAJOR.MINOR.PATCH

1.0.0  → 1.0.1  (patch: bugfix)
1.0.0  → 1.1.0  (minor: nueva funcionalidad)
1.0.0  → 2.0.0  (major: cambios incompatibles)
```

---

## 🐛 Solución de Problemas

### "Las actualizaciones no se detectan"
- Verifica que `GH_TOKEN` está en variables de entorno
- Comprueba que tienes releases en GitHub
- Revisa los logs en `~/.config/DataWell Pro/logs/main.log`

### "Error descargando actualización"
- Verifica conexión a internet
- Comprueba permisos de carpeta de la aplicación
- Revisa firewall/proxy

### "No aparece barra de progreso"
- Los listeners deben estar conectados antes de la descarga
- Verifica que electron-updater está actualizado

### "Actualización se queda en 'descargando'"
- Reinicia la aplicación
- Comprueba espacio en disco
- Revisa logs de electron-updater

---

## 📊 Logs

Los logs se almacenan en:

**Windows:**
```
C:\Users\<usuario>\AppData\Roaming\DataWell Pro\logs\main.log
```

Ver logs:
```javascript
// En desarrollo
npm run electron
// Los logs aparecerán en consola

// En producción
// Revisar archivo de logs
```

---

## 🚀 Deployment con GitHub Actions (Opcional)

Crear archivo `.github/workflows/release.yml`:

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run electron:build
      - uses: softprops/action-gh-release@v1
        with:
          files: release/**
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

## ✅ Checklist para Próximas Versiones

- [ ] Incrementar versión en `package.json`
- [ ] Actualizar CHANGELOG.md
- [ ] Compilar: `npm run electron:build`
- [ ] Crear release en GitHub
- [ ] Subir archivos .exe y .blockmap
- [ ] Los usuarios recibirán notificación automáticamente

---

**Versión:** 1.0.0  
**Última actualización:** Diciembre 2025
