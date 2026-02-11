import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const FilterDropdown = ({ label, value, options, onChange, icon: Icon, className = "" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSelect = (option) => {
        onChange(option);
        setIsOpen(false);
    };

    const displayValue = value === "All" || value.startsWith("All ") ? label : value;
    const isAllSelected = value === "All" || value.startsWith("All ");

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium border rounded-md transition-all whitespace-nowrap
                ${isOpen || !isAllSelected ? 'border-[#0F9D78] ring-1 ring-[#0F9D78]/20 bg-[#0F9D78]/5 text-[#0F9D78]' : 'border-gray-200 text-gray-700 hover:bg-gray-50 bg-white'}`}
            >
                {Icon && <Icon size={16} className={isOpen || !isAllSelected ? 'text-[#0F9D78]' : 'text-gray-500'} />}
                <span>{value}</span>
                <ChevronDown size={14} className={`ml-1 transition-transform ${isOpen ? 'rotate-180 text-[#0F9D78]' : 'text-gray-400'}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-1 min-w-[200px] w-max bg-white border border-gray-100 rounded-lg shadow-lg z-50 py-1 animate-in fade-in zoom-in-95 duration-200">
                    {options.map((option, index) => {
                        const isSelected = value === option;
                        return (
                            <button
                                key={index}
                                onClick={() => handleSelect(option)}
                                className={`w-full text-left px-3 py-2 text-sm flex items-center gap-3 transition-colors
                                ${isSelected ? 'bg-blue-50/50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                            >
                                <div className="w-4 flex items-center justify-center flex-shrink-0">
                                    {isSelected && <Check size={14} className="text-blue-600" />}
                                </div>
                                <span className="flex-1">{option}</span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default FilterDropdown;
