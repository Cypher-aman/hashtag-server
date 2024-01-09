export const queries = `#graphql
    
    verifyGoogleToken(token: String!): String!
    getUserInfo: User
    getUserByName(userName: String!): User
    getRecommendedUsers: [User]

`;
