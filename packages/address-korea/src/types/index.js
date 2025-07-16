/**
 * Korean Address Types
 * 한국 주소 시스템 타입 정의
 */
// Export type guards
export const isRoadAddress = (address) => {
    return address && typeof address.roadAddress === 'string';
};
export const isJibunAddress = (address) => {
    return address && typeof address.jibunAddress === 'string';
};
export const isDetailedAddress = (address) => {
    return address &&
        typeof address.zonecode === 'string' &&
        typeof address.address === 'string';
};
//# sourceMappingURL=index.js.map