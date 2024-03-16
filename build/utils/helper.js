"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRandomOTP = exports.verifyJWTUserToken = exports.generateJWTUserToken = exports.generateUniqueUserName = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const generateUniqueUserName = () => {
    const userName = Math.random().toString(36).slice(4);
    return userName;
};
exports.generateUniqueUserName = generateUniqueUserName;
const generateJWTUserToken = (user) => {
    const secretKey = 'secretKey@unique#';
    const token = jsonwebtoken_1.default.sign({ id: user.id, username: user.userName }, secretKey);
    return token;
};
exports.generateJWTUserToken = generateJWTUserToken;
const verifyJWTUserToken = (token) => {
    if (token === 'null' || !token)
        return null;
    const secretKey = 'secretKey@unique#';
    const decoded = jsonwebtoken_1.default.verify(token, secretKey);
    return decoded;
};
exports.verifyJWTUserToken = verifyJWTUserToken;
const generateRandomOTP = (max, min) => {
    return Math.floor(Math.random() * (max - min) + min);
};
exports.generateRandomOTP = generateRandomOTP;
