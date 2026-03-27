import React, { useEffect, useState } from 'react';
import { X, Printer, CheckCircle, Store } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { QRCodeCanvas } from 'qrcode.react';

const BillModal = ({
    isOpen,
    onClose,
    items = [],
    total,
    subtotal,
    platformFee = 0,
    tax = 0,
    onPrint,
    customer,
    discount = 0,
    transactionId,
    billNumber,
    invoiceNumber,
    paymentMethod,
    voucher,
    transactionDate,
    transactionType = 'Sale'
}) => {
    const { settings, formatPrice } = useSettings();
    const [openedAt, setOpenedAt] = useState(() => new Date().toISOString());
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);
    useEffect(() => {
        if (isOpen) {
            setOpenedAt(new Date().toISOString());
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const normalizedItems = Array.isArray(items) ? items : [];
    const computedSubtotal = normalizedItems.reduce((sum, item) => {
        const qty = Number(item.quantity ?? item.billedQuantity ?? 0);
        const unitPrice = Number(item.price ?? item.unitPrice ?? 0);
        const lineSubtotal = Number(item.subtotal ?? item.netItemTotal ?? (qty * unitPrice));
        return sum + (Number.isFinite(lineSubtotal) ? lineSubtotal : 0);
    }, 0);

    const parsedSubtotal = Number(subtotal);
    const subtotalAmount = Number.isFinite(parsedSubtotal) ? parsedSubtotal : computedSubtotal;
    const platformFeeAmount = Number(platformFee) || 0;
    const taxAmount = Number(tax) || 0;
    const discountAmount = Number(discount) || 0;
    const totalAmount = Number(total) || 0;

    const isReturn = transactionType === 'Return' || totalAmount < 0;
    const date = new Date(transactionDate || openedAt).toLocaleString();

    const absoluteSubtotal = Math.abs(subtotalAmount);
    const absolutePlatformFee = Math.abs(platformFeeAmount);
    const absoluteTax = Math.abs(taxAmount);
    const absoluteDiscount = Math.abs(discountAmount);
    const absoluteTotal = Math.abs(totalAmount);
    const headerClass = isReturn ? 'bg-red-600' : 'bg-green-600';
    const headerHoverClass = isReturn ? 'hover:bg-red-700' : 'hover:bg-green-700';
    const actionClass = isReturn ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20' : 'bg-green-600 hover:bg-green-700 shadow-green-600/20';
    const modalTitle = isReturn ? 'Confirm Return' : 'Confirm Sale';
    const totalLabel = isReturn ? 'Total Refund' : 'Total';
    const printLabel = isReturn ? 'Print Voucher' : 'Print Receipt';

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[150] p-4 print:static print:bg-white print:p-0 print:block">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden print:overflow-visible print:shadow-none print:w-full print:max-w-none print:rounded-none">
                {/* Header */}
                <div className={`${headerClass} p-4 flex justify-between items-center text-white print:hidden`}>
                    <h2 className="font-bold text-lg flex items-center gap-2">
                        <CheckCircle size={20} />
                        {modalTitle}
                    </h2>
                    <button onClick={onClose} className={`${headerHoverClass} p-1 rounded-full transition-colors`}>
                        <X size={20} />
                    </button>
                </div>

                {/* Receipt Content */}
                <div className="p-6 print:p-0 max-h-[70vh] overflow-y-auto scrollbar-hide print:max-h-none print:overflow-visible" id="printable-receipt">
                    <div className="text-center mb-6">
                        {settings?.storeLogo ? (
                            <div className="flex justify-center mb-2">
                                <img src={settings.storeLogo} alt="Logo" className="h-16 w-auto object-contain" />
                            </div>
                        ) : (
                            <div className="flex justify-center mb-2 text-green-600 print:grayscale">
                                <Store size={32} />
                            </div>
                        )}
                        <h1 className="text-2xl font-bold text-gray-800 mb-1">{settings?.storeName || 'MedKit POS'}</h1>
                        <p className="text-sm text-gray-500 whitespace-pre-wrap">{settings?.storeAddress || 'Pharmacy Management System'}</p>
                        {settings?.storePhone && <p className="text-xs text-gray-500">Tel: {settings.storePhone}</p>}
                        {settings?.storeEmail && <p className="text-xs text-gray-500">Email: {settings.storeEmail}</p>}

                        <div className="border-b border-gray-200 w-full my-3"></div>

                        <p className="text-xs text-gray-400">{date}</p>
                        {billNumber ? (
                            <div className="mt-2">
                                <p className="text-xl font-bold text-gray-800">Bill #: {billNumber}</p>
                                {invoiceNumber && <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Invoice: {invoiceNumber}</p>}
                            </div>
                        ) : (
                            transactionId && (
                                <div className="mt-2">
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Draft Transaction</p>
                                    <p className="text-sm font-medium text-gray-500">{transactionId}</p>
                                </div>
                            )
                        )}
                    </div>

                    {/* Customer Info */}
                    {customer && (
                        <div className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50">
                            <h3 className="text-xs font-semibold text-gray-500 mb-2">CUSTOMER DETAILS</h3>
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-gray-800">{customer.name}</p>
                                <p className="text-xs text-gray-600">{customer.email}</p>
                                <p className="text-xs text-gray-600">{customer.phone}</p>
                            </div>
                        </div>
                    )}

                    <div className="border-t border-b border-dashed border-gray-300 py-4 mb-4 space-y-3">
                        {normalizedItems.map((item, index) => {
                            const quantity = Number(item.quantity ?? item.billedQuantity ?? 0);
                            const unitPrice = Number(item.price ?? item.unitPrice ?? 0);
                            const lineSubtotal = Number(item.subtotal ?? item.netItemTotal ?? (quantity * unitPrice));
                            const lineTotal = Number.isFinite(lineSubtotal) ? Math.abs(lineSubtotal) : 0;

                            return (
                            <div key={item.id || item.medicineId || `${item.name || 'item'}-${index}`} className="flex justify-between text-sm">
                                <div>
                                    <span className="font-medium text-gray-800">{item.name}</span>
                                    {Number(item.mrp) > 0 && (
                                        <div className="text-[10px] text-gray-400 line-through">MRP: Rs. {Number(item.mrp).toFixed(2)}</div>
                                    )}
                                    <div className="text-xs text-gray-500">
                                        {quantity} x Rs. {unitPrice.toFixed(2)}
                                    </div>
                                    {item.saleType && (
                                        <div className="text-[10px] text-gray-400">
                                            {item.saleType === 'Pack' ? 'Pack Sale' : 'Unit Sale'}
                                        </div>
                                    )}
                                </div>
                                <span className="font-medium text-gray-800">
                                    Rs. {lineTotal.toFixed(2)}
                                </span>
                            </div>
                        )})}
                    </div>

                    <div className="space-y-2 text-sm mb-6">
                        <div className="flex justify-between text-gray-600">
                            <span>Subtotal</span>
                            <span>{formatPrice(absoluteSubtotal)}</span>
                        </div>
                        {absoluteTax > 0 && (
                            <div className="flex justify-between text-gray-600">
                                <span>Tax</span>
                                <span>{formatPrice(absoluteTax)}</span>
                            </div>
                        )}
                        {absolutePlatformFee > 0 && (
                            <div className="flex justify-between text-gray-600">
                                <span>Platform Fee</span>
                                <span>{formatPrice(absolutePlatformFee)}</span>
                            </div>
                        )}
                        {absoluteDiscount > 0 && (
                            <div className="flex justify-between text-green-600">
                                <span>Discount {voucher ? `(${voucher.code})` : ''}</span>
                                <span>-{formatPrice(absoluteDiscount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between font-bold text-lg text-gray-900 pt-2 border-t border-gray-200">
                            <span>{totalLabel}</span>
                            <span>{formatPrice(absoluteTotal)}</span>
                        </div>

                        <div className="pt-4 mt-4 border-t border-dashed border-gray-300">
                            <div className="flex justify-between text-gray-800 text-sm font-medium">
                                <span>Payment Method</span>
                                <span>{paymentMethod || 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer for Print */}
                    <div className="hidden print:block text-center mt-8 space-y-2">
                        <div className="text-xs font-medium text-gray-800 border-t border-dashed border-gray-300 pt-2">
                            {settings?.receiptHeader}
                        </div>
                        {settings?.receiptFooter && (
                            <p className="text-xs text-gray-500 whitespace-pre-wrap">{settings.receiptFooter}</p>
                        )}
                        {settings?.receiptTerms && (
                            <div className="text-[10px] text-gray-400 mt-2 border-t border-gray-100 pt-1">
                                <span className="font-bold">Terms:</span> {settings.receiptTerms}
                            </div>
                        )}
                        <p className="text-[10px] text-gray-400 mt-2">Powered by MedKit POS</p>

                        {/* QR Code */}
                        {(settings?.showQRCode ?? true) && (
                            <div className="flex justify-center mt-4 pt-2 border-t border-dashed border-gray-200">
                                <QRCodeCanvas
                                    value={JSON.stringify({
                                        id: transactionId || billNumber,
                                        total: totalAmount,
                                        date: transactionDate || openedAt,
                                        type: transactionType
                                    })}
                                    size={64}
                                    level={"M"}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3 print:hidden">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onPrint}
                        className={`flex-1 px-4 py-2 text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2 shadow-lg ${actionClass}`}
                    >
                        <Printer size={18} />
                        {printLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BillModal;
