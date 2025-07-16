import { jsx as _jsx } from "react/jsx-runtime";
/**
 * @repo/ui-buttons - Button Group Component
 * 버튼 그룹 컴포넌트 (버튼들을 그룹화)
 */
import { Children, cloneElement, isValidElement } from 'react';
import { useButtonGroupClasses } from '../hooks/useButtonGroupClasses';
/**
 * 버튼 그룹 컴포넌트
 */
export const ButtonGroup = ({ size, variant, vertical = false, attached = true, spacing = 'none', className = '', children }) => {
    const groupClasses = useButtonGroupClasses({
        vertical,
        attached,
        spacing,
        className
    });
    const renderChildren = () => {
        return Children.map(children, (child, index) => {
            if (!isValidElement(child)) {
                return child;
            }
            // 버튼에 그룹 속성 전달
            const isFirst = index === 0;
            const isLast = index === Children.count(children) - 1;
            let groupSpecificClass = '';
            if (attached) {
                if (vertical) {
                    if (isFirst)
                        groupSpecificClass += ' rounded-b-none border-b-0';
                    if (isLast)
                        groupSpecificClass += ' rounded-t-none';
                    if (!isFirst && !isLast)
                        groupSpecificClass += ' rounded-none border-b-0';
                }
                else {
                    if (isFirst)
                        groupSpecificClass += ' rounded-r-none border-r-0';
                    if (isLast)
                        groupSpecificClass += ' rounded-l-none';
                    if (!isFirst && !isLast)
                        groupSpecificClass += ' rounded-none border-r-0';
                }
            }
            return cloneElement(child, {
                size: child.props.size || size,
                variant: child.props.variant || variant,
                className: `${child.props.className || ''} ${groupSpecificClass}`.trim()
            });
        });
    };
    return (_jsx("div", { className: groupClasses, role: "group", children: renderChildren() }));
};
ButtonGroup.displayName = 'ButtonGroup';
//# sourceMappingURL=ButtonGroup.js.map