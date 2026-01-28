#!/usr/bin/env node
/**
 * Clean build script that filters out CommonJS warnings
 * These warnings are benign and come from dependencies like jspdf and canvg
 */

const { spawn } = require('child_process');
const readline = require('readline');

const buildProcess = spawn('npx', ['--yes', '@angular/cli@17', 'build', '--configuration', 'production'], {
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true
});

// Create readline interface for stdout
const stdoutInterface = readline.createInterface({
  input: buildProcess.stdout,
  output: process.stdout,
  terminal: false
});

// Create readline interface for stderr
const stderrInterface = readline.createInterface({
  input: buildProcess.stderr,
  output: process.stderr,
  terminal: false
});

// Filter and output stdout
stdoutInterface.on('line', (line) => {
  // Skip CommonJS/AMD optimization warning lines
  if (line.includes('[WARNING]') && (
    line.includes('CommonJS') ||
    line.includes('AMD') ||
    line.includes('canvg') ||
    line.includes('jspdf') ||
    line.includes('core-js') ||
    line.includes('html2canvas') ||
    line.includes('dompurify') ||
    line.includes('optimization bailouts') ||
    line.includes('raf') ||
    line.includes('rgbcolor')
  )) {
    return; // Skip this line
  }
  console.log(line);
});

// Output stderr as-is
stderrInterface.on('line', (line) => {
  console.error(line);
});

buildProcess.on('close', (code) => {
  process.exit(code);
});


