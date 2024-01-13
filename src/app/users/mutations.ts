export const mutations = `#graphql
    followUser(to: String!): Boolean
    unfollowUser(to: String!): Boolean
    updateUserProfile(payload: UpdateUserProfileInput!): String
    generateOTP(to: String!): String
    createUser(payload: CreateUserInput!): Boolean
`;
