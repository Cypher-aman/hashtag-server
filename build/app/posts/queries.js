"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queries = void 0;
exports.queries = `#graphql
    getAllPosts(cursor: String!): getPostsOutput
    getUserPosts(userName: String!, userId: String): [Post]
    getPresignerURL(imageType: String!, imageName: String!): String
    getPresignerURLForSignUp(imageType: String!, imageName: String!, email: String!): String
    getRepliesToPost(postId: String!): Post
    getPosts(query: String!): [Post]
`;
