export const types = `#graphql

    input CreatePostInput {
        content: String!
        imageUrl: String
    }

    input CreateReplyInput {
        content: String!
        imageUrl: String
        parentId: String
        postId: String
    }

    type Like {
        id: ID!
        userId: String!
        postId: String!
        user: User!
        post: Post!
    }

    type Reply {
        id: ID!
        content: String!
        imageUrl: String

        author: User!
        authorId: String!

        post: Post!
        postId: String!

        
        isLiked: Boolean
        likeCount: Int

        parent: Reply
        parentId: String
        likes: [Like]
        replies: [Reply]

        createdAt: Date!
        updatedAt: Date!
    }

    type Post {
        id: ID!
        content: String!
        imageUrl: String
        author: User!
        authorId: String!

        isLiked: Boolean
        likeCount: Int

        likes: [Like]
        replies: [Reply]

        createdAt: Date!
        updatedAt: Date!
    }

`;
