"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.types = void 0;
exports.types = `#graphql

    input CreatePostInput {
        content: String!
        imageUrl: String
    }

    input CreateReplyInput {
        content: String!
        imageUrl: String
        parentId: String
    }

    type getPostsOutput {
        posts: [Post]
        nextId: String
    }

    type Like {
        id: ID!
        userId: String!
        postId: String!
        user: User!
        post: Post!
    }

    type Bookmark {
        id: ID!
        userId: String!
        postId: String!
        user: User!
        post: Post!
    }

    type Post {
        id: ID!
        content: String!
        imageUrl: String
        author: User!
        authorId: String!
        parent: Post
        parentId: String

        isLiked: Boolean
        likeCount: Int
        isBookmarked: Boolean
        bookmarkCount: Int

        likes: [Like]
        replies: [Post]
        bookmarks: [Bookmark]

        createdAt: Date!
        updatedAt: Date!
    }

`;
