import React, { useState, useEffect } from 'react';
import { X, Save, FileText, Package, DollarSign, Settings, Info, Percent } from 'lucide-react';

const EditSupplyModal = ({ isOpen, onClose, onSave, supply, suppliers = [] }) => {
    const [submitting, setSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState('basic');

    const [formData, setFormData] = useState({
        // Basic Info
        name: '',
        formulaCode: '',
        barcode: '',
        category: 'Tablets',
        type: 'Branded',
        supplierName: '',
        manufacturer: '',

        // Stock & Batch
        batchNumber: '',
        boxNumber: '',
        manufacturingDate: '',
        expiryDate: '',
        stock: '',
        unit: 'Strip',
        netContent: '10',
        minStock: '10',

        // Pricing
        purchaseCost: '',
        price: '',
        mrp: '',
        discountPercentage: '0',
        cgstPercentage: '0',
        taxableAmount: '0.00',

        // Other
        prescriptionRequired: false,
        status: 'Active',
        notes: '',

        // Hidden/Calculated
        description: '',
        freeQuantity: '0',
        sellPrice: '',
        itemAmount: '0.00',
        discountAmount: '0.00',
        sgstPercentage: '0',
        igstPercentage: '0',
        cgstAmount: '0.00',
        sgstAmount: '0.00',
        igstAmount: '0.00',
        totalGst: '0.00',
        payableAmount: '0.00',
        invoiceDate: '',
        purchaseInvoiceNumber: ''
    });

    const categories = ['Tablets', 'Capsules', 'Syrups', 'Injections', 'Ointments', 'Drops', 'Surgicals', 'Others'];
    const types = ['Branded', 'Generic', 'Surgical', 'Ayurvedic', 'Homeopathic'];
    const units = ['Strip', 'Box', 'Bottle', 'Vial', 'Piece', 'Tube', 'Pack'];

    useEffect(() => {
        if (isOpen && supply) {
            const data = {
                name: supply.name || '',
                formulaCode: supply.formula || supply.formulaCode || '',
                barcode: supply.barcode || '',
                category: supply.category || 'Tablets',
                type: supply.type || 'Branded',
                supplierName: supply.supplierName || '',
                manufacturer: supply.manufacturer || supply.description || '',

                batchNumber: supply.batchNumber || '',
                boxNumber: supply.boxNumber || '',
                manufacturingDate: supply.manufacturingDate ? new Date(supply.manufacturingDate).toISOString().split('T')[0] : '',
                expiryDate: supply.expiryDate ? new Date(supply.expiryDate).toISOString().split('T')[0] : '',
                stock: supply.quantity || supply.currentStock || '',
                unit: supply.unit || 'Strip',
                netContent: supply.netContent || '10',
                minStock: supply.minStock || '10',

                purchaseCost: supply.purchaseCost || '',
                price: supply.sellingPrice || supply.price || '',
                mrp: supply.mrp || '',
                discountPercentage: supply.discountPercentage || '0',
                cgstPercentage: supply.cgstPercentage || (parseFloat(supply.totalGstPercentage) || 0).toString() || '0',

                prescriptionRequired: supply.prescriptionRequired || false,
                status: supply.status || 'Active',
                notes: supply.notes || '',

                purchaseInvoiceNumber: supply.purchaseInvoiceNumber || '',
                invoiceDate: supply.addedDate ? new Date(supply.addedDate).toISOString().split('T')[0] : '',
                description: supply.description || '',
                freeQuantity: supply.freeQuantity || '0'
            };
            setFormData(calculateTotals(data));
        }
    }, [isOpen, supply]);

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen || !supply) return null;

    const calculateTotals = (data) => {
        const qty = parseFloat(data.stock) || 0;
        const cost = parseFloat(data.purchaseCost) || 0;
        const discPerc = parseFloat(data.discountPercentage) || 0;
        const gstPerc = parseFloat(data.cgstPercentage) || 0;

        const itemAmount = qty * cost;
        const discountAmount = itemAmount * (discPerc / 100);
        const taxableAmount = itemAmount - discountAmount;
        const totalGst = taxableAmount * (gstPerc / 100);
        const payableAmount = taxableAmount + totalGst;

        return {
            ...data,
            itemAmount: itemAmount.toFixed(2),
            discountAmount: discountAmount.toFixed(2),
            taxableAmount: taxableAmount.toFixed(2),
            totalGst: totalGst.toFixed(2),
            payableAmount: payableAmount.toFixed(2),
            sellPrice: data.price
        };
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const val = type === 'checkbox' ? checked : value;

        setFormData(prev => {
            const newData = { ...prev, [name]: val };
            const calculationFields = ['stock', 'purchaseCost', 'discountPercentage', 'cgstPercentage', 'price'];
            if (calculationFields.includes(name)) {
                return calculateTotals(newData);
            }
            return newData;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (submitting) return;

        try {
            setSubmitting(true);
            await onSave({
                ...formData,
                quantity: parseInt(formData.stock) || 0,
                price: parseFloat(formData.price) || 0,
                sellingPrice: parseFloat(formData.price) || 0,
                purchaseCost: parseFloat(formData.purchaseCost) || 0,
                packSize: parseInt(formData.netContent) || 1,
                minStock: parseInt(formData.minStock) || 10
            });
            onClose();
        } catch (error) {
            console.error('Error updating supply:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const margin = formData.price && formData.purchaseCost ? (parseFloat(formData.price) - parseFloat(formData.purchaseCost)).toFixed(2) : '0.00';
    const marginPercent = formData.price && formData.purchaseCost && parseFloat(formData.purchaseCost) > 0 ? ((parseFloat(margin) / parseFloat(formData.purchaseCost)) * 100).toFixed(2) : '0';

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">Edit Supply Record</h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-all">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-100 bg-gray-50/50 px-6 pt-2">
                    <div className="flex w-full bg-gray-100 rounded-t-lg overflow-hidden p-1 gap-1">
                        <button
                            type="button"
                            onClick={() => setActiveTab('basic')}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'basic' ? 'bg-white text-[#00c950] shadow-sm border-2 border-[#00c950]' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Basic Info
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('stock')}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'stock' ? 'bg-white text-[#00c950] shadow-sm border-2 border-[#00c950]' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Stock & Batch
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('pricing')}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'pricing' ? 'bg-white text-[#00c950] shadow-sm border-2 border-[#00c950]' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Pricing
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('other')}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'other' ? 'bg-white text-[#00c950] shadow-sm border-2 border-[#00c950]' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Other
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-6">

                    {/* Basic Info Tab */}
                    <div className={activeTab === 'basic' ? 'block' : 'hidden'}>
                        <div className="grid grid-cols-2 gap-6">
                            <FormInput
                                label="Medicine Name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                placeholder="e.g. Panadol Extra"
                            />
                            <FormInput
                                label="Generic Name"
                                name="formulaCode"
                                value={formData.formulaCode}
                                onChange={handleChange}
                                placeholder="e.g. Paracetamol"
                            />

                            <div className="col-span-2">
                                <FormInput
                                    label="Barcode"
                                    name="barcode"
                                    value={formData.barcode}
                                    onChange={handleChange}
                                    placeholder="Enter or scan barcode"
                                />
                            </div>

                            <FormSelect
                                label="Category"
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                required
                                options={categories}
                            />

                            <FormSelect
                                label="Type"
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                required
                                options={types}
                            />

                            <FormInput
                                label="Manufacturer"
                                name="manufacturer"
                                value={formData.manufacturer}
                                onChange={handleChange}
                                placeholder="e.g. GSK Pakistan"
                            />

                            <FormInput
                                label="Supplier"
                                name="supplierName"
                                value={formData.supplierName}
                                onChange={handleChange}
                                placeholder="e.g. National Pharma"
                                list="suppliers-list-edit"
                            />
                            <datalist id="suppliers-list-edit">
                                {suppliers.map((s, idx) => (
                                    <option key={idx} value={s.name || s} />
                                ))}
                            </datalist>
                        </div>
                    </div>

                    {/* Stock & Batch Tab */}
                    <div className={activeTab === 'stock' ? 'block' : 'hidden'}>
                        <div className="grid grid-cols-2 gap-6">
                            <FormInput
                                label="Batch Number"
                                name="batchNumber"
                                value={formData.batchNumber}
                                onChange={handleChange}
                                required
                            />
                            <FormInput
                                label="Rack Location"
                                name="boxNumber"
                                value={formData.boxNumber}
                                onChange={handleChange}
                            />

                            <FormInput
                                label="Manufacturing Date"
                                name="manufacturingDate"
                                value={formData.manufacturingDate}
                                onChange={handleChange}
                                type="date"
                            />
                            <FormInput
                                label="Expiry Date"
                                name="expiryDate"
                                value={formData.expiryDate}
                                onChange={handleChange}
                                type="date"
                                required
                            />

                            <FormInput
                                label="Quantity"
                                name="stock"
                                value={formData.stock}
                                onChange={handleChange}
                                type="number"
                                required
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <FormSelect
                                    label="Unit"
                                    name="unit"
                                    value={formData.unit}
                                    onChange={handleChange}
                                    required
                                    options={units}
                                />
                                <FormInput
                                    label="Pack Size"
                                    name="netContent"
                                    value={formData.netContent}
                                    onChange={handleChange}
                                    type="number"
                                />
                            </div>

                            <div className="col-span-2">
                                <FormInput
                                    label="Minimum Stock Level"
                                    name="minStock"
                                    value={formData.minStock}
                                    onChange={handleChange}
                                    type="number"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Pricing Tab */}
                    <div className={activeTab === 'pricing' ? 'block' : 'hidden'}>
                        <div className="grid grid-cols-3 gap-6 mb-6">
                            <FormInput
                                label="Cost Price (Rs)"
                                name="purchaseCost"
                                value={formData.purchaseCost}
                                onChange={handleChange}
                                type="number"
                                required
                            />
                            <FormInput
                                label="Sale Price (Rs)"
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                type="number"
                                required
                            />
                            <FormInput
                                label="MRP (Rs)"
                                name="mrp"
                                value={formData.mrp}
                                onChange={handleChange}
                                type="number"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6 mb-6">
                            <FormInput
                                label="Discount (%)"
                                name="discountPercentage"
                                value={formData.discountPercentage}
                                onChange={handleChange}
                                type="number"
                            />
                            <FormInput
                                label="GST (%)"
                                name="cgstPercentage"
                                value={formData.cgstPercentage}
                                onChange={handleChange}
                                type="number"
                            />
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
                            <div>
                                <p className="text-sm font-semibold text-gray-700">Price Summary</p>
                                <p className="text-sm text-gray-500 mt-1">Margin: Rs {margin}</p>
                            </div>
                            <p className="text-sm font-medium text-gray-700">Margin %: {marginPercent}%</p>
                        </div>
                    </div>

                    {/* Other Tab */}
                    <div className={activeTab === 'other' ? 'block' : 'hidden'}>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
                                <div>
                                    <p className="font-medium text-gray-900">Prescription Required</p>
                                    <p className="text-sm text-gray-500">Mark if this medicine requires a doctor's prescription</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="prescriptionRequired"
                                        checked={formData.prescriptionRequired}
                                        onChange={handleChange}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#00c950]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00c950]"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
                                <div>
                                    <p className="font-medium text-gray-900">Active Status</p>
                                    <p className="text-sm text-gray-500">Inactive medicines won't appear in sales</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="status"
                                        checked={formData.status === 'Active'}
                                        onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.checked ? 'Active' : 'Inactive' }))}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#00c950]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00c950]"></div>
                                </label>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-2">Notes</label>
                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleChange}
                                    placeholder="Add any additional notes about this medicine..."
                                    rows="4"
                                    className="w-full px-4 py-3 rounded-lg border border-gray-200 outline-none focus:border-[#00c950] focus:ring-4 focus:ring-[#00c950]/10 transition-all resize-none shadow-sm"
                                />
                            </div>
                        </div>
                    </div>

                </form>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 rounded-b-xl bg-gray-50/50">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-white hover:border-gray-300 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="px-5 py-2.5 rounded-lg bg-[#00c950] text-white font-medium hover:bg-[#00b347] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-[#00c950]/20"
                    >
                        {submitting ? 'Saving...' : 'Update Supply Record'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const FormInput = ({ label, name, value, onChange, type = "text", required = false, placeholder, list, readOnly = false }) => (
    <div className="space-y-1.5 w-full group">
        <label className="block text-sm font-medium text-gray-900">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            required={required}
            placeholder={placeholder}
            list={list}
            readOnly={readOnly}
            className={`w-full px-4 py-2.5 rounded-lg border border-gray-200 outline-none focus:border-[#00c950] focus:ring-4 focus:ring-[#00c950]/10 transition-all text-gray-900 ${readOnly ? 'bg-gray-50 cursor-not-allowed text-gray-500' : 'hover:border-gray-300'}`}
        />
    </div>
);

const FormSelect = ({ label, name, value, onChange, required = false, options = [] }) => (
    <div className="space-y-1.5 w-full">
        <label className="block text-sm font-medium text-gray-900">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
            <select
                name={name}
                value={value}
                onChange={onChange}
                required={required}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 outline-none focus:border-[#00c950] focus:ring-4 focus:ring-[#00c950]/10 transition-all text-gray-900 appearance-none bg-white hover:border-gray-300"
            >
                {options.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>
        </div>
    </div>
);

export default EditSupplyModal;
