import axios from 'axios';
import { db } from '../clients/db';
import { generateUniqueUserName, generateJWTUserToken } from '../utils/helper';

class UserService {
  static async verifyGoogleToken(token: string) {
    const googleOAuthAPI = new URL('https://oauth2.googleapis.com/tokeninfo');
    googleOAuthAPI.searchParams.set('id_token', token);

    try {
      const { data } = await axios.get<any>(googleOAuthAPI.toString(), {
        responseType: 'json',
      });

      let user = await db.user.findUnique({
        where: {
          email: data.email,
        },
      });

      if (!user) {
        user = await db.user.create({
          data: {
            firstName: data.given_name,
            lastName: data.family_name,
            userName: generateUniqueUserName(),
            email: data.email,
            profilePicUrl: data.picture,
          },
        });
      }

      const token = generateJWTUserToken(user);

      return token;
    } catch (error: any) {
      console.log(error);
      return error.message;
    }
  }

  static async getUserById(userId: string) {
    const user = await db.user.findUnique({ where: { id: userId } });

    return user;
  }

  static async getUserByName(userName: string) {
    const user = await db.user.findUnique({ where: { userName } });
    if (!user) {
      return null;
    }
    return user;
  }

  static async followUser(from: string, to: string) {
    await db.follows.create({
      data: {
        follower: {
          connect: { id: from },
        },
        following: {
          connect: { id: to },
        },
      },
    });
  }

  static async unfollowUser(from: string, to: string) {
    await db.follows.delete({
      where: {
        followerId_followingId: {
          followerId: from,
          followingId: to,
        },
      },
    });
  }

  static async getUserFollowers(id: string) {
    const users = await db.follows.findMany({
      where: { followingId: id },
      include: {
        follower: true,
      },
    });
    return users.map((e) => e.follower);
  }

  static async getUserFollowings(id: string) {
    const users = await db.follows.findMany({
      where: { followerId: id },
      include: {
        following: true,
      },
    });

    return users.map((e) => e.following);
  }

  static async getRecommendedUsers(id: string) {
    const users = await db.user.findMany({
      where: {
        NOT: {
          id,
        },
      },
      include: {
        follower: true,
        following: true,
      },
    });

    const notFollowing = users.filter((user) => {
      return !user.following.some((following) => following.followerId === id);
    });

    return notFollowing.length < 4 ? notFollowing : notFollowing.slice(0, 4);
  }
}

export default UserService;
