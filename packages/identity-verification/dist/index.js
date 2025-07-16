"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerificationErrorComponent = exports.VerificationSuccess = exports.VerificationStatusComponent = exports.VerificationForm = exports.VerificationMethodSelector = exports.IdentityVerification = void 0;
// Types
__exportStar(require("./types"), exports);
// Services
__exportStar(require("./services"), exports);
// Components - export specific items to avoid naming conflicts
var components_1 = require("./components");
Object.defineProperty(exports, "IdentityVerification", { enumerable: true, get: function () { return components_1.IdentityVerification; } });
Object.defineProperty(exports, "VerificationMethodSelector", { enumerable: true, get: function () { return components_1.VerificationMethodSelector; } });
Object.defineProperty(exports, "VerificationForm", { enumerable: true, get: function () { return components_1.VerificationForm; } });
Object.defineProperty(exports, "VerificationStatusComponent", { enumerable: true, get: function () { return components_1.VerificationStatus; } });
Object.defineProperty(exports, "VerificationSuccess", { enumerable: true, get: function () { return components_1.VerificationSuccess; } });
Object.defineProperty(exports, "VerificationErrorComponent", { enumerable: true, get: function () { return components_1.VerificationError; } });
// Hooks
__exportStar(require("./hooks"), exports);
// Utils
__exportStar(require("./utils"), exports);
//# sourceMappingURL=index.js.map