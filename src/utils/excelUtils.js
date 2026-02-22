const parseCsvLine = (line) => {
    const cells = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i += 1) {
        const char = line[i];

        if (char === '"') {
            const nextChar = line[i + 1];
            if (inQuotes && nextChar === '"') {
                current += '"';
                i += 1;
            } else {
                inQuotes = !inQuotes;
            }
            continue;
        }

        if (char === ',' && !inQuotes) {
            cells.push(current.trim());
            current = '';
            continue;
        }

        current += char;
    }

    cells.push(current.trim());
    return cells;
};

const escapeCsvValue = (value) => {
    if (value === null || value === undefined) return '';
    const stringValue = String(value);
    if (/[",\n]/.test(stringValue)) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
};

export const parseCsvToJson = (csvText) => {
    const lines = csvText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith('#'));

    if (lines.length === 0) return [];

    const headers = parseCsvLine(lines[0]);
    if (headers.every((header) => !header)) return [];

    const rows = [];
    for (let i = 1; i < lines.length; i += 1) {
        const rawValues = parseCsvLine(lines[i]);
        const row = {};
        let hasValue = false;

        headers.forEach((header, index) => {
            if (!header) return;
            const value = rawValues[index] ?? '';
            if (value !== '') hasValue = true;
            row[header] = value;
        });

        if (hasValue) rows.push(row);
    }

    return rows;
};

export const rowsToCsv = (rows, headers = []) => {
    const effectiveHeaders = headers.length > 0
        ? headers
        : (rows.length > 0 ? Object.keys(rows[0]) : []);

    const csvRows = [
        effectiveHeaders.map(escapeCsvValue).join(',')
    ];

    rows.forEach((row) => {
        const values = effectiveHeaders.map((header) => escapeCsvValue(row[header]));
        csvRows.push(values.join(','));
    });

    return csvRows.join('\n');
};

export const downloadCsv = (csvContent, fileName) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);
};

export const downloadRowsAsCsv = (rows, fileName, headers = []) => {
    const csv = rowsToCsv(rows, headers);
    downloadCsv(csv, fileName);
};
