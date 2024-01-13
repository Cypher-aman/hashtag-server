export const mutations = `#graphql
    createPost(payload: CreatePostInput!): Post
    likePost(postId: String!): String
    unlikePost(postId: String!): String
    createReply(payload: CreateReplyInput!): String
    bookmarkPost(postId: String!): String
    unBookmarkPost(postId: String!): String
`;
