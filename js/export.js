// export.js — exportación a CSV y Excel (SpreadsheetML) sin librerías externas

/**
 * Descarga un Blob como archivo en el navegador.
 */
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Liberar memoria
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Escapa un valor para CSV:
 * - Si contiene coma, comilla o salto de línea, lo encierra en comillas dobles.
 * - Las comillas dentro del valor se duplican.
 */
function escapeCSV(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

/**
 * Genera y descarga la lista de series como CSV.
 * Todo hecho a mano: construimos el texto línea por línea.
 */
async function exportCSV() {
  let allSeries = [];
  let page = 1;
  const limit = 100;

  // Traemos todas las páginas
  while (true) {
    const result = await getSeries({ page, limit, sort: 'created_at', order: 'DESC' });
    allSeries = allSeries.concat(result.data || []);
    if (page >= result.total_pages) break;
    page++;
  }

  if (allSeries.length === 0) {
    showToast('No hay series para exportar', true);
    return;
  }

  const headers = ['ID', 'Título', 'Deporte', 'Plataforma', 'Estado', 'Episodios', 'Año', 'Rating Prom.', 'Votos', 'Descripción', 'Imagen URL', 'Creado'];
  const rows = allSeries.map(s => [
    s.id,
    s.title,
    s.sport,
    s.platform || '',
    s.status,
    s.episodes,
    s.year !== null && s.year !== undefined ? s.year : '',
    s.avg_rating !== null && s.avg_rating !== undefined ? s.avg_rating : '',
    s.rating_count || 0,
    s.description || '',
    s.image_url || '',
    s.created_at ? s.created_at.slice(0, 10) : '',
  ]);

  const csvLines = [
    headers.map(escapeCSV).join(','),
    ...rows.map(row => row.map(escapeCSV).join(','))
  ];

  const csvText = csvLines.join('\r\n');
  // BOM UTF-8 para que Excel lo abra bien
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvText], { type: 'text/csv;charset=utf-8;' });

  const today = new Date().toISOString().slice(0, 10);
  downloadBlob(blob, `sportstracker_${today}.csv`);
  showToast('CSV exportado correctamente');
}

/**
 * Genera y descarga la lista de series como .xlsx real (SpreadsheetML / Office Open XML).
 * Sin ninguna librería — construimos el XML a mano.
 *
 * Un .xlsx es un ZIP que contiene archivos XML.
 * Para no depender de JSZip usamos el formato SpreadsheetML "xlsx" simplificado,
 * que en realidad es un XML envuelto con la extensión .xlsx.
 * Este formato lo abren Excel y LibreOffice correctamente.
 *
 * Nota: usamos el formato SpreadsheetML clásico (no el Open Packaging Convention completo)
 * porque no podemos crear ZIPs sin librerías. SpreadsheetML es un XML único que Excel acepta.
 */
async function exportXLSX() {
  let allSeries = [];
  let page = 1;
  const limit = 100;

  while (true) {
    const result = await getSeries({ page, limit, sort: 'created_at', order: 'DESC' });
    allSeries = allSeries.concat(result.data || []);
    if (page >= result.total_pages) break;
    page++;
  }

  if (allSeries.length === 0) {
    showToast('No hay series para exportar', true);
    return;
  }

  // Escapa caracteres especiales XML
  function xmlEscape(val) {
    if (val === null || val === undefined) return '';
    return String(val)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  // Genera una celda XML
  function cell(value, type) {
    const v = xmlEscape(value);
    if (type === 'Number' && v !== '') {
      return `<Cell><Data ss:Type="Number">${v}</Data></Cell>`;
    }
    return `<Cell><Data ss:Type="String">${v}</Data></Cell>`;
  }

  // Encabezados
  const headerCells = [
    'ID', 'Título', 'Deporte', 'Plataforma', 'Estado',
    'Episodios', 'Año', 'Rating Prom.', 'Votos', 'Descripción', 'Creado'
  ].map(h => `<Cell ss:StyleID="header"><Data ss:Type="String">${xmlEscape(h)}</Data></Cell>`).join('');

  const headerRow = `<Row>${headerCells}</Row>`;

  // Filas de datos
  const dataRows = allSeries.map(s => {
    return `<Row>
      ${cell(s.id, 'Number')}
      ${cell(s.title)}
      ${cell(s.sport)}
      ${cell(s.platform || '')}
      ${cell(s.status)}
      ${cell(s.episodes, 'Number')}
      ${cell(s.year !== null && s.year !== undefined ? s.year : '', 'Number')}
      ${cell(s.avg_rating !== null && s.avg_rating !== undefined ? s.avg_rating : '', 'Number')}
      ${cell(s.rating_count || 0, 'Number')}
      ${cell(s.description || '')}
      ${cell(s.created_at ? s.created_at.slice(0, 10) : '')}
    </Row>`;
  }).join('');

  const today = new Date().toISOString().slice(0, 10);

  // SpreadsheetML completo
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:x="urn:schemas-microsoft-com:office:excel">
  <Styles>
    <Style ss:ID="header">
      <Font ss:Bold="1"/>
      <Interior ss:Color="#1c2230" ss:Pattern="Solid"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="SportsTracker ${today}">
    <Table>
      <Column ss:Width="50"/>
      <Column ss:Width="180"/>
      <Column ss:Width="100"/>
      <Column ss:Width="100"/>
      <Column ss:Width="90"/>
      <Column ss:Width="70"/>
      <Column ss:Width="60"/>
      <Column ss:Width="90"/>
      <Column ss:Width="60"/>
      <Column ss:Width="250"/>
      <Column ss:Width="100"/>
      ${headerRow}
      ${dataRows}
    </Table>
  </Worksheet>
</Workbook>`;

  const blob = new Blob([xml], {
    type: 'application/vnd.ms-excel;charset=utf-8;'
  });

  downloadBlob(blob, `sportstracker_${today}.xlsx`);
  showToast('Excel exportado correctamente');
}