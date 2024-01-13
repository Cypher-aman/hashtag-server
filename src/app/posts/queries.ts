export const queries = `#graphql
    getAllPosts: [Post]
    getUserPosts(userName: String!, userId: String): [Post]
    getPresignerURL(imageType: String!, imageName: String!): String
    getRepliesToPost(postId: String!): Post
    getPosts(query: String!): [Post]
`;
