"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const trainerController_1 = require("../controllers/trainerController");
const router = express_1.default.Router();
router.get('/', trainerController_1.getTrainers);
router.get('/:id', trainerController_1.getTrainerById);
exports.default = router;
