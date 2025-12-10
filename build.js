#!/usr/bin/env node

/**
 * DataWell Import Pro - Build & Distribution Script
 * 
 * Este script automatiza el proceso de compilación y generación de ejecutables
 */

import { exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Error: ${error.message}`);
        reject(error);
      } else {
        console.log(stdout);
        resolve(stdout);
      }
    });
  });
}

async function main() {
  try {
    console.log('🚀 DataWell Import Pro - Build Script');
    console.log('=====================================\n');

    // Paso 1: Limpiar dist y release
    console.log('📦 Limpiando directorios anteriores...');
    try {
      await fs.rm(path.join(__dirname, 'dist'), { recursive: true, force: true });
      await fs.rm(path.join(__dirname, 'release'), { recursive: true, force: true });
      console.log('✅ Directorios limpios\n');
    } catch (e) {
      console.log('ℹ️ No hay directorios previos\n');
    }

    // Paso 2: Compilar TypeScript
    console.log('🔨 Compilando TypeScript...');
    await runCommand('npx tsc');
    console.log('✅ TypeScript compilado\n');

    // Paso 3: Build con Vite
    console.log('⚙️ Construyendo con Vite...');
    await runCommand('npx vite build');
    console.log('✅ Build completado\n');

    // Paso 4: Generar ejecutables
    console.log('📦 Generando ejecutables con electron-builder...');
    await runCommand('npx electron-builder');
    console.log('✅ Ejecutables generados\n');

    // Paso 5: Información final
    console.log('=====================================');
    console.log('✅ ¡Build completado con éxito!');
    console.log('=====================================\n');
    
    console.log('📁 Archivos generados en: ./release/\n');
    
    try {
      const releaseDir = path.join(__dirname, 'release');
      const files = await fs.readdir(releaseDir);
      const exeFiles = files.filter(f => f.endsWith('.exe'));
      
      console.log('📦 Ejecutables disponibles:');
      exeFiles.forEach(file => {
        console.log(`   • ${file}`);
      });
    } catch (e) {
      console.log('   (No se encontraron archivos)');
    }
    
    console.log('\n🚀 Para distribuir:');
    console.log('   1. Copia los archivos .exe de ./release/');
    console.log('   2. Distribuye a otros usuarios');
    console.log('   3. Ellos ejecutan y listo!\n');

  } catch (error) {
    console.error('❌ Build fallido:', error);
    process.exit(1);
  }
}

main();
