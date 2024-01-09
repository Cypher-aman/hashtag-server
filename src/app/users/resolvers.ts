import { GraphQlContext } from '../../utils/interface';
import UserService from '../../services/user';
import { User } from '@prisma/client';

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
