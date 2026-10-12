import React, { useState, useRef, useEffect, useMemo } from 'react';
import { FiChevronDown, FiSearch, FiX, FiPlus } from 'react-icons/fi'; // ✅ NEW: FiPlus

const SearchableSelect = ({
  label,
  name,
  value,
  onChange,
  options = [],
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  required = false,
  disabled = false,
  className = '',
  labelClass = 'block text-sm font-medium text-slate-700 mb-1.5',
  inputClass = 'w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors',
  allowClear = true,
  // ✅ NEW props
  allowAdd = false,
  onAddOption = null,
  addOptionLabel = 'Add',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const listRef = useRef(null);

  // Normalize options: accept array of strings or { value, label }
  const normalizedOptions = useMemo(
    () =>
      options.map((opt) =>
        typeof opt === 'string' ? { value: opt, label: opt } : opt
      ),
    [options]
  );

  // Filter options based on search term
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return normalizedOptions;
    const term = searchTerm.toLowerCase();
    return normalizedOptions.filter((opt) =>
      opt.label.toLowerCase().includes(term)
    );
  }, [normalizedOptions, searchTerm]);

  // ✅ NEW: Check if search term exactly matches an existing option
  const exactMatch = useMemo(() => {
    if (!searchTerm.trim()) return true; // hide "add" when empty
    const term = searchTerm.toLowerCase().trim();
    return normalizedOptions.some(
      (opt) => opt.label.toLowerCase() === term
    );
  }, [normalizedOptions, searchTerm]);

  // ✅ NEW: Should we show the "Add new" button?
  const canAddNew = allowAdd && searchTerm.trim() && !exactMatch;

  // ✅ NEW: Total navigable items (options + add button)
  const totalItems = filteredOptions.length + (canAddNew ? 1 : 0);

  // Get display label for current value
  const selectedLabel = useMemo(() => {
    const found = normalizedOptions.find((opt) => opt.value === value);
    return found ? found.label : '';
  }, [normalizedOptions, value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when opening
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
    setHighlightedIndex(0);
  }, [isOpen]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const item = listRef.current.children[highlightedIndex];
      if (item) {
        item.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleSelect = (option) => {
    onChange({
      target: {
        name,
        value: option.value,
      },
    });
    setIsOpen(false);
    setSearchTerm('');
  };

  // ✅ NEW: Handle adding a new option
  const handleAddNew = () => {
    const newValue = searchTerm.trim();
    if (!newValue) return;

    // Notify parent so it can persist / update its own state
    if (onAddOption) {
      onAddOption(newValue);
    }

    // Select the newly added value
    onChange({
      target: {
        name,
        value: newValue,
      },
    });

    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange({
      target: {
        name,
        value: '',
      },
    });
    setSearchTerm('');
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < totalItems - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        // If the "add new" row is highlighted, add it
        if (canAddNew && highlightedIndex === filteredOptions.length) {
          handleAddNew();
        } else if (filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex]);
        } else if (canAddNew && filteredOptions.length === 0) {
          // No options at all, but "add" is available
          handleAddNew();
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchTerm('');
        break;
      case 'Tab':
        setIsOpen(false);
        setSearchTerm('');
        break;
      default:
        break;
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && <label className={labelClass}>{label}</label>}

      <div
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        className={`${inputClass} flex items-center justify-between cursor-pointer ${
          disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''
        } ${isOpen ? 'ring-2 ring-blue-500/20 border-blue-500' : ''}`}
      >
        <span
          className={`truncate ${
            selectedLabel ? 'text-slate-800' : 'text-slate-400'
          }`}
        >
          {selectedLabel || placeholder}
        </span>

        <span className="flex items-center gap-1 ml-2 shrink-0">
          {allowClear && value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="text-slate-400 hover:text-slate-600 transition-colors"
              tabIndex={-1}
              aria-label="Clear selection"
            >
              <FiX size={14} />
            </button>
          )}
          <FiChevronDown
            size={16}
            className={`text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </span>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <FiSearch
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setHighlightedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder={searchPlaceholder}
                className="w-full pl-8 pr-2 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <ul
            ref={listRef}
            role="listbox"
            className="max-h-56 overflow-y-auto py-1"
          >
            {filteredOptions.length === 0 && !canAddNew ? (
              <li className="px-3 py-2 text-sm text-slate-400 text-center">
                No results found
              </li>
            ) : (
              <>
                {filteredOptions.map((option, index) => {
                  const isSelected = option.value === value;
                  const isHighlighted = index === highlightedIndex;
                  return (
                    <li
                      key={option.value}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelect(option)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                        isHighlighted ? 'bg-blue-50' : ''
                      } ${
                        isSelected
                          ? 'text-blue-600 font-medium'
                          : 'text-slate-700'
                      }`}
                    >
                      {option.label}
                    </li>
                  );
                })}

                {/* ✅ NEW: "Add new" row */}
                {canAddNew && (
                  <li
                    role="option"
                    aria-selected={false}
                    onClick={handleAddNew}
                    onMouseEnter={() =>
                      setHighlightedIndex(filteredOptions.length)
                    }
                    className={`px-3 py-2 text-sm cursor-pointer transition-colors flex items-center gap-2 text-blue-600 font-medium border-t border-slate-100 ${
                      highlightedIndex === filteredOptions.length
                        ? 'bg-blue-50'
                        : ''
                    }`}
                  >
                    <FiPlus size={14} />
                    <span className="truncate">
                      {addOptionLabel} "{searchTerm.trim()}"
                    </span>
                  </li>
                )}
              </>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;