import { GraphQlContext } from '../../utils/interface';
import UserService from '../../services/user';
import { User } from '@prisma/client';
import NodemailerServices from '../../services/nodemailer';

interface CreateUserInput {
  firstName: string;
  lastName: string;
  userName: string;
  email: string;
  password: string;
}

const query = {
  verifyGoogleToken: async (parent: any, { token }: { token: string }) => {
    return await UserService.verifyGoogleToken(token);
  },

  getUserInfo: async (parent: any, args: any, ctx: GraphQlContext) => {
    const userId = ctx.userSignature?.id;
    if (!userId) return null;
    return await UserService.getUserById(userId);
  },

  getUserByName: async (parent: any, { userName }: { userName: string }) => {
    return await UserService.getUserByName(userName);
  },

  getRecommendedUsers: async (parent: any, args: any, ctx: GraphQlContext) => {
    const userId = ctx.userSignature?.id;
    if (!userId) return null;
    return await UserService.getRecommendedUsers(userId);
  },

  checkUserName: async (parent: any, { userName }: { userName: string }) => {
    return await UserService.checkUserName(userName);
  },

  checkUserEmail: async (parent: any, { email }: { email: string }) => {
    return await UserService.checkUserEmail(email);
  },

  signInUser: async (
    parent: any,
    { email, password }: { email: string; password: string }
  ) => {
    try {
      const token = await UserService.signInUser(email, password);
      return token;
    } catch (error: any) {
      return new Error(error.message);
    }
  },

  verifyOTP: async (parent: any, { to, otp }: { to: string; otp: number }) => {
    try {
      return await NodemailerServices.verifyOTP(to, otp);
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  searchUsers: async (parent: any, { query }: { query: string }) => {
    try {
      return await UserService.searchUsers(query);
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  getNotifications: async (parent: any, args: any, ctx: GraphQlContext) => {
    const userId = ctx.userSignature?.id;
    if (!userId) return null;
    return await UserService.getAllNotifications(userId);
  },

  getUserLikedPosts: async (parent: any, { userId }: { userId: string }) => {
    try {
      return await UserService.getUserLikedPosts(userId);
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  getUserBookmarkedPosts: async (
    parent: any,
    args: any,
    ctx: GraphQlContext
  ) => {
    const userId = ctx.userSignature?.id;
    if (!userId) return null;
    return await UserService.getUserBookmarkedPosts(userId);
  },

  getUserPostsWithMedia: async (
    parent: any,
    { userId }: { userId: string }
  ) => {
    try {
      return await UserService.getUserPostsWithMedia(userId);
    } catch (error: any) {
      throw new Error(error.message);
    }
  },
};

const mutations = {
  followUser: async (
    parent: any,
    { to }: { to: string },
    ctx: GraphQlContext
  ) => {
    const currentUser = ctx.userSignature?.id;

    if (!currentUser) throw new Error('Unauthenticated');
    if (currentUser === to) throw new Error('You can not follow your account');

    await UserService.followUser(currentUser, to);

    return true;
  },

  unfollowUser: async (
    parent: any,
    { to }: { to: string },
    ctx: GraphQlContext
  ) => {
    const currentUser = ctx.userSignature?.id;

    if (!currentUser) throw new Error('Unauthenticated');

    await UserService.unfollowUser(currentUser, to);

    return true;
  },

  updateUserProfile: async (
    parent: any,
    { payload }: { payload: any },
    ctx: GraphQlContext
  ) => {
    try {
      const userId = ctx.userSignature?.id;
      if (!userId) throw new Error('Unauthenticated');
      await UserService.updateUserProfile(userId, payload);
      return 'Profile updated successfully';
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  createUser: async (
    parent: any,
    { payload }: { payload: CreateUserInput }
  ) => {
    try {
      return await UserService.createUser(payload);
    } catch (error: any) {
      const err = new Error(error.message);
      return false;
    }
  },

  generateOTP: async (
    parent: any,
    { to }: { to: string },
    ctx: GraphQlContext
  ) => {
    try {
      await NodemailerServices.sendEmail(to);
      return 'ok';
    } catch (error) {
      throw new Error('Failed to generate OTP');
    }
  },
};

const extraResolvers = {
  User: {
    follower: async (parent: User) => {
      return await UserService.getUserFollowers(parent.id);
    },
    following: async (parent: User) => {
      return await UserService.getUserFollowings(parent.id);
    },
  },
};

export const resolvers = { query, mutations, extraResolvers };
