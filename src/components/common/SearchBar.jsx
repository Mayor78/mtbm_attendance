import React, { useState, useEffect, useRef } from 'react';
import Button from './Button';

const SearchBar = ({
  value = '',
  onChange,
  onSearch,
  placeholder = 'Search...',
  size = 'md',
  variant = 'default',
  showButton = false,
  buttonText = 'Search',
  buttonPosition = 'right',
  debounceTime = 300,
  suggestions = [],
  onSuggestionSelect,
  showFilters = false,
  filters = [],
  onFilterChange,
  className = '',
  autoFocus = false,
  disabled = false,
  loading = false
}) => {
  const [localValue, setLocalValue] = useState(value);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [recentSearches, setRecentSearches] = useState([]);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (onChange) {
        onChange(localValue);
      }
      if (onSearch && !debounceTime) {
        onSearch(localValue);
      }
    }, debounceTime);

    return () => clearTimeout(handler);
  }, [localValue, onChange, onSearch, debounceTime]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    setLocalValue(e.target.value);
    setShowSuggestions(true);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      if (onSearch) {
        onSearch(localValue);
      }
      setShowSuggestions(false);
      
      // Save to recent searches
      if (localValue.trim()) {
        setRecentSearches(prev => {
          const newSearches = [localValue, ...prev.filter(s => s !== localValue)].slice(0, 5);
          return newSearches;
        });
      }
    }
  };

  const handleClear = () => {
    setLocalValue('');
    if (onChange) {
      onChange('');
    }
    if (onSearch) {
      onSearch('');
    }
    inputRef.current?.focus();
  };

  const handleSuggestionClick = (suggestion) => {
    setLocalValue(suggestion);
    setShowSuggestions(false);
    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion);
    }
    if (onSearch) {
      onSearch(suggestion);
    }
  };

  const handleFilterClick = (filter) => {
    setSelectedFilter(filter.id);
    if (onFilterChange) {
      onFilterChange(filter);
    }
  };

  const sizeClasses = {
    sm: {
      input: 'py-1.5 text-sm',
      icon: 'text-sm',
      button: 'px-3 py-1.5 text-sm'
    },
    md: {
      input: 'py-2 text-base',
      icon: 'text-base',
      button: 'px-4 py-2 text-sm'
    },
    lg: {
      input: 'py-3 text-lg',
      icon: 'text-lg',
      button: 'px-6 py-3 text-base'
    }
  };

  const variantClasses = {
    default: 'border-gray-300 focus:ring-blue-500 focus:border-blue-500',
    filled: 'bg-gray-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-blue-500',
    outline: 'border-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500'
  };

  return (
    <div className={`relative ${className}`}>
      {/* Main Search Bar */}
      <div className="flex items-center gap-2">
        {/* Filter Button (if filters enabled) */}
        {showFilters && filters.length > 0 && (
          <div className="relative">
            <Button
              variant="secondary"
              size={size}
              icon="🔍"
              className="border-r-0 rounded-r-none"
            >
              Filters
            </Button>
            {selectedFilter && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 rounded-full text-xs text-white flex items-center justify-center">
                1
              </span>
            )}
          </div>
        )}

        {/* Search Input Container */}
        <div className="relative flex-1">
          {/* Search Icon */}
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {loading ? (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <span className={sizeClasses[size].icon}>🔍</span>
            )}
          </div>

          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            value={localValue}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            onFocus={() => setShowSuggestions(true)}
            placeholder={placeholder}
            disabled={disabled}
            autoFocus={autoFocus}
            className={`
              w-full pl-10 pr-10
              ${sizeClasses[size].input}
              ${variantClasses[variant]}
              border rounded-lg
              focus:outline-none focus:ring-2
              disabled:bg-gray-100 disabled:cursor-not-allowed
              transition-all duration-200
            `}
          />

          {/* Clear Button */}
          {localValue && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Search Button */}
        {showButton && (
          <Button
            variant="primary"
            size={size}
            onClick={() => onSearch && onSearch(localValue)}
            disabled={disabled || loading}
            icon={loading ? null : "🔍"}
            loading={loading}
          >
            {buttonText}
          </Button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && (suggestions.length > 0 || recentSearches.length > 0) && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto"
        >
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div className="p-2">
              <p className="text-xs font-semibold text-gray-400 px-2 py-1">Recent Searches</p>
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(search)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded flex items-center gap-2 text-sm text-gray-600"
                >
                  <span>🕒</span>
                  {search}
                </button>
              ))}
            </div>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="p-2">
              <p className="text-xs font-semibold text-gray-400 px-2 py-1">Suggestions</p>
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded flex items-center gap-2 text-sm text-gray-600"
                >
                  <span>🔍</span>
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Filters Panel */}
      {showFilters && filters.length > 0 && selectedFilter && (
        <div className="mt-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Active Filter:</span>
            <button
              onClick={() => {
                setSelectedFilter(null);
                if (onFilterChange) {
                  onFilterChange(null);
                }
              }}
              className="text-xs text-red-600 hover:text-red-700"
            >
              Clear
            </button>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">{selectedFilter}</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Search Bar with Categories
export const CategorySearchBar = ({
  categories = [],
  onCategoryChange,
  ...props
}) => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  return (
    <div className="space-y-2">
      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => {
            setSelectedCategory('all');
            onCategoryChange && onCategoryChange('all');
          }}
          className={`px-3 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition-colors ${
            selectedCategory === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        {categories.map((category, index) => (
          <button
            key={index}
            onClick={() => {
              setSelectedCategory(category.id);
              onCategoryChange && onCategoryChange(category.id);
            }}
            className={`px-3 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition-colors ${
              selectedCategory === category.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {category.icon && <span className="mr-1">{category.icon}</span>}
            {category.name}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <SearchBar {...props} />
    </div>
  );
};

// Advanced Search Bar with Filters
export const AdvancedSearchBar = ({
  onAdvancedSearch,
  filterOptions = [],
  ...props
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({});

  const handleFilterChange = (key, value) => {
    setAdvancedFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleApplyFilters = () => {
    if (onAdvancedSearch) {
      onAdvancedSearch(advancedFilters);
    }
    setShowAdvanced(false);
  };

  const handleClearFilters = () => {
    setAdvancedFilters({});
    if (onAdvancedSearch) {
      onAdvancedSearch({});
    }
  };

  return (
    <div className="space-y-2">
      {/* Main Search */}
      <div className="flex gap-2">
        <SearchBar {...props} />
        <Button
          variant="secondary"
          onClick={() => setShowAdvanced(!showAdvanced)}
          icon="⚙️"
        >
          Advanced
        </Button>
      </div>

      {/* Advanced Filters Panel */}
      {showAdvanced && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Advanced Filters</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filterOptions.map((filter, index) => (
              <div key={index}>
                <label className="block text-xs text-gray-500 mb-1">
                  {filter.label}
                </label>
                
                {filter.type === 'select' && (
                  <select
                    value={advancedFilters[filter.key] || ''}
                    onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="">Any</option>
                    {filter.options.map((opt, idx) => (
                      <option key={idx} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                )}

                {filter.type === 'date' && (
                  <input
                    type="date"
                    value={advancedFilters[filter.key] || ''}
                    onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                )}

                {filter.type === 'range' && (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={advancedFilters[`${filter.key}_min`] || ''}
                      onChange={(e) => handleFilterChange(`${filter.key}_min`, e.target.value)}
                      className="w-1/2 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={advancedFilters[`${filter.key}_max`] || ''}
                      onChange={(e) => handleFilterChange(`${filter.key}_max`, e.target.value)}
                      className="w-1/2 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="secondary" size="sm" onClick={handleClearFilters}>
              Clear All
            </Button>
            <Button variant="primary" size="sm" onClick={handleApplyFilters}>
              Apply Filters
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// Global Search Bar (for header)
export const GlobalSearchBar = ({ onSearch, className = '' }) => {
  return (
    <div className={`relative ${className}`}>
      <SearchBar
        placeholder="Search courses, students, sessions..."
        size="sm"
        variant="filled"
        debounceTime={500}
        onSearch={onSearch}
        suggestions={[
          'CS101 Introduction to Programming',
          'MATH202 Calculus II',
          'Dr. Sarah Smith',
          'John Doe STU2024001',
          'Attendance Report January'
        ]}
      />
    </div>
  );
};

// Usage Examples
export const SearchBarExamples = () => {
  const [searchResults, setSearchResults] = useState('');

  return (
    <div className="space-y-8 p-4">
      {/* Basic Search */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Basic Search</h3>
        <SearchBar
          placeholder="Search..."
          onSearch={(value) => setSearchResults(`Searching: ${value}`)}
        />
      </div>

      {/* Search with Button */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Search with Button</h3>
        <SearchBar
          placeholder="Search courses..."
          showButton={true}
          buttonText="Find"
          onSearch={(value) => setSearchResults(`Searching: ${value}`)}
        />
      </div>

      {/* Different Sizes */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Different Sizes</h3>
        <div className="space-y-2">
          <SearchBar size="sm" placeholder="Small search..." />
          <SearchBar size="md" placeholder="Medium search..." />
          <SearchBar size="lg" placeholder="Large search..." />
        </div>
      </div>

      {/* With Suggestions */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">With Suggestions</h3>
        <SearchBar
          placeholder="Type to see suggestions..."
          suggestions={[
            'CS101 - Programming',
            'MATH202 - Calculus',
            'PHY101 - Physics',
            'ENG205 - Literature'
          ]}
        />
      </div>

      {/* Category Search */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Category Search</h3>
        <CategorySearchBar
          placeholder="Search in category..."
          categories={[
            { id: 'courses', name: 'Courses', icon: '📚' },
            { id: 'students', name: 'Students', icon: '👥' },
            { id: 'lecturers', name: 'Lecturers', icon: '👩‍🏫' },
            { id: 'sessions', name: 'Sessions', icon: '📅' }
          ]}
          onCategoryChange={(cat) => setSearchResults(`Category: ${cat}`)}
        />
      </div>

      {/* Advanced Search */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Advanced Search</h3>
        <AdvancedSearchBar
          placeholder="Search with filters..."
          filterOptions={[
            {
              key: 'department',
              label: 'Department',
              type: 'select',
              options: [
                { value: 'cs', label: 'Computer Science' },
                { value: 'math', label: 'Mathematics' },
                { value: 'phy', label: 'Physics' }
              ]
            },
            {
              key: 'date',
              label: 'Date',
              type: 'date'
            },
            {
              key: 'attendance',
              label: 'Attendance Range',
              type: 'range'
            }
          ]}
          onAdvancedSearch={(filters) => setSearchResults(JSON.stringify(filters))}
        />
      </div>

      {/* Search Result Display */}
      {searchResults && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-600">{searchResults}</p>
        </div>
      )}
    </div>
  );
};

export default SearchBar;