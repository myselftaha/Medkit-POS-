import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useToast } from '../context/ToastContext';
import { Search, Plus, Filter, Package, ChevronLeft, ChevronRight, Upload, LayoutGrid, LayoutList, Printer, Download, AlertCircle, Clock, XCircle, DollarSign, MoreVertical, Edit, Trash2, Eye, FileText, RefreshCw, ChevronDown } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import MedicineDetailsModal from '../components/supplies/MedicineDetailsModal';
import AddMedicineModal from '../components/supplies/AddMedicineModal';
import EditSupplyModal from '../components/supplies/EditSupplyModal';
import DeleteConfirmationModal from '../components/common/DeleteConfirmationModal';
import ExcelImportModal from '../components/medicines/ExcelImportModal';
import API_URL from '../config/api';
import FilterDropdown from '../components/common/FilterDropdown';

const Medicines = () => {
    const { showToast } = useToast();
    const location = useLocation();

    // State
    const [medicines, setMedicines] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [selectedMedicineGroup, setSelectedMedicineGroup] = useState(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedMedicine, setSelectedMedicine] = useState(null);
    const [medicineToDelete, setMedicineToDelete] = useState(null);
    const [preSelectedSupplier, setPreSelectedSupplier] = useState(null);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('table');
    const [openActionMenu, setOpenActionMenu] = useState(null);
    const [isPrintDropdownOpen, setIsPrintDropdownOpen] = useState(false);
    const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);

    // Stats State
    const [stats, setStats] = useState({
        totalMedicines: 0,
        lowStockCount: 0,
        expiringSoonCount: 0,
        outOfStockCount: 0,
        totalInventoryValue: 0,
        manufacturers: [],
        categories: []
    });

    // Filter State
    const [filters, setFilters] = useState({
        category: 'All Categories',
        manufacturer: 'All Manufacturers',
        stockLevel: 'All Stock',
        expiryStatus: 'All Expiry',
        prescription: 'All'
    });

    // Pagination State
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Fetch data on mount
    useEffect(() => {
        fetchStats();
        fetchMedicines(1);
        fetchSuppliers();

        if (location.state?.supplierId) {
            setPreSelectedSupplier({
                id: location.state.supplierId,
                name: location.state.supplierName
            });
            setIsAddModalOpen(true);
            window.history.replaceState({}, document.title);
        }

        if (location.state?.openAddSupply) {
            setIsAddModalOpen(true);
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    // Handle Search Debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Re-fetch on search change
    useEffect(() => {
        fetchMedicines(1);
    }, [debouncedSearch]);

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/supplies/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const fetchMedicines = useCallback(async (page = 1) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const params = new URLSearchParams({
                page,
                limit: pagination.limit,
                searchQuery: debouncedSearch
            });

            const response = await fetch(`${API_URL}/api/supplies?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setMedicines(data.data || []);
                setPagination(data.pagination || { page: 1, limit: 10, total: 0, pages: 1 });
            } else {
                showToast('Failed to fetch medicines', 'error');
            }
        } catch (error) {
            console.error('Error fetching medicines:', error);
            showToast('Error fetching medicines', 'error');
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, pagination.limit, showToast]);

    const CATEGORIES = ['All Categories', 'Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Ointment', 'Drops', 'Inhaler', 'Powder', 'Suspension', 'Gel', 'Suppository'];

    const uniqueSuppliers = useMemo(() => {
        const suppliersList = new Set();
        medicines.forEach(m => {
            if (m.supplierName) suppliersList.add(m.supplierName);
        });
        return ['All Manufacturers', ...Array.from(suppliersList).sort()];
    }, [medicines]);

    // Grouping Logic
    const groupedMedicines = useMemo(() => {
        const groups = {};
        const medicineIdsAddedPerGroup = {};

        medicines.forEach(m => {
            const nameKey = m.name?.trim().toLowerCase();
            if (!nameKey) return;

            if (!groups[nameKey]) {
                groups[nameKey] = {
                    name: m.name,
                    genericName: m.genericName || m.generic || '-',
                    totalStock: 0,
                    batches: [],
                    suppliers: new Set(),
                    category: m.category,
                    price: m.price || m.sellingPrice,
                    prescriptionRequired: m.prescriptionRequired
                };
                medicineIdsAddedPerGroup[nameKey] = new Set();
            }

            groups[nameKey].batches.push(m);

            if (m.medicineId && !medicineIdsAddedPerGroup[nameKey].has(m.medicineId.toString())) {
                groups[nameKey].totalStock += (Number(m.currentStock) || 0);
                medicineIdsAddedPerGroup[nameKey].add(m.medicineId.toString());
            } else if (!m.medicineId) {
                groups[nameKey].totalStock += (Number(m.currentStock) || 0);
            }

            if (m.supplierName) groups[nameKey].suppliers.add(m.supplierName);
        });

        let result = Object.values(groups).map(g => ({
            ...g,
            suppliers: Array.from(g.suppliers).join(', ')
        }));

        // Apply filters
        if (filters.category !== 'All Categories') {
            result = result.filter(m => m.category === filters.category);
        }
        if (filters.manufacturer !== 'All Manufacturers') {
            result = result.filter(m => m.suppliers.includes(filters.manufacturer));
        }
        if (filters.stockLevel !== 'All Stock') {
            if (filters.stockLevel === 'In Stock') {
                result = result.filter(m => m.totalStock > 10);
            } else if (filters.stockLevel === 'Low Stock') {
                result = result.filter(m => m.totalStock > 0 && m.totalStock <= 10);
            } else if (filters.stockLevel === 'Out of Stock') {
                result = result.filter(m => m.totalStock === 0);
            }
        }
        if (filters.expiryStatus !== 'All Expiry') {
            const today = new Date();
            const soon = new Date();
            soon.setDate(soon.getDate() + 30);

            result = result.filter(m => {
                const expiringSoon = m.batches.some(b => {
                    const expiryData = b.expiryDate ? new Date(b.expiryDate) : null;
                    return expiryData && expiryData > today && expiryData <= soon;
                });
                const expired = m.batches.some(b => {
                    const expiryData = b.expiryDate ? new Date(b.expiryDate) : null;
                    return expiryData && expiryData <= today;
                });

                if (filters.expiryStatus === 'Valid') return !expired && !expiringSoon;
                if (filters.expiryStatus === 'Expiring Soon') return expiringSoon;
                if (filters.expiryStatus === 'Expired') return expired;
                return true;
            });
        }
        if (filters.prescription !== 'All') {
            result = result.filter(m => {
                if (filters.prescription === 'Rx Required') return m.prescriptionRequired;
                if (filters.prescription === 'OTC') return !m.prescriptionRequired;
                return true;
            });
        }

        return result;
    }, [medicines, filters]);

    const fetchSuppliers = useCallback(async () => {
        try {
            const response = await fetch(`${API_URL}/api/suppliers`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            setSuppliers(data);
        } catch (error) {
            console.error('Error fetching suppliers:', error);
        }
    }, []);

    const handleSaveMedicine = async (medicineData) => {
        try {
            const response = await fetch(`${API_URL}/api/supplies`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(medicineData)
            });

            if (response.ok) {
                await fetchMedicines();
                await fetchStats();
                setIsAddModalOpen(false);
                setPreSelectedSupplier(null);
                showToast('Medicine added successfully!', 'success');
            } else {
                const errorData = await response.json();
                showToast(errorData.message || 'Failed to add medicine', 'error');
            }
        } catch (error) {
            console.error('Error saving medicine:', error);
            showToast('Error saving medicine', 'error');
        }
    };

    const handleEditMedicine = (medicine) => {
        setSelectedMedicine(medicine);
        setIsEditModalOpen(true);
    };

    const handleUpdateMedicine = async (updatedData) => {
        try {
            const response = await fetch(`${API_URL}/api/supplies/${selectedMedicine._id || selectedMedicine.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(updatedData)
            });

            if (response.ok) {
                await fetchMedicines();
                await fetchStats();
                setIsEditModalOpen(false);
                setSelectedMedicine(null);
                showToast('Medicine updated successfully!', 'success');
            } else {
                const errorData = await response.json();
                showToast(errorData.message || 'Failed to update medicine', 'error');
            }
        } catch (error) {
            console.error('Error updating medicine:', error);
            showToast('Error updating medicine', 'error');
        }
    };

    useEffect(() => {
        if (selectedMedicineGroup) {
            const updatedGroup = groupedMedicines.find(g => g.name === selectedMedicineGroup.name);
            if (updatedGroup) {
                setSelectedMedicineGroup(updatedGroup);
            }
        }
    }, [groupedMedicines]);

    const handleDeleteClick = (medicine) => {
        setMedicineToDelete(medicine);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!medicineToDelete) return;

        try {
            const medicineId = medicineToDelete._id || medicineToDelete.id;
            const response = await fetch(`${API_URL}/api/supplies/${medicineId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });

            if (response.ok) {
                await fetchMedicines();
                await fetchStats();
                setIsDeleteModalOpen(false);
                setMedicineToDelete(null);
                showToast('Medicine deleted successfully!', 'success');
            } else {
                const errorData = await response.json();
                showToast(errorData.message || 'Failed to delete medicine', 'error');
            }
        } catch (error) {
            console.error('Error deleting medicine:', error);
            showToast('Error deleting medicine', 'error');
        }
    };

    const handleSyncStock = async (medicineGroup, calculatedTotal) => {
        if (!medicineGroup || !medicineGroup.batches.length) return;

        const firstBatch = medicineGroup.batches[0];
        const medicineId = firstBatch.medicineId;

        if (!medicineId) {
            showToast('Cannot sync: Missing Medicine ID', 'error');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/medicines/${medicineId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ stock: calculatedTotal })
            });

            if (response.ok) {
                await fetchMedicines();
                await fetchStats();
                showToast('Stock synchronized successfully!', 'success');
            } else {
                const errorData = await response.json();
                showToast(errorData.message || 'Failed to sync stock', 'error');
            }
        } catch (error) {
            console.error('Error syncing stock:', error);
            showToast('Error syncing stock', 'error');
        }
    };

    const handleViewDetails = (group) => {
        setSelectedMedicineGroup(group);
        setIsDetailsModalOpen(true);
    };

    const handleExcelImport = async (excelData) => {
        try {
            const response = await fetch(`${API_URL}/api/medicines/bulk-import`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ medicines: excelData })
            });

            const result = await response.json();

            if (response.ok) {
                showToast(result.message, result.results.failed > 0 ? 'warning' : 'success');
                await fetchMedicines();
                await fetchStats();
                return result;
            } else {
                showToast(result.message || 'Import failed', 'error');
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Error importing medicines:', error);
            showToast('Error importing medicines', 'error');
            throw error;
        }
    };

    const resetFilters = () => {
        setFilters({
            category: 'All Categories',
            manufacturer: 'All Manufacturers',
            stockLevel: 'All Stock',
            expiryStatus: 'All Expiry',
            prescription: 'All'
        });
    };

    const handleExport = () => {
        // Export medicines data as CSV
        const csvData = groupedMedicines.map(m => ({
            Name: m.name,
            Category: m.category || 'N/A',
            Stock: m.totalStock,
            Price: `Rs. ${m.price || 0}`,
            Manufacturer: m.suppliers
        }));

        const csv = [
            ['Name', 'Category', 'Stock', 'Price', 'Manufacturer'],
            ...csvData.map(row => [row.Name, row.Category, row.Stock, row.Price, row.Manufacturer])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'medicines.csv';
        a.click();
        showToast('Medicines exported successfully!', 'success');
    };

    const handlePrint = () => {
        setIsPrintDropdownOpen(prev => !prev);
    };

    const handleDeleteAll = async () => {
        try {
            const response = await fetch(`${API_URL}/api/medicines/delete-all`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });

            if (response.ok) {
                const data = await response.json();
                await fetchMedicines();
                await fetchStats();
                setIsDeleteAllModalOpen(false);
                showToast(`Successfully deleted ${data.deletedCount} medicines`, 'success');
            } else {
                const errorData = await response.json();
                showToast(errorData.message || 'Failed to delete medicines', 'error');
            }
        } catch (error) {
            console.error('Error deleting all medicines:', error);
            showToast('Error deleting medicines', 'error');
        }
    };

    const handlePrintAll = () => {
        const printWindow = window.open('', '', 'height=600,width=800');
        const tableRows = groupedMedicines.map((medicine, index) => {
            const firstBatch = medicine.batches[0];
            const expiryDate = firstBatch?.expiryDate ? new Date(firstBatch.expiryDate).toISOString().split('T')[0] : 'N/A';
            return `
                <tr>
                    <td>${index + 1}</td>
                    <td>${medicine.name}</td>
                    <td>${medicine.genericName || '-'}</td>
                    <td>${medicine.category || '-'}</td>
                    <td>${medicine.totalStock}</td>
                    <td>${medicine.price}</td>
                    <td>${expiryDate}</td>
                    <td>Active</td>
                </tr>
            `;
        }).join('');

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Medicine Inventory List</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    h1 { margin-bottom: 20px; }
                    .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                    th { background-color: #f8f9fa; font-weight: 600; font-size: 14px; }
                    td { font-size: 14px; }
                    .footer { margin-top: 20px; text-align: right; font-size: 12px; color: #666; }
                     @media print {
                        .no-print { display: none; }
                        button { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Medicine Inventory List</h1>
                    <div style="font-size: 12px; color: #666;">Generated: ${new Date().toLocaleDateString()}</div>
                </div>
                <div style="margin-bottom: 20px;">
                    <strong>Total Medicines:</strong> ${groupedMedicines.length}
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Medicine Name</th>
                            <th>Generic Name</th>
                            <th>Category</th>
                            <th>Stock</th>
                            <th>Price (Rs.)</th>
                            <th>Expiry</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
                <script>
                    window.onload = function() { window.print(); }
                </script>
            </body>
            </html>
        `;
        printWindow.document.write(html);
        printWindow.document.close();
        setIsPrintDropdownOpen(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 px-6 py-4 flex-shrink-0">
                <div className="flex justify-between items-center">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#00c950] rounded-lg flex items-center justify-center">
                                <FileText className="text-white" size={20} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Medicine Management</h2>
                                <p className="text-sm text-gray-500">Pharmacy Inventory System</p>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-[#00c950] text-white rounded-lg font-medium hover:bg-[#00b347] transition-colors"
                    >
                        <Plus size={18} />
                        <span>Add Medicine</span>
                    </button>
                </div>
            </div>



            {/* Search, Filters, Actions Container */}
            <div className="bg-white flex-col flex-shrink-0 border border-gray-200 shadow-sm rounded-lg mx-6 mb-4">
                {/* Row 1: Search & View Toggle */}
                <div className="px-4 py-3 flex items-center justify-between gap-4 border-b border-gray-100">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name, generic, barcode..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-[#00c950]/10 focus:border-[#00c950] transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setViewMode('table')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'table' ? 'bg-white shadow-sm text-[#00c950]' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <LayoutList size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-[#00c950]' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <LayoutGrid size={18} />
                        </button>
                    </div>
                </div>

                {/* Row 2: Filters */}
                <div className="px-4 py-3 flex items-center gap-3 border-b border-gray-100 relative z-20">
                    <div className="flex items-center gap-2 text-gray-500 text-sm font-medium mr-2">
                        <Filter size={16} />
                        <span>Filters:</span>
                    </div>

                    <FilterDropdown
                        label="Category"
                        value={filters.category}
                        options={CATEGORIES}
                        onChange={(val) => setFilters({ ...filters, category: val })}
                    />

                    <FilterDropdown
                        label="Manufacturer"
                        value={filters.manufacturer}
                        options={uniqueSuppliers}
                        onChange={(val) => setFilters({ ...filters, manufacturer: val })}
                    />

                    <FilterDropdown
                        label="Stock Level"
                        value={filters.stockLevel}
                        options={['All Stock', 'In Stock', 'Low Stock', 'Out of Stock']}
                        onChange={(val) => setFilters({ ...filters, stockLevel: val })}
                    />

                    <FilterDropdown
                        label="Expiry Status"
                        value={filters.expiryStatus}
                        options={['All Expiry', 'Valid', 'Expiring Soon', 'Expired']}
                        onChange={(val) => setFilters({ ...filters, expiryStatus: val })}
                    />

                    <FilterDropdown
                        label="Prescription"
                        value={filters.prescription}
                        options={['All', 'Rx Required', 'OTC']}
                        onChange={(val) => setFilters({ ...filters, prescription: val })}
                    />

                    <button
                        onClick={resetFilters}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors ml-4"
                    >
                        <RefreshCw size={14} />
                        Reset
                    </button>
                </div>

                {/* Row 3: Results & Actions */}
                <div className="px-4 py-3 flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                        {groupedMedicines.length} medicines found
                    </p>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 border border-gray-200 rounded-md transition-colors bg-white"
                        >
                            <Download size={14} />
                            Export
                            <ChevronDown size={14} className="text-gray-400 ml-1" />
                        </button>

                        <div className="relative">
                            <button
                                onClick={handlePrint}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 border border-gray-200 rounded-md transition-colors bg-white"
                            >
                                <Printer size={14} />
                                Print
                                <ChevronDown size={14} className={`text-gray-400 ml-1 transition-transform ${isPrintDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isPrintDropdownOpen && (
                                <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 animate-in fade-in zoom-in-95 duration-200">
                                    <button
                                        onClick={handlePrintAll}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                    >
                                        <Printer size={14} />
                                        Print All
                                    </button>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => setIsDeleteAllModalOpen(true)}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 border border-red-200 rounded-md transition-colors bg-white"
                        >
                            <Trash2 size={14} />
                            Delete All
                        </button>
                    </div>
                </div>
            </div>

            {/* Table wrapper - removed overflow-auto to enable page-level scrolling */}
            <div className="bg-white mx-6 mb-6 rounded-lg border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead className="bg-[#f8fafc] border-b border-gray-100">
                        <tr>
                            <th className="px-5 py-4 text-left w-12">
                                <div className="flex items-center justify-center w-5 h-5 border border-gray-200 rounded hover:border-[#0F9D78]/50 transition-colors cursor-pointer bg-white group">
                                    {/* Custom Checkbox UI */}
                                </div>
                            </th>
                            <th className="px-4 py-4 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                <div className="flex items-center gap-1.5 cursor-pointer hover:text-slate-600 transition-colors">
                                    Medicine Name <ChevronDown size={12} className="text-slate-300" />
                                </div>
                            </th>
                            <th className="px-4 py-4 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                <div className="flex items-center gap-1.5 cursor-pointer hover:text-slate-600 transition-colors">
                                    Category <RefreshCw size={10} className="text-slate-300 rotate-90" />
                                </div>
                            </th>
                            <th className="px-4 py-4 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                <div className="flex items-center gap-1.5 cursor-pointer hover:text-slate-600 transition-colors">
                                    Manufacturer <RefreshCw size={10} className="text-slate-300 rotate-90" />
                                </div>
                            </th>
                            <th className="px-4 py-4 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                Batch No.
                            </th>
                            <th className="px-4 py-4 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                <div className="flex items-center gap-1.5 cursor-pointer hover:text-slate-600 transition-colors">
                                    Stock <RefreshCw size={10} className="text-slate-300 rotate-90" />
                                </div>
                            </th>
                            <th className="px-4 py-4 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                <div className="flex items-center gap-1.5 cursor-pointer hover:text-slate-600 transition-colors">
                                    Price <RefreshCw size={10} className="text-slate-300 rotate-90" />
                                </div>
                            </th>
                            <th className="px-4 py-4 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                <div className="flex items-center gap-1.5 cursor-pointer hover:text-slate-600 transition-colors">
                                    Expiry Date <RefreshCw size={10} className="text-slate-300 rotate-90" />
                                </div>
                            </th>
                            <th className="px-4 py-4 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-4 py-4 text-center text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr>
                                <td colSpan="10" className="px-4 py-12 text-center text-gray-500">
                                    Loading medicines...
                                </td>
                            </tr>
                        ) : groupedMedicines.length === 0 ? (
                            <tr>
                                <td colSpan="10" className="px-4 py-12 text-center text-gray-500">
                                    No medicines found
                                </td>
                            </tr>
                        ) : (
                            groupedMedicines.map((group, index) => {
                                const firstBatch = group.batches[0];
                                const expiryDate = firstBatch?.expiryDate ? new Date(firstBatch.expiryDate) : null;
                                const now = new Date();
                                const isExpired = expiryDate && expiryDate < now;
                                const isExpiringSoon = expiryDate && !isExpired && expiryDate < new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

                                return (
                                    <tr key={index} className="hover:bg-slate-50 transition-colors border-b border-gray-50/50">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-center w-5 h-5 border border-gray-200 rounded hover:border-[#00c950]/50 transition-colors cursor-pointer bg-white group">
                                                <div className="w-2.5 h-2.5 bg-[#00c950] rounded-sm opacity-0 group-hover:opacity-10 transition-opacity"></div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-semibold text-[14px] text-slate-700 mb-0.5">{group.name}</p>
                                                    {group.prescriptionRequired && (
                                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-500 border border-amber-100 uppercase tracking-tighter">
                                                            Rx
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[12px] text-slate-400 font-medium leading-tight">{group.genericName}</p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-[12px] font-medium border border-slate-100 bg-slate-50/50 text-slate-500">
                                                {group.category || 'Tablets'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-[13px] font-medium text-slate-500">{group.suppliers || 'N/A'}</td>
                                        <td className="px-4 py-4 text-[13px] font-medium text-slate-500 tracking-tight">{firstBatch?.batchNumber || 'N/A'}</td>
                                        <td className="px-4 py-4">
                                            <span className={`inline-flex items-center px-4 py-1 rounded-full text-[12px] font-bold ${group.totalStock === 0
                                                ? 'bg-rose-50 text-rose-500'
                                                : group.totalStock <= 10
                                                    ? 'bg-orange-50 text-orange-400'
                                                    : 'bg-[#00c950]/10 text-[#00c950]'
                                                }`}>
                                                {group.totalStock}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-[14px] font-bold text-slate-700">
                                            Rs. {group.price || 0}
                                        </td>
                                        <td className="px-4 py-4">
                                            {expiryDate ? (
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[12px] font-bold ${isExpired
                                                    ? 'bg-rose-50 text-rose-500'
                                                    : isExpiringSoon
                                                        ? 'bg-amber-50 text-amber-500'
                                                        : 'bg-[#00c950]/10 text-[#00c950]'
                                                    }`}>
                                                    {expiryDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </span>
                                            ) : (
                                                <span className="text-[12px] text-slate-300">N/A</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4">
                                            {group.prescriptionRequired ? (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 text-amber-500 border border-amber-100">
                                                    Rx Required
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-50 text-slate-400 border border-slate-100">
                                                    OTC
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="relative">
                                                <button
                                                    onClick={() => setOpenActionMenu(openActionMenu === index ? null : index)}
                                                    className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors group"
                                                >
                                                    <MoreVertical size={16} className="text-slate-400 group-hover:text-slate-600" />
                                                </button>

                                                {openActionMenu === index && (
                                                    <>
                                                        <div
                                                            className="fixed inset-0 z-10"
                                                            onClick={() => setOpenActionMenu(null)}
                                                        ></div>
                                                        <div className="absolute right-0 top-8 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                                                            <button
                                                                onClick={() => {
                                                                    handleViewDetails(group);
                                                                    setOpenActionMenu(null);
                                                                }}
                                                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                                                            >
                                                                <Eye size={16} className="text-gray-600" />
                                                                View Details
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    handleEditMedicine(firstBatch);
                                                                    setOpenActionMenu(null);
                                                                }}
                                                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                                                            >
                                                                <Edit size={16} className="text-gray-600" />
                                                                Edit
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setIsAddModalOpen(true);
                                                                    setOpenActionMenu(null);
                                                                }}
                                                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                                                            >
                                                                <Package size={16} className="text-gray-600" />
                                                                Add Stock
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    handleDeleteClick(firstBatch);
                                                                    setOpenActionMenu(null);
                                                                }}
                                                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
                                                            >
                                                                <Trash2 size={16} className="text-red-600" />
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 bg-white border-t border-gray-100 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Showing</span>
                    <select
                        value={pagination.limit}
                        onChange={(e) => setPagination({ ...pagination, limit: parseInt(e.target.value) })}
                        className="px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#00c950]/10 focus:border-[#00c950] transition-all"
                    >
                        <option value="10">10</option>
                        <option value="25">25</option>
                        <option value="50">50</option>
                    </select>
                    <span className="text-sm text-gray-600">of {groupedMedicines.length} medicines</span>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => fetchMedicines(pagination.page - 1)}
                        disabled={pagination.page <= 1}
                        className="p-2 border border-gray-200 rounded-lg hover:bg-[#00c950]/5 hover:border-[#00c950]/30 hover:text-[#00c950] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        <ChevronLeft size={18} />
                    </button>

                    <div className="flex items-center gap-1">
                        <span className="px-4 py-1.5 text-sm font-semibold bg-[#00c950] text-white rounded-lg shadow-sm">
                            {pagination.page}
                        </span>
                        <span className="text-sm text-gray-400 px-1">of</span>
                        <span className="px-3 py-1.5 text-sm font-medium text-gray-600">
                            {pagination.pages}
                        </span>
                    </div>

                    <button
                        onClick={() => fetchMedicines(pagination.page + 1)}
                        disabled={pagination.page >= pagination.pages}
                        className="p-2 border border-gray-200 rounded-lg hover:bg-[#00c950]/5 hover:border-[#00c950]/30 hover:text-[#00c950] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            {/* MODALS */}
            <MedicineDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                medicineGroup={selectedMedicineGroup}
                onEdit={handleEditMedicine}
                onDelete={handleDeleteClick}
                onSyncStock={handleSyncStock}
            />

            <AddMedicineModal
                isOpen={isAddModalOpen}
                onClose={() => {
                    setIsAddModalOpen(false);
                    setPreSelectedSupplier(null);
                }}
                onSave={handleSaveMedicine}
                suppliers={suppliers}
                initialSupplier={preSelectedSupplier}
            />

            <EditSupplyModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSave={handleUpdateMedicine}
                supply={selectedMedicine}
                suppliers={suppliers}
            />

            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                itemName={medicineToDelete?.name}
            />

            <ExcelImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImport={handleExcelImport}
            />

            {/* Delete All Confirmation Modal */}
            {isDeleteAllModalOpen && (
                <DeleteConfirmationModal
                    isOpen={isDeleteAllModalOpen}
                    onClose={() => setIsDeleteAllModalOpen(false)}
                    onConfirm={handleDeleteAll}
                    title="Delete All Medicines"
                    message="Are you sure you want to delete ALL medicines? This action cannot be undone and will permanently delete all medicine records from your inventory."
                />
            )}
        </div>
    );
};

export default Medicines;
