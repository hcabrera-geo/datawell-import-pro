# 🌍 DataWell Pro - Sistema de Importación de Datos Geotérmicos

**Versión:** 1.0.0 | **Estado:** ✅ Listo para Producción

## ✨ Características Principales

- **Gestión Completa** de pozos, sistemas y mediciones
- **Base de Datos Robusta** con SQLite
- **Auto-Update** - Actualizaciones automáticas cada hora
- **Reportes Profesionales** - Diarios, semanales y mensuales
- **Gráficos en Tiempo Real** - Visualización de datos
- **Exportación PDF** - Reportes descargables
- **Interfaz Moderna** - Diseño profesional con Tailwind CSS

---

## 🚀 Instalación Rápida

### Para Usuarios:
```bash
# Descarga uno de los ejecutables de la carpeta release/
1. DataWell Pro Setup 1.0.0.exe       (Instalador recomendado)
2. DataWell Pro 1.0.0.exe             (Portátil sin instalación)

# Ejecuta y listo
Credenciales:
  Usuario: admin
  Contraseña: 1234
```

### Para Desarrolladores:
```bash
# Instalar dependencias
npm install

# Desarrollo con Electron
npm run electron

# Build para producción
npm run electron:build

# Ejecutables en: release/
```

---

## 📚 Documentación

| Documento | Descripción |
|-----------|-------------|
| **INSTALACION.md** | 📖 Guía completa de instalación y uso |
| **AUTO-UPDATE.md** | 🔄 Configuración del sistema de actualizaciones |
| **AUTO-UPDATE-RESUMEN.md** | ⚡ Guía rápida de auto-update |
| **EXECUTIVE-SUMMARY.md** | 📊 Resumen ejecutivo del proyecto |
| **VISUAL-GUIDE.md** | 🎨 Diagramas y arquitectura visual |
| **CHECKLIST.md** | ✅ Lista de verificación completa |
| **README-FINAL.md** | 🎉 Estado final del proyecto |

---

## 🔄 Sistema Auto-Update

La aplicación verifica automáticamente nuevas versiones cada hora:

1. ✅ Notificación visual si hay actualización disponible
2. ✅ Descarga en segundo plano sin interrupciones
3. ✅ Barra de progreso en tiempo real
4. ✅ El usuario decide cuándo instalar
5. ✅ Instalación automática con reinicio

**Configurar GitHub Releases:**
Ver `AUTO-UPDATE.md` para instrucciones detalladas.

---

## 🛠️ Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Servidor Vite

# Build
npm run build            # TypeScript + Vite
npm run preview          # Preview
npm run electron         # Electron dev
npm run electron:build   # Build final con Electron

# Release (Windows)
.\release.ps1           # Script interactivo

# Release (Linux/Mac)
bash release.sh         # Script interactivo
```

---

## 📦 Archivos Generados

```
release/
├── DataWell Pro Setup 1.0.0.exe    (89 MB - Instalador)
├── DataWell Pro 1.0.0.exe          (89 MB - Portátil)
└── *.blockmap                      (Para delta updates)
```

---

## 🗄️ Base de Datos

SQLite almacenado en:
```
Windows: %AppData%\DataWell Pro\datawell.db
Linux:   ~/.config/DataWell Pro/datawell.db
Mac:     ~/Library/Application Support/DataWell Pro/datawell.db
```

Tablas incluidas:
- ✅ app_users
- ✅ systems
- ✅ wells
- ✅ import_rules
- ✅ raw_measurements
- ✅ daily_averages
- ✅ daily_report_entries

---

## 🎨 Estructura del Proyecto

```
datawell-import-pro/
├── App.tsx                          # Componente principal
├── package.json                     # Dependencias
├── index.html                       # HTML entry
├── tsconfig.json                    # TypeScript config
├── vite.config.ts                   # Vite config
│
├── electron/
│   ├── main.js                      # Electron principal
│   ├── preload.js                   # Preload bridge
│   ├── updater.js                   # ✨ Auto-update system
│   └── database.js                  # SQLite wrapper
│
├── components/
│   ├── Sidebar.tsx                  # Navegación
│   └── UpdateNotification.tsx        # ✨ Notificaciones de update
│
├── pages/
│   ├── Dashboard.tsx
│   ├── Wells.tsx
│   ├── Import.tsx
│   ├── Reports.tsx
│   ├── Averages.tsx
│   ├── Rules.tsx
│   ├── Config.tsx
│   ├── DatabaseManagement.tsx
│   └── UsersManagement.tsx
│
├── services/
│   └── dataService.ts               # API de datos
│
├── dist/                            # Build output
├── release/                         # Ejecutables
│
└── Documentación/
    ├── INSTALACION.md
    ├── AUTO-UPDATE.md
    ├── AUTO-UPDATE-RESUMEN.md
    ├── EXECUTIVE-SUMMARY.md
    ├── VISUAL-GUIDE.md
    ├── CHECKLIST.md
    └── README-FINAL.md
```

---

## 💻 Requisitos del Sistema

- **OS:** Windows 10+
- **Arquitectura:** x64
- **RAM:** 2 GB mínimo (4 GB recomendado)
- **Disco:** 150 MB disponibles
- **Internet:** Para actualizaciones (opcional)

---

## 🔐 Seguridad

- ✅ Autenticación de usuarios
- ✅ Roles de administrador y técnico
- ✅ Base de datos local (sin cloud)
- ✅ HTTPS para actualizaciones
- ✅ Checksums verificados

---

## 📞 Soporte

Para problemas o preguntas:
1. Revisa la documentación en este repositorio
2. Verifica los logs en: `%AppData%\DataWell Pro\logs\`
3. Revisa la sección de Issues (si aplica)

---

## 📈 Actualizaciones

### Crear una Nueva Versión:

**Windows:**
```powershell
.\release.ps1
# Sigue las instrucciones interactivas
```

**Linux/Mac:**
```bash
bash release.sh
# Sigue las instrucciones interactivas
```

**Manual:**
1. Incrementar versión en `package.json`
2. `npm run electron:build`
3. Crear release en GitHub
4. Upload archivos `.exe`

Los usuarios recibirán notificación automáticamente ✅

---

## 🤝 Contribuciones

Este es un proyecto propietario. Contacta con el desarrollador para cambios o mejoras.

---

## 📄 Licencia

Propietario - DataWell Pro © 2025

---

## 🎯 Roadmap Futuro

- [ ] Análisis predictivo
- [ ] Integración con APIs externas
- [ ] Sincronización en cloud (opcional)
- [ ] Reportes automáticos por email
- [ ] Móvil (companion app)

---

## 🎉 Gracias

¡Gracias por usar DataWell Pro!

**Versión actual:** 1.0.0  
**Última actualización:** Diciembre 2025  
**Estado:** ✅ Producción

---

**[Descargar Última Versión]** → `release/DataWell Pro Setup 1.0.0.exe`
