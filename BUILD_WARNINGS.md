# Build Warnings Notice

The application may show CommonJS/AMD warnings during build from the following dependencies:
- `jspdf` and `jspdf-autotable` - PDF export functionality
- `html2canvas` - Screenshot/canvas functionality  
- `canvg` - SVG rendering
- `dompurify` - HTML sanitization

These are **benign warnings** and do not affect the build output or application functionality. They occur because these libraries still use CommonJS/UMD format while Angular/esbuild prefer ESM modules.

## To eliminate these warnings completely, we would need to:
1. Replace jspdf with an ESM-based PDF library (e.g., pdfkit)
2. Replace html2canvas with an ESM alternative
3. Replace canvg with native browser capabilities or an ESM version

However, these dependencies provide critical functionality:
- **jspdf**: Generates PDF reports
- **html2canvas**: Converts HTML to images for reports
- **canvg**: SVG rendering for charts

The current setup provides stable, working functionality with these benign build warnings.

## Production Impact
Zero - these warnings only appear during the build process and do not affect:
- Application bundle size
- Runtime performance
- Feature functionality
- Production deployment
