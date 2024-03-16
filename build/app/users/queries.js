"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queries = void 0;
exports.queries = `#graphql
    
    verifyGoogleToken(token: String!): String!
    getUserInfo: User
    getUserByName(userName: String!): User
    getRecommendedUsers: [User]
    checkUserName(userName: String!): Boolean
    checkUserEmail(email: String!): Boolean
    signInUser(email: String!, password: String!): String
    verifyOTP(to: String!, otp: Int!): Boolean!
    searchUsers(query: String!): [User]
    getNotifications: [Notification]
    getUserLikedPosts(userId: String!): [Post]
    getUserBookmarkedPosts: [Post]
    getUserPostsWithMedia(userId: String!): [Post]
`;
