import React, { useState } from 'react';
import { X, Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

const ExcelImportModal = ({ isOpen, onClose, onImport }) => {
    const [file, setFile] = useState(null);
    const [importing, setImporting] = useState(false);
    const [results, setResults] = useState(null);
    const [duplicateStrategy, setDuplicateStrategy] = useState('merge');
    const [createSupplies, setCreateSupplies] = useState(true);
    const [autoLinkSuppliers, setAutoLinkSuppliers] = useState(true);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls') && !selectedFile.name.endsWith('.csv')) {
                alert('Please select an Excel or CSV file (.xlsx, .xls, .csv)');
                return;
            }
            setFile(selectedFile);
            setResults(null);
        }
    };

    // Helper to parse dates (Excel serial or string)
    const parseDate = (dateValue) => {
        if (!dateValue) return null;

        // 1. Handle Excel Serial Date
        if (typeof dateValue === 'number') {
            const date = new Date(Math.round((dateValue - 25569) * 86400 * 1000));
            return !isNaN(date.getTime()) ? date : null;
        }

        // 2. Handle Strings
        if (typeof dateValue === 'string') {
            const trimmed = dateValue.trim();
            // Try ISO (YYYY-MM-DD)
            let date = new Date(trimmed);
            if (!isNaN(date.getTime())) return date;

            // Try DD/MM/YYYY or DD-MM-YYYY (Common in Pakistan)
            const parts = trimmed.split(/[-/]/);
            if (parts.length === 3) {
                // Assumption: if first part > 12, it's likely Day. Or if year is last.
                // Format: DD-MM-YYYY
                const d = parseInt(parts[0]);
                const m = parseInt(parts[1]) - 1; // Month is 0-indexed
                const y = parseInt(parts[2]);
                if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
                    date = new Date(y, m, d);
                    if (!isNaN(date.getTime())) return date;
                }
            }
        }
        return null;
    };

    const handleImport = async () => {
        if (!file) {
            alert('Please select a file first');
            return;
        }

        setImporting(true);
        setResults(null);

        try {
            const reader = new FileReader();

            reader.onload = async (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    const jsonData = XLSX.utils.sheet_to_json(firstSheet);

                    if (jsonData.length === 0) {
                        alert('Excel file is empty');
                        setImporting(false);
                        return;
                    }

                    // Pre-process data to fix dates
                    const processedData = jsonData.map(item => {
                        const newItem = { ...item };

                        // Normalize keys (handle case sensitivity)
                        Object.keys(newItem).forEach(key => {
                            const lowerKey = key.toLowerCase();
                            if (lowerKey.includes('expiry') || lowerKey.includes('date')) {
                                const dateVal = newItem[key];
                                const parsed = parseDate(dateVal);
                                if (parsed) {
                                    newItem[key] = parsed.toISOString();
                                }
                            }
                        });
                        return newItem;
                    });

                    // Call the parent import handler with options
                    const result = await onImport(processedData, {
                        duplicateStrategy,
                        createSupplies,
                        autoLinkSuppliers
                    });
                    setResults(result);

                } catch (error) {
                    console.error('Error parsing Excel:', error);
                    alert('Error reading Excel file: ' + error.message);
                } finally {
                    setImporting(false);
                }
            };

            reader.readAsArrayBuffer(file);
        } catch (error) {
            console.error('Error importing:', error);
            alert('Import failed: ' + error.message);
            setImporting(false);
        }
    };

    const downloadTemplate = () => {
        // Enhanced sample data for template with realistic pharmacy examples
        const templateData = [
            {
                name: 'Paracetamol 500mg',
                genericName: 'Paracetamol',
                description: 'Pain reliever and fever reducer',
                category: 'Pain Relief',
                sellingPrice: 10,
                costPrice: 7,
                mrp: 12,
                stock: 100,
                unit: 'Tablets',
                packSize: 10,
                minStock: 20,
                supplier: 'ABC Pharmaceuticals',
                batchNumber: 'PCM2024001',
                expiryDate: '2025-12-31',
                formulaCode: 'PCM500',
                shelfLocation: 'A-1-1',
                status: 'Active'
            },
            {
                name: 'Amoxicillin 250mg Capsules',
                genericName: 'Amoxicillin',
                description: 'Antibiotic for bacterial infections',
                category: 'Antibiotics',
                sellingPrice: 50,
                costPrice: 35,
                mrp: 60,
                stock: 50,
                unit: 'Capsules',
                packSize: 10,
                minStock: 15,
                supplier: 'XYZ Pharma',
                batchNumber: 'AMX2024002',
                expiryDate: '2026-06-30',
                formulaCode: 'AMX250',
                shelfLocation: 'B-2-1',
                status: 'Active'
            },
            {
                name: 'Omeprazole 20mg',
                genericName: 'Omeprazole',
                description: 'Proton pump inhibitor for acid reflux',
                category: 'Gastrointestinal',
                sellingPrice: 85,
                costPrice: 60,
                mrp: 95,
                stock: 75,
                unit: 'Capsules',
                packSize: 10,
                minStock: 20,
                supplier: 'MediPharma Ltd',
                batchNumber: 'OMP2024003',
                expiryDate: '2025-09-15',
                formulaCode: 'OMP20',
                shelfLocation: 'C-3-2',
                status: 'Active'
            },
            {
                name: 'Metformin 500mg',
                genericName: 'Metformin HCl',
                description: 'Anti-diabetic medication',
                category: 'Diabetes',
                sellingPrice: 35,
                costPrice: 25,
                mrp: 40,
                stock: 120,
                unit: 'Tablets',
                packSize: 10,
                minStock: 30,
                supplier: 'Global Pharma',
                batchNumber: 'MET2024004',
                expiryDate: '2026-03-20',
                formulaCode: 'MET500',
                shelfLocation: 'D-1-3',
                status: 'Active'
            }
        ];

        const ws = XLSX.utils.json_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Medicines');

        // Add instructions sheet
        const instructions = [
            ['Bulk Medicine Import Template - Instructions'],
            [],
            ['Column Name', 'Required', 'Data Type', 'Description', 'Example'],
            ['name', 'Yes', 'Text', 'Medicine name (must be unique)', 'Paracetamol 500mg'],
            ['genericName', 'No', 'Text', 'Generic/scientific name', 'Paracetamol'],
            ['description', 'No', 'Text', 'Brief description', 'Pain reliever and fever reducer'],
            ['category', 'No', 'Text', 'Medicine category', 'Pain Relief'],
            ['sellingPrice', 'Yes', 'Number', 'Retail price per unit (must be > 0)', '10.50'],
            ['costPrice', 'No', 'Number', 'Purchase cost per unit', '7.25'],
            ['mrp', 'No', 'Number', 'Maximum retail price', '12.00'],
            ['stock', 'No', 'Number', 'Quantity in stock (in packs)', '100'],
            ['unit', 'No', 'Text', 'Unit of measurement', 'Tablets/Capsules/Bottles'],
            ['packSize', 'No', 'Number', 'Items per pack', '10'],
            ['minStock', 'No', 'Number', 'Minimum stock alert level', '20'],
            ['supplier', 'No', 'Text', 'Supplier name (auto-linked if exists)', 'ABC Pharmaceuticals'],
            ['batchNumber', 'No', 'Text', 'Batch/Lot number', 'PCM2024001'],
            ['expiryDate', 'No', 'Date', 'Expiry date (YYYY-MM-DD)', '2025-12-31'],
            ['formulaCode', 'No', 'Text', 'Formula/SKU code', 'PCM500'],
            ['shelfLocation', 'No', 'Text', 'Storage location', 'A-1-1'],
            ['status', 'No', 'Text', 'Medicine status', 'Active/Inactive'],
            [],
            ['Important Notes:'],
            ['1. Required fields MUST be filled (name, sellingPrice)'],
            ['2. Duplicate medicines: Choose handling in import options (Skip/Update/Merge)'],
            ['3. Negative prices will be rejected'],
            ['4. Expired items will show warnings but still import'],
            ['5. If supplier name matches existing supplier, it will be auto-linked'],
            ['6. Stock is calculated as: stock × packSize'],
            ['7. Date format must be YYYY-MM-DD (e.g., 2025-12-31)'],
            ['8. For best results, fill all columns with accurate data'],
        ];

        const wsInstructions = XLSX.utils.aoa_to_sheet(instructions);

        // Set column widths for instructions
        wsInstructions['!cols'] = [
            { wch: 20 },  // Column name
            { wch: 12 },  // Required
            { wch: 15 },  // Data Type
            { wch: 45 },  // Description
            { wch: 30 }   // Example
        ];

        XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');

        // Set column widths for medicines sheet
        ws['!cols'] = [
            { wch: 30 }, // name
            { wch: 20 }, // genericName
            { wch: 40 }, // description
            { wch: 15 }, // category
            { wch: 12 }, // sellingPrice
            { wch: 12 }, // costPrice
            { wch: 10 }, // mrp
            { wch: 10 }, // stock
            { wch: 12 }, // unit
            { wch: 10 }, // packSize
            { wch: 10 }, // minStock
            { wch: 20 }, // supplier
            { wch: 18 }, // batchNumber
            { wch: 12 }, // expiryDate
            { wch: 15 }, // formulaCode
            { wch: 15 }, // shelfLocation
            { wch: 10 }  // status
        ];

        XLSX.writeFile(wb, 'medicines_import_template.xlsx');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                            <FileSpreadsheet className="text-green-600" size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">Import Medicines from Excel</h2>
                            <p className="text-sm text-gray-500">Upload an Excel file to add multiple medicines at once</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Template Download */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <Download className="text-blue-600 flex-shrink-0" size={20} />
                            <div className="flex-1">
                                <h3 className="font-semibold text-blue-900 text-sm mb-1">
                                    Download Template First
                                </h3>
                                <p className="text-xs text-blue-700 mb-3">
                                    Use our template to ensure your data is formatted correctly. It includes sample data and all required columns.
                                </p>
                                <button
                                    onClick={downloadTemplate}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                                >
                                    <Download size={16} />
                                    Download Template
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Import Options */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                        <h3 className="font-semibold text-gray-800 text-sm mb-2">Import Options</h3>

                        {/* Duplicate Handling */}
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-2">
                                If medicine already exists:
                            </label>
                            <select
                                value={duplicateStrategy}
                                onChange={(e) => setDuplicateStrategy(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                            >
                                <option value="skip">Skip (Don't import duplicates)</option>
                                <option value="update">Update (Replace existing data)</option>
                                <option value="merge">Merge (Add stock to existing)</option>
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                                {duplicateStrategy === 'skip' && 'Duplicate medicines will be skipped'}
                                {duplicateStrategy === 'update' && 'Existing data will be replaced with new data'}
                                {duplicateStrategy === 'merge' && 'Stock will be added to existing medicines'}
                            </p>
                        </div>

                        {/* Auto-create batches */}
                        <label className="flex items-start gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={createSupplies}
                                onChange={(e) => setCreateSupplies(e.target.checked)}
                                className="mt-0.5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                            />
                            <div>
                                <span className="text-sm text-gray-700 font-medium">Create inventory batches</span>
                                <p className="text-xs text-gray-500">Automatically create Supply records for batch tracking</p>
                            </div>
                        </label>

                        {/* Auto-link suppliers */}
                        <label className="flex items-start gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={autoLinkSuppliers}
                                onChange={(e) => setAutoLinkSuppliers(e.target.checked)}
                                className="mt-0.5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                            />
                            <div>
                                <span className="text-sm text-gray-700 font-medium">Auto-link suppliers</span>
                                <p className="text-xs text-gray-500">Match supplier names to your existing suppliers</p>
                            </div>
                        </label>
                    </div>

                    {/* File Upload */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Select Excel File
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-green-500 transition-colors">
                            <input
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                onChange={handleFileChange}
                                className="hidden"
                                id="excel-upload"
                            />
                            <label
                                htmlFor="excel-upload"
                                className="cursor-pointer flex flex-col items-center gap-3"
                            >
                                <Upload className="text-gray-400" size={40} />
                                {file ? (
                                    <div className="text-green-600 font-medium">{file.name}</div>
                                ) : (
                                    <>
                                        <div className="font-medium text-gray-700">
                                            Click to upload Excel or CSV file
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            Supports .xlsx, .xls, and .csv files
                                        </div>
                                    </>
                                )}
                            </label>
                        </div>
                    </div>

                    {/* Results */}
                    {results && (
                        <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                <CheckCircle className="text-green-600" size={20} />
                                Import Results
                            </h3>

                            <div className="grid grid-cols-4 gap-3">
                                <div className="text-center p-3 bg-gray-50 rounded-lg">
                                    <div className="text-2xl font-bold text-gray-800">{results.results.total}</div>
                                    <div className="text-xs text-gray-600">Total</div>
                                </div>
                                <div className="text-center p-3 bg-green-50 rounded-lg">
                                    <div className="text-2xl font-bold text-green-600">{results.results.successful}</div>
                                    <div className="text-xs text-green-700">Successful</div>
                                </div>
                                {results.results.skipped > 0 && (
                                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                                        <div className="text-2xl font-bold text-yellow-600">{results.results.skipped}</div>
                                        <div className="text-xs text-yellow-700">Skipped</div>
                                    </div>
                                )}
                                <div className="text-center p-3 bg-red-50 rounded-lg">
                                    <div className="text-2xl font-bold text-red-600">{results.results.failed}</div>
                                    <div className="text-xs text-red-700">Failed</div>
                                </div>
                            </div>

                            {results.results.errors.length > 0 && (
                                <div className="mt-4">
                                    <h4 className="font-medium text-red-700 text-sm mb-2 flex items-center gap-2">
                                        <AlertCircle size={16} />
                                        Errors ({results.results.errors.length})
                                    </h4>
                                    <div className="max-h-40 overflow-auto bg-red-50 rounded p-3 text-xs space-y-1">
                                        {results.results.errors.map((error, idx) => (
                                            <div key={idx} className="text-red-700">
                                                Row {error.row}: {error.name} - {error.error}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {results.results.warnings?.length > 0 && (
                                <div className="mt-3">
                                    <h4 className="font-medium text-yellow-700 text-sm mb-2 flex items-center gap-2">
                                        <AlertCircle size={16} />
                                        Warnings ({results.results.warnings.length})
                                    </h4>
                                    <div className="max-h-40 overflow-auto bg-yellow-50 border border-yellow-200 rounded p-3 text-xs space-y-1">
                                        {results.results.warnings.map((warning, idx) => (
                                            <div key={idx} className="text-yellow-800">
                                                Row {warning.row}: {warning.name} - {warning.message}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Close
                        </button>
                        <button
                            onClick={handleImport}
                            disabled={!file || importing}
                            className="px-6 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                            {importing ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Importing...
                                </>
                            ) : (
                                <>
                                    <Upload size={16} />
                                    Import Medicines
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExcelImportModal;
