export const queries = `#graphql
    getAllPosts: [Post]
    getUserPosts(userName: String!): [Post]
    getPresignerURL(imageType: String!, imageName: String!): String
`;
