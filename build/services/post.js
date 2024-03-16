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
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const db_1 = require("../clients/db");
const client_1 = require("@prisma/client");
const redis_1 = __importDefault(require("../clients/redis"));
const constant_1 = require("../utils/constant");
const nodemailer_1 = __importDefault(require("./nodemailer"));
const s3CLient = new client_s3_1.S3Client({
    region: 'ap-south-1',
    credentials: {
        accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY,
    },
});
class PostService {
    static getAllPosts(userId, cursor = '') {
        return __awaiter(this, void 0, void 0, function* () {
            const cursorObj = cursor ? { id: cursor } : undefined;
            const posts = yield db_1.db.post.findMany({
                take: constant_1.POST_PER_PAGE,
                cursor: cursorObj,
                skip: cursor ? 1 : 0,
                where: {
                    parent: null,
                },
                include: {
                    likes: true,
                    bookmarks: true,
                    replies: {
                        select: {
                            id: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });
            if (!userId) {
                return posts;
            }
            const postsWithInfo = posts.map((post) => {
                const isLiked = post.likes.some((like) => like.userId === userId);
                const isBookmarked = post.bookmarks.some((bookmark) => bookmark.userId === userId);
                return Object.assign(Object.assign({}, post), { isLiked,
                    isBookmarked, bookmarkCount: post.bookmarks.length, likeCount: post.likes.length });
            });
            return {
                posts: postsWithInfo,
                nextId: posts.length === constant_1.POST_PER_PAGE ? posts[posts.length - 1].id : undefined,
            };
        });
    }
    static getUserPosts(userName, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!userName) {
                return null;
            }
            const posts = yield db_1.db.post.findMany({
                where: {
                    author: {
                        userName,
                    },
                    parent: null,
                },
                include: {
                    likes: true,
                    bookmarks: true,
                    replies: {
                        select: {
                            id: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });
            const postsWithInfo = posts.map((post) => {
                const isLiked = post.likes.some((like) => like.userId === userId);
                const isBookmarked = post.bookmarks.some((bookmark) => bookmark.userId === userId);
                return Object.assign(Object.assign({}, post), { isLiked,
                    isBookmarked, bookmarkCount: post.bookmarks.length, likeCount: post.likes.length });
            });
            return postsWithInfo;
        });
    }
    static getPresignerURL(imageType, imageName, ctx) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!ctx.userSignature || !ctx.userSignature.id)
                throw new Error('Unauthorized');
            const supportedTypes = [
                'image/png',
                'image/jpeg',
                'image/jpg',
                'image/webp',
            ];
            if (!supportedTypes.includes(imageType))
                throw new Error('Unsupported image type');
            const putObjectCommand = new client_s3_1.PutObjectCommand({
                Bucket: process.env.MY_AWS_BUCKET_NAME,
                ContentType: imageType,
                Key: `uploads/posts/${ctx.userSignature.id}/${Date.now()}-${imageName}`,
            });
            const presignerURL = yield (0, s3_request_presigner_1.getSignedUrl)(s3CLient, putObjectCommand);
            return presignerURL;
        });
    }
    static getPresignerURLForSignUp(imageType, imageName, email) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!email)
                throw new Error('Unauthorized');
            const supportedTypes = [
                'image/png',
                'image/jpeg',
                'image/jpg',
                'image/webp',
            ];
            if (!supportedTypes.includes(imageType))
                throw new Error('Unsupported image type');
            const putObjectCommand = new client_s3_1.PutObjectCommand({
                Bucket: process.env.AWS_BUCKET_NAME,
                ContentType: imageType,
                Key: `uploads/users/email/${email}/${Date.now()}-${imageName}`,
            });
            const presignerURL = yield (0, s3_request_presigner_1.getSignedUrl)(s3CLient, putObjectCommand);
            return presignerURL;
        });
    }
    static createPost(payload, ctx) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const authorId = (_a = ctx.userSignature) === null || _a === void 0 ? void 0 : _a.id;
            if (!authorId) {
                return 'Unauthorized';
            }
            const post = yield db_1.db.post.create({
                data: {
                    content: payload.content,
                    imageUrl: payload.imageUrl,
                    author: {
                        connect: {
                            id: authorId,
                        },
                    },
                },
            });
            yield nodemailer_1.default.sendPostCreationUpdateEmail(post);
            return post;
        });
    }
    static likePost(postId, userId) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const checkLiked = yield db_1.db.like.findUnique({
                    where: {
                        postId_userId: {
                            postId,
                            userId,
                        },
                    },
                });
                if (checkLiked) {
                    throw new Error('Already liked');
                }
                yield db_1.db.like.create({
                    data: {
                        post: {
                            connect: {
                                id: postId,
                            },
                        },
                        user: {
                            connect: {
                                id: userId,
                            },
                        },
                    },
                });
                const post = yield db_1.db.post.findUnique({
                    where: {
                        id: postId,
                    },
                    include: {
                        author: {
                            select: {
                                id: true,
                            },
                        },
                    },
                });
                if (userId === ((_a = post === null || post === void 0 ? void 0 : post.author) === null || _a === void 0 ? void 0 : _a.id))
                    return 'Liked';
                yield db_1.db.notification.create({
                    data: {
                        type: client_1.NotificationType.POST_LIKE,
                        sender: {
                            connect: {
                                id: userId,
                            },
                        },
                        receiver: {
                            connect: {
                                id: (_b = post === null || post === void 0 ? void 0 : post.author) === null || _b === void 0 ? void 0 : _b.id,
                            },
                        },
                        postId: post === null || post === void 0 ? void 0 : post.id,
                    },
                });
                yield redis_1.default.del(`Notification:${(_c = post === null || post === void 0 ? void 0 : post.author) === null || _c === void 0 ? void 0 : _c.id}`);
                return 'Liked';
            }
            catch (error) {
                return error.message;
            }
        });
    }
    static unlikePost(postId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const checkLiked = yield db_1.db.like.findUnique({
                    where: {
                        postId_userId: {
                            postId,
                            userId,
                        },
                    },
                });
                console.log(checkLiked);
                if (!checkLiked) {
                    throw new Error('You have not liked this post');
                }
                yield db_1.db.like.delete({
                    where: {
                        postId_userId: {
                            postId,
                            userId,
                        },
                    },
                });
                return 'Unliked';
            }
            catch (error) {
                return error.message;
            }
        });
    }
    static createReply(data, userId) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            const { content, imageUrl, parentId } = data;
            try {
                const comment = yield db_1.db.post.create({
                    data: {
                        content,
                        imageUrl,
                        author: {
                            connect: {
                                id: userId,
                            },
                        },
                        parent: {
                            connect: {
                                id: parentId,
                            },
                        },
                    },
                });
                const post = yield db_1.db.post.findUnique({
                    where: {
                        id: parentId,
                    },
                    include: {
                        author: {
                            select: {
                                id: true,
                            },
                        },
                    },
                });
                if (userId === ((_a = post === null || post === void 0 ? void 0 : post.author) === null || _a === void 0 ? void 0 : _a.id))
                    return 'Reply created';
                yield db_1.db.notification.create({
                    data: {
                        type: client_1.NotificationType.POST_COMMENT,
                        sender: {
                            connect: {
                                id: userId,
                            },
                        },
                        receiver: {
                            connect: {
                                id: (_b = post === null || post === void 0 ? void 0 : post.author) === null || _b === void 0 ? void 0 : _b.id,
                            },
                        },
                        postId: post === null || post === void 0 ? void 0 : post.id,
                    },
                });
                yield redis_1.default.del(`Notification:${(_c = post === null || post === void 0 ? void 0 : post.author) === null || _c === void 0 ? void 0 : _c.id}`);
            }
            catch (error) {
                throw new Error('Failed to create reply');
            }
        });
    }
    static getRepliesToPost(postId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const post = yield db_1.db.post.findUnique({
                    where: {
                        id: postId,
                    },
                    include: {
                        replies: {
                            include: {
                                likes: true,
                                bookmarks: true,
                                replies: {
                                    select: {
                                        id: true,
                                    },
                                },
                            },
                            orderBy: {
                                createdAt: 'desc',
                            },
                        },
                        likes: true,
                        bookmarks: true,
                    },
                });
                if (!post) {
                    throw new Error('Post not found');
                }
                const isLiked = post.likes.some((like) => like.userId === userId);
                const isBookmarked = post.bookmarks.some((bookmark) => bookmark.userId === userId);
                const repliesWithInfo = post.replies.map((reply) => {
                    const isLiked = reply.likes.some((like) => like.userId === userId);
                    const isBookmarked = reply.bookmarks.some((bookmark) => bookmark.userId === userId);
                    return Object.assign(Object.assign({}, reply), { isLiked,
                        isBookmarked, bookmarkCount: reply.bookmarks.length, likeCount: reply.likes.length });
                });
                return Object.assign(Object.assign({}, post), { replies: repliesWithInfo, likeCount: post.likes.length, isLiked,
                    isBookmarked, bookmarkCount: post.bookmarks.length });
            }
            catch (error) {
                throw new Error('Failed to get replies');
            }
        });
    }
    static searchPosts(query) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const posts = yield db_1.db.post.findMany({
                    where: {
                        content: {
                            search: query,
                        },
                    },
                });
                return posts || [];
            }
            catch (error) {
                throw new Error('Failed to search posts');
            }
        });
    }
    static bookmarkPost(postId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const checkBookmarked = yield db_1.db.bookmark.findUnique({
                    where: {
                        postId_userId: {
                            postId,
                            userId,
                        },
                    },
                });
                if (checkBookmarked) {
                    throw new Error('Already bookmarked');
                }
                yield db_1.db.bookmark.create({
                    data: {
                        post: {
                            connect: {
                                id: postId,
                            },
                        },
                        user: {
                            connect: {
                                id: userId,
                            },
                        },
                    },
                });
                return 'Bookmarked';
            }
            catch (error) {
                return error.message;
            }
        });
    }
    static unBookmarkPost(postId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const checkBookmarked = yield db_1.db.bookmark.findUnique({
                    where: {
                        postId_userId: {
                            postId,
                            userId,
                        },
                    },
                });
                if (!checkBookmarked) {
                    throw new Error('You have not bookmarked this post');
                }
                yield db_1.db.bookmark.delete({
                    where: {
                        postId_userId: {
                            postId,
                            userId,
                        },
                    },
                });
                return 'UnBookmarked';
            }
            catch (error) {
                return error.message;
            }
        });
    }
}
exports.default = PostService;
