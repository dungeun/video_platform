/**
 * SearchBar Component
 * 검색바 컴포넌트
 */

import React from 'react';
import { SearchBarProps, SearchSuggestion } from '../types';
import { useSearchBar } from '../hooks/useSearchBar';
import { createSearchboxAria, createButtonAria } from '../utils/accessibility';

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Search...',
  value,
  onChange,
  onSearch,
  onFocus,
  onBlur,
  suggestions = [],
  loading = false,
  size = 'md',
  variant = 'default',
  showIcon = true,
  clearable = true,
  className = '',
  children,
  'data-testid': dataTestId = 'search-bar',
  ...props
}) => {
  const {
    query,
    isOpen,
    isFocused,
    isLoading,
    activeSuggestionIndex,
    filteredSuggestions,
    setIsLoading,
    handleSearch,
    handleSuggestionClick,
    clearSearch,
    inputProps
  } = useSearchBar({
    value,
    suggestions,
    onChange,
    onSearch,
    onFocus,
    onBlur
  });

  React.useEffect(() => {
    setIsLoading(loading);
  }, [loading, setIsLoading]);

  const searchboxAria = createSearchboxAria({
    label: placeholder,
    expanded: isOpen && filteredSuggestions.length > 0,
    controls: isOpen ? `${dataTestId}-suggestions` : undefined,
    activeDescendant: activeSuggestionIndex >= 0 
      ? `${dataTestId}-suggestion-${activeSuggestionIndex}` 
      : undefined
  });

  const searchButtonAria = createButtonAria({
    label: 'Search',
    disabled: !query.trim()
  });

  const clearButtonAria = createButtonAria({
    label: 'Clear search'
  });

  const handleSearchClick = () => {
    handleSearch();
  };

  const handleClearClick = () => {
    clearSearch();
  };

  return (
    <div
      className={`search-bar search-bar-${size} search-bar-${variant} ${isFocused ? 'focused' : ''} ${className}`}
      data-testid={dataTestId}
      {...props}
    >
      <div className="search-bar-container">
        {/* 검색 아이콘 */}
        {showIcon && (
          <div className="search-bar-icon">
            🔍
          </div>
        )}

        {/* 입력 필드 */}
        <input
          {...inputProps}
          className="search-bar-input"
          placeholder={placeholder}
          autoComplete="off"
          {...searchboxAria}
          data-testid={`${dataTestId}-input`}
        />

        {/* 로딩 인디케이터 */}
        {isLoading && (
          <div className="search-bar-loading" data-testid={`${dataTestId}-loading`}>
            <span className="search-bar-spinner">⟳</span>
          </div>
        )}

        {/* 초기화 버튼 */}
        {clearable && query && (
          <button
            className="search-bar-clear"
            onClick={handleClearClick}
            {...clearButtonAria}
            data-testid={`${dataTestId}-clear`}
          >
            ✕
          </button>
        )}

        {/* 검색 버튼 */}
        <button
          className="search-bar-submit"
          onClick={handleSearchClick}
          disabled={!query.trim()}
          {...searchButtonAria}
          data-testid={`${dataTestId}-submit`}
        >
          Search
        </button>
      </div>

      {/* 자동완성 제안사항 */}
      {isOpen && filteredSuggestions.length > 0 && (
        <div
          id={`${dataTestId}-suggestions`}
          className="search-bar-suggestions"
          role="listbox"
          data-testid={`${dataTestId}-suggestions`}
        >
          {filteredSuggestions.map((suggestion, index) => (
            <SearchSuggestionItem
              key={suggestion.id}
              suggestion={suggestion}
              isActive={index === activeSuggestionIndex}
              onClick={() => handleSuggestionClick(suggestion)}
              dataTestId={`${dataTestId}-suggestion-${index}`}
            />
          ))}
        </div>
      )}

      {/* 검색 결과 없음 메시지 */}
      {isOpen && query && filteredSuggestions.length === 0 && !isLoading && (
        <div
          className="search-bar-no-results"
          data-testid={`${dataTestId}-no-results`}
        >
          No results found for "{query}"
        </div>
      )}

      {children}
    </div>
  );
};

interface SearchSuggestionItemProps {
  suggestion: SearchSuggestion;
  isActive: boolean;
  onClick: () => void;
  dataTestId: string;
}

const SearchSuggestionItem: React.FC<SearchSuggestionItemProps> = ({
  suggestion,
  isActive,
  onClick,
  dataTestId
}) => {
  const handleClick = () => {
    onClick();
    
    if (suggestion.onClick) {
      suggestion.onClick();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      id={dataTestId}
      className={`search-suggestion ${isActive ? 'active' : ''}`}
      role="option"
      aria-selected={isActive}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      data-testid={dataTestId}
    >
      {suggestion.icon && (
        <span className="search-suggestion-icon">
          {suggestion.icon}
        </span>
      )}
      
      <div className="search-suggestion-content">
        <span className="search-suggestion-text">
          {suggestion.text}
        </span>
        
        {suggestion.category && (
          <span className="search-suggestion-category">
            in {suggestion.category}
          </span>
        )}
      </div>
    </div>
  );
};

export default SearchBar;