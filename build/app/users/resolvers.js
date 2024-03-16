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
exports.resolvers = void 0;
const user_1 = __importDefault(require("../../services/user"));
const nodemailer_1 = __importDefault(require("../../services/nodemailer"));
const query = {
    verifyGoogleToken: (parent, { token }) => __awaiter(void 0, void 0, void 0, function* () {
        return yield user_1.default.verifyGoogleToken(token);
    }),
    getUserInfo: (parent, args, ctx) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const userId = (_a = ctx.userSignature) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId)
            return null;
        return yield user_1.default.getUserById(userId);
    }),
    getUserByName: (parent, { userName }) => __awaiter(void 0, void 0, void 0, function* () {
        return yield user_1.default.getUserByName(userName);
    }),
    getRecommendedUsers: (parent, args, ctx) => __awaiter(void 0, void 0, void 0, function* () {
        var _b;
        const userId = (_b = ctx.userSignature) === null || _b === void 0 ? void 0 : _b.id;
        if (!userId)
            return null;
        return yield user_1.default.getRecommendedUsers(userId);
    }),
    checkUserName: (parent, { userName }) => __awaiter(void 0, void 0, void 0, function* () {
        return yield user_1.default.checkUserName(userName);
    }),
    checkUserEmail: (parent, { email }) => __awaiter(void 0, void 0, void 0, function* () {
        return yield user_1.default.checkUserEmail(email);
    }),
    signInUser: (parent, { email, password }) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const token = yield user_1.default.signInUser(email, password);
            return token;
        }
        catch (error) {
            return new Error(error.message);
        }
    }),
    verifyOTP: (parent, { to, otp }) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            return yield nodemailer_1.default.verifyOTP(to, otp);
        }
        catch (error) {
            throw new Error(error.message);
        }
    }),
    searchUsers: (parent, { query }) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            return yield user_1.default.searchUsers(query);
        }
        catch (error) {
            throw new Error(error.message);
        }
    }),
    getNotifications: (parent, args, ctx) => __awaiter(void 0, void 0, void 0, function* () {
        var _c;
        const userId = (_c = ctx.userSignature) === null || _c === void 0 ? void 0 : _c.id;
        if (!userId)
            return null;
        return yield user_1.default.getAllNotifications(userId);
    }),
    getUserLikedPosts: (parent, { userId }, ctx) => __awaiter(void 0, void 0, void 0, function* () {
        var _d;
        try {
            if (!userId)
                throw new Error('User not found');
            const loggedInUserId = (_d = ctx.userSignature) === null || _d === void 0 ? void 0 : _d.id;
            return yield user_1.default.getUserLikedPosts(userId, loggedInUserId);
        }
        catch (error) {
            throw new Error(error.message);
        }
    }),
    getUserBookmarkedPosts: (parent, args, ctx) => __awaiter(void 0, void 0, void 0, function* () {
        var _e;
        const userId = (_e = ctx.userSignature) === null || _e === void 0 ? void 0 : _e.id;
        if (!userId)
            return null;
        return yield user_1.default.getUserBookmarkedPosts(userId);
    }),
    getUserPostsWithMedia: (parent, { userId }, ctx) => __awaiter(void 0, void 0, void 0, function* () {
        var _f;
        try {
            if (!userId)
                throw new Error('User not found');
            const loggedInUserId = (_f = ctx.userSignature) === null || _f === void 0 ? void 0 : _f.id;
            return yield user_1.default.getUserPostsWithMedia(userId, loggedInUserId);
        }
        catch (error) {
            throw new Error(error.message);
        }
    }),
};
const mutations = {
    followUser: (parent, { to }, ctx) => __awaiter(void 0, void 0, void 0, function* () {
        var _g;
        const currentUser = (_g = ctx.userSignature) === null || _g === void 0 ? void 0 : _g.id;
        if (!currentUser)
            throw new Error('Unauthenticated');
        if (currentUser === to)
            throw new Error('You can not follow your account');
        yield user_1.default.followUser(currentUser, to);
        return true;
    }),
    unfollowUser: (parent, { to }, ctx) => __awaiter(void 0, void 0, void 0, function* () {
        var _h;
        const currentUser = (_h = ctx.userSignature) === null || _h === void 0 ? void 0 : _h.id;
        if (!currentUser)
            throw new Error('Unauthenticated');
        yield user_1.default.unfollowUser(currentUser, to);
        return true;
    }),
    updateUserProfile: (parent, { payload }, ctx) => __awaiter(void 0, void 0, void 0, function* () {
        var _j;
        try {
            const userId = (_j = ctx.userSignature) === null || _j === void 0 ? void 0 : _j.id;
            if (!userId)
                throw new Error('Unauthenticated');
            yield user_1.default.updateUserProfile(userId, payload);
            return 'Profile updated successfully';
        }
        catch (error) {
            throw new Error(error.message);
        }
    }),
    createUser: (parent, { payload }) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            return yield user_1.default.createUser(payload);
        }
        catch (error) {
            const err = new Error(error.message);
            return false;
        }
    }),
    generateOTP: (parent, { to }, ctx) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield nodemailer_1.default.sendEmail(to);
            return 'ok';
        }
        catch (error) {
            throw new Error('Failed to generate OTP');
        }
    }),
};
const extraResolvers = {
    User: {
        follower: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            return yield user_1.default.getUserFollowers(parent.id);
        }),
        following: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            return yield user_1.default.getUserFollowings(parent.id);
        }),
    },
};
exports.resolvers = { query, mutations, extraResolvers };
