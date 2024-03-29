import { Post } from '@prisma/client';
import { GraphQlContext } from '../../utils/interface';
import { dateScalar } from './scalars';
import PostService from '../../services/post';
import UserService from '../../services/user';

const extraTypes = {
  Date: dateScalar,
};

interface CreatePostInput {
  content: string;
  imageUrl?: string;
}

interface CreateReplyInput {
  content: string;
  imageUrl?: string;
  parentId: string;
}

const query = {
  getAllPosts: async (
    parent: any,
    { cursor }: { cursor: string },
    ctx: GraphQlContext
  ) => {
    if (!ctx.userSignature) return [];

    const userId = ctx.userSignature?.id;
    return await PostService.getAllPosts(userId, cursor);
  },

  getUserPosts: async (
    parent: any,
    { userName }: { userName: string },
    ctx: GraphQlContext
  ) => {
    if (!userName) return null;
    const userId = ctx.userSignature?.id;
    return await PostService.getUserPosts(userName, userId);
  },

  getPresignerURL: async (
    parent: any,
    { imageType, imageName }: { imageType: string; imageName: string },
    ctx: GraphQlContext
  ) => {
    return await PostService.getPresignerURL(imageType, imageName, ctx);
  },

  getPresignerURLForSignUp: async (
    parent: any,
    {
      imageType,
      imageName,
      email,
    }: { imageType: string; imageName: string; email: string }
  ) => {
    return await PostService.getPresignerURLForSignUp(
      imageType,
      imageName,
      email
    );
  },

  getRepliesToPost: async (
    parent: any,
    { postId }: { postId: string },
    ctx: GraphQlContext
  ) => {
    const userId = ctx.userSignature?.id;
    try {
      return await PostService.getRepliesToPost(postId, userId);
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  getPosts: async (parent: any, { query }: { query: string }) => {
    try {
      return await PostService.searchPosts(query);
    } catch (error: any) {
      throw new Error(error.message);
    }
  },
};

const mutation = {
  createPost: async (
    parent: any,
    { payload }: { payload: CreatePostInput },
    ctx: GraphQlContext
  ) => {
    return await PostService.createPost(payload, ctx);
  },

  likePost: async (
    parent: any,
    { postId }: { postId: string },
    ctx: GraphQlContext
  ) => {
    try {
      const userId = ctx.userSignature?.id;
      if (!userId) throw new Error('Unauthorized');
      return await PostService.likePost(postId, userId);
    } catch (error: any) {
      return error.message;
    }
  },

  unlikePost: async (
    parent: any,
    { postId }: { postId: string },
    ctx: GraphQlContext
  ) => {
    try {
      const userId = ctx.userSignature?.id;
      if (!userId) throw new Error('Unauthorized');
      return await PostService.unlikePost(postId, userId);
    } catch (error: any) {
      return error.message;
    }
  },

  createReply: async (
    parent: any,
    { payload }: { payload: CreateReplyInput },
    ctx: GraphQlContext
  ) => {
    try {
      const userId = ctx.userSignature?.id;
      if (!userId) throw new Error('Unauthorized');
      await PostService.createReply(payload, userId);
      return 'Reply created';
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  bookmarkPost: async (
    parent: any,
    { postId }: { postId: string },
    ctx: GraphQlContext
  ) => {
    try {
      const userId = ctx.userSignature?.id;
      if (!userId) throw new Error('Unauthorized');
      return await PostService.bookmarkPost(postId, userId);
    } catch (error: any) {
      return error.message;
    }
  },

  unBookmarkPost: async (
    parent: any,
    { postId }: { postId: string },
    ctx: GraphQlContext
  ) => {
    try {
      const userId = ctx.userSignature?.id;
      if (!userId) throw new Error('Unauthorized');
      return await PostService.unBookmarkPost(postId, userId);
    } catch (error: any) {
      return error.message;
    }
  },
};

const extraResolvers = {
  Post: {
    author: async (parent: Post) => {
      return await UserService.getUserById(parent.authorId);
    },
  },
};

export const resolvers = { mutation, query, extraResolvers, extraTypes };
