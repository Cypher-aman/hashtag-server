export const types = `#graphql

type User {
    id: ID!
    firstName: String!
    lastName: String
    userName: String!
    email: String!
    profilePicUrl: String!

    follower: [User]
    following: [User]
}

`;
