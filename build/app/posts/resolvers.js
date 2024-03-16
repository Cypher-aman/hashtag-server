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
const scalars_1 = require("./scalars");
const post_1 = __importDefault(require("../../services/post"));
const user_1 = __importDefault(require("../../services/user"));
const extraTypes = {
    Date: scalars_1.dateScalar,
};
const query = {
    getAllPosts: (parent, { cursor }, ctx) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        if (!ctx.userSignature)
            return [];
        const userId = (_a = ctx.userSignature) === null || _a === void 0 ? void 0 : _a.id;
        return yield post_1.default.getAllPosts(userId, cursor);
    }),
    getUserPosts: (parent, { userName }, ctx) => __awaiter(void 0, void 0, void 0, function* () {
        var _b;
        if (!userName)
            return null;
        const userId = (_b = ctx.userSignature) === null || _b === void 0 ? void 0 : _b.id;
        return yield post_1.default.getUserPosts(userName, userId);
    }),
    getPresignerURL: (parent, { imageType, imageName }, ctx) => __awaiter(void 0, void 0, void 0, function* () {
        return yield post_1.default.getPresignerURL(imageType, imageName, ctx);
    }),
    getPresignerURLForSignUp: (parent, { imageType, imageName, email, }) => __awaiter(void 0, void 0, void 0, function* () {
        return yield post_1.default.getPresignerURLForSignUp(imageType, imageName, email);
    }),
    getRepliesToPost: (parent, { postId }, ctx) => __awaiter(void 0, void 0, void 0, function* () {
        var _c;
        const userId = (_c = ctx.userSignature) === null || _c === void 0 ? void 0 : _c.id;
        try {
            return yield post_1.default.getRepliesToPost(postId, userId);
        }
        catch (error) {
            throw new Error(error.message);
        }
    }),
    getPosts: (parent, { query }) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            return yield post_1.default.searchPosts(query);
        }
        catch (error) {
            throw new Error(error.message);
        }
    }),
};
const mutation = {
    createPost: (parent, { payload }, ctx) => __awaiter(void 0, void 0, void 0, function* () {
        return yield post_1.default.createPost(payload, ctx);
    }),
    likePost: (parent, { postId }, ctx) => __awaiter(void 0, void 0, void 0, function* () {
        var _d;
        try {
            const userId = (_d = ctx.userSignature) === null || _d === void 0 ? void 0 : _d.id;
            if (!userId)
                throw new Error('Unauthorized');
            return yield post_1.default.likePost(postId, userId);
        }
        catch (error) {
            return error.message;
        }
    }),
    unlikePost: (parent, { postId }, ctx) => __awaiter(void 0, void 0, void 0, function* () {
        var _e;
        try {
            const userId = (_e = ctx.userSignature) === null || _e === void 0 ? void 0 : _e.id;
            if (!userId)
                throw new Error('Unauthorized');
            return yield post_1.default.unlikePost(postId, userId);
        }
        catch (error) {
            return error.message;
        }
    }),
    createReply: (parent, { payload }, ctx) => __awaiter(void 0, void 0, void 0, function* () {
        var _f;
        try {
            const userId = (_f = ctx.userSignature) === null || _f === void 0 ? void 0 : _f.id;
            if (!userId)
                throw new Error('Unauthorized');
            yield post_1.default.createReply(payload, userId);
            return 'Reply created';
        }
        catch (error) {
            throw new Error(error.message);
        }
    }),
    bookmarkPost: (parent, { postId }, ctx) => __awaiter(void 0, void 0, void 0, function* () {
        var _g;
        try {
            const userId = (_g = ctx.userSignature) === null || _g === void 0 ? void 0 : _g.id;
            if (!userId)
                throw new Error('Unauthorized');
            return yield post_1.default.bookmarkPost(postId, userId);
        }
        catch (error) {
            return error.message;
        }
    }),
    unBookmarkPost: (parent, { postId }, ctx) => __awaiter(void 0, void 0, void 0, function* () {
        var _h;
        try {
            const userId = (_h = ctx.userSignature) === null || _h === void 0 ? void 0 : _h.id;
            if (!userId)
                throw new Error('Unauthorized');
            return yield post_1.default.unBookmarkPost(postId, userId);
        }
        catch (error) {
            return error.message;
        }
    }),
};
const extraResolvers = {
    Post: {
        author: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            return yield user_1.default.getUserById(parent.authorId);
        }),
    },
};
exports.resolvers = { mutation, query, extraResolvers, extraTypes };
