import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @repo/ui-forms - Select Component
 *
 * 선택 옵션을 위한 드롭다운 컴포넌트
 */
import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useFormClasses } from '../hooks';
import { getInputStyle } from '../utils';
/**
 * 선택 컴포넌트
 */
export const Select = forwardRef(({ name, value, defaultValue, placeholder, disabled = false, readOnly = false, required = false, size = 'medium', variant = 'default', className = '', style, options = [], multiple = false, searchable = false, clearable = false, loading = false, noOptionsMessage = 'No options available', loadingMessage = 'Loading...', maxMenuHeight = 200, onChange, onBlur, onFocus, 'data-testid': testId, ...props }, ref) => {
    const [focused, setFocused] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const selectRef = useRef(null);
    const searchInputRef = useRef(null);
    // ref 전달
    useImperativeHandle(ref, () => selectRef.current, []);
    // 에러 prop 추출
    const { error, ...restProps } = props;
    // 검증 상태 결정
    const validationState = error ? 'invalid' : undefined;
    // CSS 클래스 생성
    const classes = useFormClasses('select', {
        size,
        variant,
        validationState,
        disabled,
        readOnly,
        focused,
        className
    });
    // 옵션 필터링 (검색 가능한 경우)
    const filteredOptions = searchable && searchTerm
        ? options.filter(option => option.label.toLowerCase().includes(searchTerm.toLowerCase()))
        : options;
    // 그룹별 옵션 정리
    const groupedOptions = filteredOptions.reduce((groups, option) => {
        const group = option.group || 'default';
        if (!groups[group])
            groups[group] = [];
        groups[group].push(option);
        return groups;
    }, {});
    // 이벤트 핸들러
    const handleFocus = (event) => {
        setFocused(true);
        setIsOpen(true);
        onFocus?.(event);
    };
    const handleBlur = (event) => {
        setTimeout(() => {
            setFocused(false);
            setIsOpen(false);
            setSearchTerm('');
        }, 150); // 옵션 클릭을 위한 지연
        onBlur?.(event);
    };
    const handleChange = (event) => {
        onChange?.(event);
    };
    const handleClear = () => {
        if (selectRef.current) {
            const event = {
                target: { ...selectRef.current, value: '' }
            };
            onChange?.(event);
        }
    };
    // 검색 입력 핸들러
    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };
    // 클릭 외부 감지
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (selectRef.current && !selectRef.current.contains(event.target)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);
    // 기본 select (검색 불가능하고 단순한 경우)
    if (!searchable && !clearable) {
        return (_jsxs("select", { ref: selectRef, name: name, value: value, defaultValue: defaultValue, disabled: disabled, required: required, multiple: multiple, className: classes, style: {
                ...getInputStyle(size, variant, validationState, disabled, readOnly, focused),
                ...style
            }, onChange: handleChange, onFocus: handleFocus, onBlur: handleBlur, "data-testid": testId, ...restProps, children: [placeholder && (_jsx("option", { value: "", disabled: true, children: placeholder })), Object.entries(groupedOptions).map(([groupName, groupOptions]) => {
                    if (groupName === 'default') {
                        return groupOptions.map(option => (_jsx("option", { value: option.value, disabled: option.disabled, children: option.label }, option.value)));
                    }
                    return (_jsx("optgroup", { label: groupName, children: groupOptions.map(option => (_jsx("option", { value: option.value, disabled: option.disabled, children: option.label }, option.value))) }, groupName));
                })] }));
    }
    // 커스텀 select (검색 가능하거나 클리어 가능한 경우)
    const selectedOption = options.find(opt => opt.value === value);
    return (_jsxs("div", { className: `${classes} select-wrapper`, style: style, children: [_jsx("select", { ref: selectRef, name: name, value: value, defaultValue: defaultValue, multiple: multiple, style: { display: 'none' }, onChange: handleChange, tabIndex: -1, children: options.map(option => (_jsx("option", { value: option.value, children: option.label }, option.value))) }), _jsxs("div", { className: "select-control", onClick: () => !disabled && setIsOpen(!isOpen), children: [searchable && isOpen ? (_jsx("input", { ref: searchInputRef, type: "text", value: searchTerm, placeholder: placeholder, className: "select-search", onChange: handleSearchChange, autoFocus: true })) : (_jsx("span", { className: "select-value", children: selectedOption?.label || placeholder })), _jsxs("div", { className: "select-actions", children: [clearable && value && (_jsx("button", { type: "button", className: "select-clear", onClick: (e) => {
                                    e.stopPropagation();
                                    handleClear();
                                }, children: "\u00D7" })), _jsx("span", { className: `select-arrow ${isOpen ? 'select-arrow--open' : ''}`, children: "\u25BC" })] })] }), isOpen && (_jsx("div", { className: "select-menu", style: { maxHeight: maxMenuHeight }, children: loading ? (_jsx("div", { className: "select-loading", children: loadingMessage })) : filteredOptions.length === 0 ? (_jsx("div", { className: "select-no-options", children: noOptionsMessage })) : (Object.entries(groupedOptions).map(([groupName, groupOptions]) => (_jsxs("div", { children: [groupName !== 'default' && (_jsx("div", { className: "select-group-label", children: groupName })), groupOptions.map(option => (_jsx("div", { className: `select-option ${option.value === value ? 'select-option--selected' : ''} ${option.disabled ? 'select-option--disabled' : ''}`, onClick: () => {
                                if (!option.disabled && selectRef.current) {
                                    const event = {
                                        target: { ...selectRef.current, value: option.value }
                                    };
                                    onChange?.(event);
                                    setIsOpen(false);
                                    setSearchTerm('');
                                }
                            }, children: option.label }, option.value)))] }, groupName)))) }))] }));
});
//# sourceMappingURL=Select.js.map