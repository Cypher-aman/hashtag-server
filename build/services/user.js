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
const axios_1 = __importDefault(require("axios"));
const db_1 = require("../clients/db");
const helper_1 = require("../utils/helper");
const bcrypt_1 = __importDefault(require("bcrypt"));
const redis_1 = __importDefault(require("../clients/redis"));
const client_1 = require("@prisma/client");
const nodemailer_1 = __importDefault(require("./nodemailer"));
class UserService {
    static verifyGoogleToken(token) {
        return __awaiter(this, void 0, void 0, function* () {
            const googleOAuthAPI = new URL('https://oauth2.googleapis.com/tokeninfo');
            googleOAuthAPI.searchParams.set('id_token', token);
            try {
                const { data } = yield axios_1.default.get(googleOAuthAPI.toString(), {
                    responseType: 'json',
                });
                let user = yield db_1.db.user.findUnique({
                    where: {
                        email: data.email,
                    },
                });
                if (!user) {
                    user = yield db_1.db.user.create({
                        data: {
                            firstName: data.given_name,
                            lastName: data.family_name,
                            userName: (0, helper_1.generateUniqueUserName)(),
                            email: data.email,
                            profilePicUrl: data.picture,
                        },
                    });
                    yield nodemailer_1.default.sendAccounCreationUpdateEmail(user);
                }
                const token = (0, helper_1.generateJWTUserToken)(user);
                return token;
            }
            catch (error) {
                console.log(error);
                return error.message;
            }
        });
    }
    static getUserById(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield db_1.db.user.findUnique({ where: { id: userId } });
            return user;
        });
    }
    static getUserByName(userName) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield db_1.db.user.findUnique({ where: { userName } });
            if (!user) {
                return null;
            }
            return user;
        });
    }
    static followUser(from, to) {
        return __awaiter(this, void 0, void 0, function* () {
            yield db_1.db.follows.create({
                data: {
                    follower: {
                        connect: { id: from },
                    },
                    following: {
                        connect: { id: to },
                    },
                },
            });
            if (from === to)
                return;
            yield db_1.db.notification.create({
                data: {
                    type: client_1.NotificationType.FOLLOW,
                    sender: {
                        connect: { id: from },
                    },
                    receiver: {
                        connect: { id: to },
                    },
                },
            });
            yield redis_1.default.del(`Notification:${to}`);
        });
    }
    static unfollowUser(from, to) {
        return __awaiter(this, void 0, void 0, function* () {
            yield db_1.db.follows.delete({
                where: {
                    followerId_followingId: {
                        followerId: from,
                        followingId: to,
                    },
                },
            });
        });
    }
    static getUserFollowers(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const users = yield db_1.db.follows.findMany({
                where: { followingId: id },
                include: {
                    follower: true,
                },
            });
            return users.map((e) => e.follower);
        });
    }
    static getUserFollowings(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const users = yield db_1.db.follows.findMany({
                where: { followerId: id },
                include: {
                    following: true,
                },
            });
            return users.map((e) => e.following);
        });
    }
    static getRecommendedUsers(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const users = yield db_1.db.user.findMany({
                where: {
                    NOT: {
                        id,
                    },
                },
                include: {
                    follower: true,
                    following: true,
                },
            });
            const notFollowing = users.filter((user) => {
                return !user.following.some((following) => following.followerId === id);
            });
            return notFollowing.length < 4 ? notFollowing : notFollowing.slice(0, 4);
        });
    }
    static updateUserProfile(userId, payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield db_1.db.user.update({
                    where: {
                        id: userId,
                    },
                    data: {
                        firstName: payload.firstName,
                        lastName: payload.lastName,
                        userName: payload.userName,
                        profilePicUrl: payload.profilePicUrl,
                        coverPicUrl: payload.coverPicUrl,
                        bio: payload.bio,
                    },
                });
                return user;
            }
            catch (error) {
                throw new Error('Failed to update user profile');
            }
        });
    }
    static createUser(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const checkUser = yield db_1.db.user.findUnique({
                    where: {
                        email: payload.email,
                    },
                });
                if (checkUser === null || checkUser === void 0 ? void 0 : checkUser.id)
                    throw new Error('User already exists');
                const hash = yield bcrypt_1.default.hash(payload.password, 10);
                const user = yield db_1.db.user.create({
                    data: {
                        firstName: payload.firstName,
                        lastName: payload.lastName,
                        userName: payload.userName,
                        email: payload.email,
                        passwordHash: hash,
                        profilePicUrl: payload.profilePicUrl,
                    },
                });
                yield nodemailer_1.default.sendAccounCreationUpdateEmail(user);
                return true;
            }
            catch (error) {
                console.log(error.message);
                const err = new Error('Failed to create user');
                return false;
            }
        });
    }
    static signInUser(email, password) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield db_1.db.user.findUnique({
                    where: {
                        email,
                    },
                });
                if (!user)
                    throw new Error('Invalid credentials');
                if (!user.passwordHash)
                    throw new Error('Account created with Google');
                const isMatch = yield bcrypt_1.default.compare(password, user.passwordHash);
                if (!isMatch)
                    throw new Error('Invalid credentials');
                const token = (0, helper_1.generateJWTUserToken)(user);
                return token;
            }
            catch (error) {
                throw new Error(error.message);
            }
        });
    }
    static checkUserName(userName) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield db_1.db.user.findUnique({ where: { userName } });
            if (user) {
                return false;
            }
            return true;
        });
    }
    static checkUserEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield db_1.db.user.findUnique({ where: { email } });
            if (user) {
                return false;
            }
            return true;
        });
    }
    static searchUsers(query) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const users = db_1.db.user.findMany({
                    where: {
                        OR: [
                            {
                                firstName: {
                                    contains: query,
                                    mode: 'insensitive',
                                },
                            },
                            {
                                lastName: {
                                    contains: query,
                                    mode: 'insensitive',
                                },
                            },
                            {
                                userName: {
                                    contains: query,
                                    mode: 'insensitive',
                                },
                            },
                        ],
                    },
                });
                return users || [];
            }
            catch (error) {
                throw new Error(error.message);
            }
        });
    }
    static getAllNotifications(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const chachedNotifications = yield redis_1.default.get(`Notification:${userId}`);
            if (chachedNotifications) {
                return JSON.parse(chachedNotifications);
            }
            const notifications = yield db_1.db.notification.findMany({
                where: {
                    receiverId: userId,
                },
                include: {
                    sender: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            userName: true,
                            profilePicUrl: true,
                        },
                    },
                },
                orderBy: {
                    timestamp: 'desc',
                },
            });
            yield redis_1.default.setex(`Notification:${userId}`, 60 * 60 * 24, JSON.stringify(notifications));
            return notifications;
        });
    }
    static getUserLikedPosts(userId, loggedInUserId) {
        return __awaiter(this, void 0, void 0, function* () {
            const likes = yield db_1.db.like.findMany({
                where: {
                    userId,
                },
                orderBy: {
                    createdAt: 'desc',
                },
                include: {
                    post: {
                        include: {
                            bookmarks: true,
                            likes: true,
                            replies: {
                                select: {
                                    id: true,
                                },
                            },
                        },
                    },
                },
            });
            const likedPosts = likes.map((like) => like.post);
            const postWithInfo = likedPosts.map((post) => {
                const isBookmarked = post.bookmarks.some((bookmark) => bookmark.userId === loggedInUserId);
                const isLiked = post.likes.some((like) => like.userId === loggedInUserId);
                return Object.assign(Object.assign({}, post), { isBookmarked, isLiked: isLiked, likeCount: post.likes.length, bookmarkCount: post.bookmarks.length });
            });
            return postWithInfo || [];
        });
    }
    static getUserBookmarkedPosts(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const bookmark = yield db_1.db.bookmark.findMany({
                where: {
                    userId,
                },
                orderBy: {
                    createdAt: 'desc',
                },
                include: {
                    post: {
                        include: {
                            bookmarks: true,
                            likes: true,
                            replies: {
                                select: {
                                    id: true,
                                },
                            },
                        },
                    },
                },
            });
            const bookmarkedPosts = bookmark.map((bookmark) => bookmark.post);
            const postWithInfo = bookmarkedPosts.map((post) => {
                const isLiked = post.likes.some((bookmark) => bookmark.userId === userId);
                return Object.assign(Object.assign({}, post), { isBookmarked: true, isLiked, likeCount: post.likes.length, bookmarkCount: post.bookmarks.length });
            });
            return postWithInfo || [];
        });
    }
    static getUserPostsWithMedia(userId, loggedInUserId) {
        return __awaiter(this, void 0, void 0, function* () {
            const posts = yield db_1.db.post.findMany({
                where: {
                    authorId: userId,
                    imageUrl: {
                        not: '',
                    },
                },
                include: {
                    bookmarks: true,
                    likes: true,
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
                const isLiked = post.likes.some((like) => like.userId === loggedInUserId);
                const isBookmarked = post.bookmarks.some((bookmark) => bookmark.userId === loggedInUserId);
                return Object.assign(Object.assign({}, post), { isLiked,
                    isBookmarked, bookmarkCount: post.bookmarks.length, likeCount: post.likes.length });
            });
            return postsWithInfo || [];
        });
    }
}
exports.default = UserService;
