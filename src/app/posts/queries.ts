export const queries = `#graphql
    getAllPosts(cursor: String!): getPostsOutput
    getUserPosts(userName: String!, userId: String): [Post]
    getPresignerURL(imageType: String!, imageName: String!): String
    getPresignerURLForSignUp(imageType: String!, imageName: String!, email: String!): String
    getRepliesToPost(postId: String!): Post
    getPosts(query: String!): [Post]
`;
