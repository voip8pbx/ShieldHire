"use strict";
// Deprecated: Prisma Client replaced by Supabase Client
// This file is kept for compatibility with existing imports, but logic is disabled.
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const connectDB = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('✅ App configured to use Supabase via REST API (Prisma Disabled)');
});
exports.connectDB = connectDB;
// Export a dummy object to prevent runtime crashes if some file still imports it
// (But it should fail visibly if used, so we can fix it)
const prisma = new Proxy({}, {
    get: (_target, prop) => {
        throw new Error(`Attempted to use Prisma.${String(prop)} but Prisma has been replaced by Supabase.`);
    }
});
exports.default = prisma;
