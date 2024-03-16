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
const nodemailer_1 = __importDefault(require("nodemailer"));
const helper_1 = require("../utils/helper");
const redis_1 = __importDefault(require("../clients/redis"));
const transporter = nodemailer_1.default.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.APP_USER,
        pass: process.env.APP_PASSWORD,
    },
});
class NodemailerServices {
    static sendEmail(to) {
        return __awaiter(this, void 0, void 0, function* () {
            const randomOTP = (0, helper_1.generateRandomOTP)(10000, 1001);
            try {
                yield redis_1.default.setex(`SIGN_UP_OTP:${to}`, 60 * 10, JSON.stringify(randomOTP));
                yield transporter.sendMail({
                    from: {
                        name: 'Hashtag Team',
                        address: process.env.APP_USER,
                    },
                    to: to,
                    subject: 'OTP Verification',
                    text: `Your OTP is ${randomOTP}`,
                });
            }
            catch (error) {
                console.log(error.message);
                throw new Error(error.message);
            }
        });
    }
    static verifyOTP(to, otp) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const redisOTP = yield redis_1.default.get(`SIGN_UP_OTP:${to}`);
                const parsedRedisOTP = parseInt(redisOTP);
                if (parsedRedisOTP === otp) {
                    yield redis_1.default.del(`SIGN_UP_OTP:${to}`);
                    return true;
                }
                else {
                    return false;
                }
            }
            catch (error) {
                console.log(error.message);
                throw new Error(error.message);
            }
        });
    }
    static sendAccounCreationUpdateEmail(user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield transporter.sendMail({
                    from: {
                        name: 'Hashtag Team',
                        address: process.env.APP_USER,
                    },
                    to: process.env.APP_USER,
                    subject: 'New Account Created',
                    text: `A new account has been created for ${user.email}`,
                });
            }
            catch (error) {
                console.log(error);
            }
        });
    }
    static sendPostCreationUpdateEmail(post) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield transporter.sendMail({
                    from: {
                        name: 'Hashtag Team',
                        address: process.env.APP_USER,
                    },
                    to: process.env.APP_USER,
                    subject: 'New Post Created',
                    text: `A new post has been created - ${post === null || post === void 0 ? void 0 : post.content}`,
                });
            }
            catch (error) {
                console.log(error);
            }
        });
    }
}
exports.default = NodemailerServices;
