"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./init-env");
const app_1 = __importDefault(require("./app"));
const http_1 = require("http");
const db_1 = require("./config/db");
const socket_1 = require("./socket");
// import { PrismaClient } from '@prisma/client';
const PORT = process.env.PORT || 3000;
const startServer = () => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, db_1.connectDB)();
    const httpServer = (0, http_1.createServer)(app_1.default);
    (0, socket_1.initSocket)(httpServer);
    httpServer.listen(Number(PORT), '0.0.0.0', () => {
        console.log(`Server is running on port ${PORT} and accessible on 0.0.0.0`);
    });
});
startServer();
