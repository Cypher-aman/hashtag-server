export const types = `#graphql

    input CreatePostInput {
        content: String!
        imageUrl: String
    }

    input CreateReplyInput {
        content: String!
        imageUrl: String
        parentId: String
    }

    type Like {
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

        likes: [Like]
        replies: [Post]

        createdAt: Date!
        updatedAt: Date!
    }

`;
