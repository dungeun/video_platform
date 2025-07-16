import React, { useState, useEffect, useCallback, useRef } from 'react';
import { debounce } from 'lodash';

export interface SearchBoxProps {
  onSearch: (query: string) => void;
  onSuggestionClick?: (suggestion: string) => void;
  suggestions?: string[];
  loading?: boolean;
  placeholder?: string;
  value?: string;
  debounceMs?: number;
  showSuggestions?: boolean;
  autoFocus?: boolean;
  className?: string;
  inputClassName?: string;
  suggestionsClassName?: string;
}

export const SearchBox: React.FC<SearchBoxProps> = ({
  onSearch,
  onSuggestionClick,
  suggestions = [],
  loading = false,
  placeholder = 'Search...',
  value = '',
  debounceMs = 300,
  showSuggestions = true,
  autoFocus = false,
  className = '',
  inputClassName = '',
  suggestionsClassName = ''
}) => {
  const [query, setQuery] = useState(value);
  const [showSuggestionList, setShowSuggestionList] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLUListElement>(null);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((searchQuery: string) => {
      onSearch(searchQuery);
    }, debounceMs),
    [onSearch, debounceMs]
  );

  // Update query when value prop changes
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Auto focus
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setSelectedSuggestionIndex(-1);
    
    if (newQuery.trim()) {
      debouncedSearch(newQuery);
      setShowSuggestionList(showSuggestions && suggestions.length > 0);
    } else {
      setShowSuggestionList(false);
    }
  };

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSuggestionIndex >= 0 && suggestions[selectedSuggestionIndex]) {
      handleSuggestionClick(suggestions[selectedSuggestionIndex]);
    } else if (query.trim()) {
      onSearch(query);
      setShowSuggestionList(false);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestionList(false);
    setSelectedSuggestionIndex(-1);
    onSuggestionClick?.(suggestion);
    onSearch(suggestion);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestionList) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Escape':
        setShowSuggestionList(false);
        setSelectedSuggestionIndex(-1);
        inputRef.current?.blur();
        break;
      case 'Tab':
        if (selectedSuggestionIndex >= 0) {
          e.preventDefault();
          handleSuggestionClick(suggestions[selectedSuggestionIndex]);
        }
        break;
    }
  };

  // Handle input focus
  const handleFocus = () => {
    if (showSuggestions && suggestions.length > 0 && query.trim()) {
      setShowSuggestionList(true);
    }
  };

  // Handle input blur
  const handleBlur = () => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => {
      setShowSuggestionList(false);
      setSelectedSuggestionIndex(-1);
    }, 200);
  };

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${inputClassName}`}
          disabled={loading}
        />
        
        {/* Loading spinner */}
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Search button */}
        <button
          type="submit"
          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
          disabled={loading}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </form>

      {/* Suggestions dropdown */}
      {showSuggestionList && suggestions.length > 0 && (
        <ul
          ref={suggestionsRef}
          className={`absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto ${suggestionsClassName}`}
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={index}
              className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${
                index === selectedSuggestionIndex ? 'bg-blue-100' : ''
              }`}
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};