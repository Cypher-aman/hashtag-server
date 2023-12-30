export const types = `#graphql

    input CreatePostInput {
        content: String!
        imageUrl: String
    }

    type Post {
        id: ID!
        content: String!
        imageUrl: String
        author: User!
        authorId: String!

        createdAt: Date!
        updatedAt: Date!
    }

`;
