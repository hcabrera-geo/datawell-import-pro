#!/bin/bash
# Script para automatizar el proceso de release en GitHub

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== DataWell Pro - Release Helper ===${NC}"
echo ""

# Verificar si estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json no encontrado. Ejecuta desde la raíz del proyecto.${NC}"
    exit 1
fi

# Obtener versión actual
CURRENT_VERSION=$(grep '"version"' package.json | head -1 | sed 's/.*"version": "\([^"]*\)".*/\1/')
echo -e "Versión actual: ${YELLOW}$CURRENT_VERSION${NC}"

# Pedir nueva versión
read -p "Nueva versión (ej: 1.0.1): " NEW_VERSION

if [ -z "$NEW_VERSION" ]; then
    echo -e "${RED}Versión no puede estar vacía${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Preparando release v$NEW_VERSION...${NC}"
echo ""

# 1. Actualizar package.json
echo "1. Actualizando package.json..."
sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$NEW_VERSION\"/" package.json
echo -e "${GREEN}✓ Versión actualizada${NC}"

# 2. Compilar
echo ""
echo "2. Compilando aplicación..."
npm run electron:build
if [ $? -ne 0 ]; then
    echo -e "${RED}Error en compilación. Revirtiendo cambios...${NC}"
    git checkout package.json
    exit 1
fi
echo -e "${GREEN}✓ Compilación exitosa${NC}"

# 3. Commit y tag
echo ""
echo "3. Creando commit y tag..."
git add .
git commit -m "Release v$NEW_VERSION"
git tag -a "v$NEW_VERSION" -m "Release version $NEW_VERSION"
echo -e "${GREEN}✓ Commit y tag creados${NC}"

# 4. Instrucciones para push
echo ""
echo -e "${GREEN}=== Siguiente Paso ===${NC}"
echo ""
echo "Para publicar el release:"
echo ""
echo -e "${YELLOW}  git push origin main${NC}"
echo -e "${YELLOW}  git push origin v$NEW_VERSION${NC}"
echo ""
echo "Luego en GitHub:"
echo "  1. Ve a Releases"
echo "  2. Draft New Release"
echo "  3. Tag: v$NEW_VERSION"
echo "  4. Release title: DataWell Pro v$NEW_VERSION"
echo "  5. Sube los archivos .exe de la carpeta 'release/'"
echo ""
echo -e "${GREEN}✓ Release preparado${NC}"
