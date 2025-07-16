/**
 * @repo/storage - 타입 정의
 * 스토리지 시스템 타입
 */
// ===== 스토리지 타입 =====
export var StorageType;
(function (StorageType) {
    StorageType["LOCAL"] = "local";
    StorageType["SESSION"] = "session";
    StorageType["INDEXED_DB"] = "indexedDB";
    StorageType["MEMORY"] = "memory";
    StorageType["COOKIE"] = "cookie";
    StorageType["CACHE"] = "cache";
})(StorageType || (StorageType = {}));
export var EvictionPolicy;
(function (EvictionPolicy) {
    EvictionPolicy["LRU"] = "lru";
    EvictionPolicy["LFU"] = "lfu";
    EvictionPolicy["FIFO"] = "fifo";
    EvictionPolicy["RANDOM"] = "random";
})(EvictionPolicy || (EvictionPolicy = {}));
export var StorageEventType;
(function (StorageEventType) {
    StorageEventType["SET"] = "set";
    StorageEventType["DELETE"] = "delete";
    StorageEventType["CLEAR"] = "clear";
    StorageEventType["EXPIRE"] = "expire";
})(StorageEventType || (StorageEventType = {}));
//# sourceMappingURL=index.js.map