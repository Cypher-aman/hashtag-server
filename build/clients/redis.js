"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ioredis_1 = __importDefault(require("ioredis"));
const redisClient = new ioredis_1.default(`redis://default:${process.env.REDIS_CLIENT_PASS}@${process.env.REDIS_HOST}:44727`);
exports.default = redisClient;
