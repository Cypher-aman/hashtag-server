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

const query = {
  getAllPosts: async () => {
    return await PostService.getAllPosts();
  },

  getUserPosts: async (parent: any, { userName }: { userName: string }) => {
    return await PostService.getUserPosts(userName);
  },

  getPresignerURL: async (
    parent: any,
    { imageType, imageName }: { imageType: string; imageName: string },
    ctx: GraphQlContext
  ) => {
    return await PostService.getPresignerURL(imageType, imageName, ctx);
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
};

const extraResolvers = {
  Post: {
    author: async (parent: Post) => {
      return await UserService.getUserById(parent.authorId);
    },
  },
};

export const resolvers = { mutation, query, extraResolvers, extraTypes };
