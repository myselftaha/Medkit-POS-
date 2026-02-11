import React, { useEffect } from 'react';
import { X, Package, Boxes, Barcode, Calendar, Building2, DollarSign, FileText } from 'lucide-react';

const MedicineDetailsModal = ({ isOpen, onClose, medicineGroup, onEdit, onDelete, onSyncStock }) => {
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen || !medicineGroup) return null;

    // Get the first batch for detailed information
    const firstBatch = medicineGroup.batches[0] || {};

    // Calculate dates
    const expiryDate = firstBatch.expiryDate ? new Date(firstBatch.expiryDate) : null;
    const mfgDate = firstBatch.manufacturingDate ? new Date(firstBatch.manufacturingDate) : null;
    const createdDate = firstBatch.createdAt ? new Date(firstBatch.createdAt) : null;
    const now = new Date();
    const isExpired = expiryDate && expiryDate < now;
    const isExpiringSoon = expiryDate && !isExpired && expiryDate < new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Calculate pricing
    const costPrice = firstBatch.purchaseCost || 0;
    const salePrice = firstBatch.sellingPrice || 0;
    const mrp = firstBatch.mrp || 0;
    const discount = firstBatch.discountPercentage || 0;
    const gst = (firstBatch.cgstPercentage || 0) + (firstBatch.sgstPercentage || 0) + (firstBatch.igstPercentage || 0);
    const margin = salePrice - costPrice;
    const marginPercent = costPrice > 0 ? ((margin / costPrice) * 100).toFixed(2) : 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[95vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex-shrink-0 z-10">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                                <h2 className="text-2xl font-bold text-gray-900">{medicineGroup.name}</h2>
                                {isExpired && (
                                    <span className="px-3 py-1 bg-red-500 text-white text-xs font-medium rounded-full">
                                        Expired
                                    </span>
                                )}
                                {!isExpired && isExpiringSoon && (
                                    <span className="px-3 py-1 bg-orange-500 text-white text-xs font-medium rounded-full">
                                        Expiring Soon
                                    </span>
                                )}
                                <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                                    Rx Required
                                </span>
                            </div>
                            <p className="text-sm text-gray-500">{firstBatch.formula || firstBatch.description || 'Generic Medicine'}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X size={20} className="text-gray-500" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                    <div className="grid grid-cols-3 gap-4 mb-4">
                        {/* Product Information */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Package size={18} className="text-gray-600" />
                                <h3 className="font-semibold text-gray-900">Product Information</h3>
                            </div>
                            <div className="space-y-2.5">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Category:</span>
                                    <span className="text-sm font-medium text-gray-900">{firstBatch.category || medicineGroup.category || 'Tablets'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Type:</span>
                                    <span className="text-sm font-medium text-gray-900">Branded</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Pack Size:</span>
                                    <span className="text-sm font-medium text-gray-900">{firstBatch.netContent || firstBatch.packSize || '1'} per Strip</span>
                                </div>
                            </div>
                        </div>

                        {/* Stock Information */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Boxes size={18} className="text-gray-600" />
                                <h3 className="font-semibold text-gray-900">Stock Information</h3>
                            </div>
                            <div className="space-y-2.5">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Current Stock:</span>
                                    <span className="text-sm font-bold text-gray-900">{medicineGroup.totalStock} Strip</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Min Stock Level:</span>
                                    <span className="text-sm font-medium text-gray-900">{firstBatch.minStock || 40}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Rack Location:</span>
                                    <span className="text-sm font-medium text-gray-900">{firstBatch.shelfLocation || firstBatch.boxNumber || 'A-02-01'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Batch Details */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Barcode size={18} className="text-gray-600" />
                                <h3 className="font-semibold text-gray-900">Batch Details</h3>
                            </div>
                            <div className="space-y-2.5">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Barcode:</span>
                                    <span className="text-sm font-medium text-gray-900 font-mono">{firstBatch.barcode || '890123456789'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Batch No:</span>
                                    <span className="text-sm font-medium text-gray-900 font-mono">{firstBatch.batchNumber || 'N/A'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Dates */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Calendar size={18} className="text-gray-600" />
                                <h3 className="font-semibold text-gray-900">Dates</h3>
                            </div>
                            <div className="space-y-2.5">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Mfg Date:</span>
                                    <span className="text-sm font-medium text-gray-900">
                                        {mfgDate ? mfgDate.toLocaleDateString() : 'N/A'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Expiry Date:</span>
                                    <span className={`text-sm font-bold ${isExpired ? 'text-red-600' : isExpiringSoon ? 'text-orange-600' : 'text-gray-900'
                                        }`}>
                                        {expiryDate ? expiryDate.toLocaleDateString() : 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Source */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Building2 size={18} className="text-gray-600" />
                                <h3 className="font-semibold text-gray-900">Source</h3>
                            </div>
                            <div className="space-y-2.5">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Manufacturer:</span>
                                    <span className="text-sm font-medium text-gray-900">{firstBatch.supplierName || 'GSK Pakistan'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Supplier:</span>
                                    <span className="text-sm font-medium text-gray-900">{firstBatch.supplierName || 'National Pharma'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Pricing */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <DollarSign size={18} className="text-gray-600" />
                                <h3 className="font-semibold text-gray-900">Pricing</h3>
                            </div>
                            <div className="space-y-2.5">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Cost Price:</span>
                                    <span className="text-sm font-medium text-gray-900">Rs {costPrice.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Sale Price:</span>
                                    <span className="text-sm font-medium text-gray-900">Rs {salePrice.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">MRP:</span>
                                    <span className="text-sm font-medium text-gray-900">Rs {mrp.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Discount:</span>
                                    <span className="text-sm font-medium text-gray-900">{discount}%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">GST:</span>
                                    <span className="text-sm font-medium text-gray-900">{gst}%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Margin:</span>
                                    <span className="text-sm font-bold text-green-600">Rs {margin.toFixed(2)} ({marginPercent}%)</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <FileText size={18} className="text-gray-600" />
                            <h3 className="font-semibold text-gray-900">Notes</h3>
                        </div>
                        <p className="text-sm text-gray-700">
                            {firstBatch.notes || 'Antibiotic - requires prescription'}
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-100 px-6 py-4 bg-gray-50 text-xs text-gray-500 flex justify-between flex-shrink-0 rounded-b-2xl">
                    <span>Created: {createdDate ? createdDate.toLocaleString() : 'N/A'}</span>
                    <span>Last Updated: {createdDate ? createdDate.toLocaleString() : 'N/A'}</span>
                </div>
            </div>
        </div>
    );
};

export default MedicineDetailsModal;
