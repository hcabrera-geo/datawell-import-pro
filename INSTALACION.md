# DataWell Import Pro - Guía de Instalación y Uso

## ✅ Estado Actual

La aplicación ha sido **completamente configurada y compilada** como una aplicación Electron ejecutable en Windows.

### Problemas Resueltos:
✅ Eliminado `better-sqlite3` (requería Python)  
✅ Reemplazado con `sql.js` (SQLite puro en JavaScript)  
✅ Configurado Electron correctamente  
✅ Build completado exitosamente  
✅ Generados archivos .exe listos para distribuir  

---

## 📦 Archivos Generables

En la carpeta `release/` encontrarás dos opciones:

### 1. **Instalador (Recomendado)**
- **Archivo:** `DataWell Pro Setup 1.0.0.exe`
- **Tamaño:** ~89 MB
- **Uso:** Ejecuta el instalador para instalar la aplicación en tu PC
- **Ventajas:** 
  - Crea accesos directos en el escritorio y menú inicio
  - Maneja la desinstalación correctamente
  - Almacena datos en `%AppData%\DataWell Pro\`

### 2. **Ejecutable Portátil**
- **Archivo:** `DataWell Pro 1.0.0.exe`
- **Tamaño:** ~89 MB
- **Uso:** Ejecuta directamente sin instalación
- **Ventajas:**
  - No requiere instalación
  - Puedes mover a una USB
  - Almacena datos en la carpeta de la aplicación

---

## 🚀 Cómo Usar

### Opción 1: Instalador
```powershell
cd C:\Users\hcabr\Apps\datawell-import-pro\release
.\DataWell Pro Setup 1.0.0.exe
```
Sigue el asistente de instalación.

### Opción 2: Ejecutable Portátil
```powershell
cd C:\Users\hcabr\Apps\datawell-import-pro\release
.\DataWell Pro 1.0.0.exe
```

---

## 🔑 Credenciales Predeterminadas

```
Usuario: admin
Contraseña: 1234
Rol: Administrador
```

---

## 🗂️ Estructura de Base de Datos

La aplicación utiliza **SQLite** almacenado de forma segura:

**En modo instalado:**
```
C:\Users\<usuario>\AppData\Roaming\DataWell Pro\datawell.db
```

**En modo portátil:**
```
[carpeta_aplicación]\datawell.db
```

### Tablas incluidas:
- `app_users` - Usuarios de la aplicación
- `systems` - Sistemas de pozos
- `wells` - Datos de pozos
- `import_rules` - Reglas de importación
- `raw_measurements` - Mediciones brutas
- `daily_averages` - Promedios diarios
- `daily_report_entries` - Entradas de reportes

---

## 🛠️ Comandos Disponibles

### Desarrollo

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo con Electron
npm run electron

# Build para producción
npm run build

# Ver preview del build
npm run preview
```

### Generación de Ejecutables

```bash
# Compilar TypeScript, construir React y generar .exe
npm run electron:build

# Los archivos .exe estarán en la carpeta 'release/'
```

---

## 📋 Tecnologías Utilizadas

- **Frontend:** React 18 + TypeScript + Tailwind CSS
- **Desktop:** Electron 29
- **Base de Datos:** SQLite (sql.js)
- **Build Tool:** Vite
- **State Management:** React Context API
- **Charts:** Recharts
- **UI Components:** Lucide React

---

## 🔍 Funcionalidades

✅ **Gestión de Usuarios**
- Autenticación segura
- Control de roles (Admin/Technician)

✅ **Gestión de Sistemas y Pozos**
- Crear, editar, eliminar sistemas
- Crear, editar, eliminar pozos

✅ **Importación de Datos**
- Importar mediciones
- Procesar datos con reglas
- Calcular promedios diarios

✅ **Reportes**
- Generar reportes diarios
- Exportar a diferentes formatos

✅ **Gráficos y Análisis**
- Visualización de datos en tiempo real
- Gráficos históricos

---

## 🐛 Solución de Problemas

### "No se puede instalar la aplicación"
- Asegúrate de tener permisos de administrador
- Intenta con el ejecutable portátil en su lugar

### "La aplicación no guarda datos"
- Verifica que la carpeta de datos tenga permisos de escritura
- En modo instalado: `%AppData%\DataWell Pro\`
- En modo portátil: carpeta de la aplicación

### "Errores de compatibilidad"
- Requiere Windows 10 o superior
- Procesador x64

---

## 📝 Notas

- La base de datos se sincroniza automáticamente
- Los datos se almacenan localmente (sin conexión a internet requerida)
- Puedes hacer backup copiando el archivo `datawell.db`

---

## 🚢 Distribución

Para distribuir a otros usuarios:

1. Copia `DataWell Pro Setup 1.0.0.exe` o `DataWell Pro 1.0.0.exe`
2. Distribuye por USB, email, o descarga
3. Los usuarios ejecutan y ya está listo para usar

---

**Versión:** 1.0.0  
**Última actualización:** Diciembre 2025  
**Estado:** ✅ Producción
