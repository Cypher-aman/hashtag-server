"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.types = void 0;
exports.types = `#graphql

input UpdateUserProfileInput {
    firstName: String
    lastName: String
    profilePicUrl: String
    userName: String
    bio: String
    coverPicUrl: String
}

input CreateUserInput {
    firstName: String!
    lastName: String
    userName: String!
    email: String!
    password: String!
    profilePicUrl: String
}

type User {
    id: ID!
    firstName: String!
    lastName: String
    userName: String!
    email: String!
    profilePicUrl: String
    bio: String
    coverPicUrl: String

    bookmarks: [Bookmark]
    likes: [Like]

    follower: [User]
    following: [User]
}

enum NotificationType {
    POST_LIKE
    POST_COMMENT
    FOLLOW
}

type Notification {
    id: ID!
    type: NotificationType!
    sender: User
    senderId: String
    receiver: User
    receiverId: String
    postId: String
    commentId: String
    timestamp: String
}

`;
