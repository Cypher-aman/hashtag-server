"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mutations = void 0;
exports.mutations = `#graphql
    followUser(to: String!): Boolean
    unfollowUser(to: String!): Boolean
    updateUserProfile(payload: UpdateUserProfileInput!): String
    generateOTP(to: String!): String
    createUser(payload: CreateUserInput!): Boolean
`;
