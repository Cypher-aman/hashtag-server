import axios from 'axios';
import { db } from '../clients/db';
import { generateUniqueUserName, generateJWTUserToken } from '../utils/helper';
import bcrypt from 'bcrypt';
import redisClient from '../clients/redis';
import { Bookmark, Like, NotificationType } from '@prisma/client';

interface UpdateUserProfileInput {
  firstName: string;
  lastName: string;
  profilePicUrl: string;
  userName: string;
  bio: string;
  coverPicUrl: string;
}

interface Post {
  id: string;
  content: string;
  imageUrl: string | null;
  authorId: string;
  likes: Like[]; // Add the likes property
  createdAt: Date;
  updatedAt: Date;
  bookmarks: Bookmark[];
}

interface CreateUserInput {
  firstName: string;
  lastName: string;
  userName: string;
  email: string;
  password: string;
  profilePicUrl?: string;
}

interface PostOutput {
  id: string;
  content: string;
  imageUrl: string | null;
  authorId: string;
  isLiked: boolean;
  isBookmarked: boolean;
  likeCount: number;
  bookmarkCount: number;
  createdAt: Date;
  updatedAt: Date;
  bookmarks: Bookmark[];
}

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

    if (from === to) return;

    await db.notification.create({
      data: {
        type: NotificationType.FOLLOW,
        sender: {
          connect: { id: from },
        },
        receiver: {
          connect: { id: to },
        },
      },
    });

    await redisClient.del(`Notification:${to}`);
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

  static async updateUserProfile(
    userId: string,
    payload: UpdateUserProfileInput
  ) {
    try {
      const user = await db.user.update({
        where: {
          id: userId,
        },
        data: {
          firstName: payload.firstName,
          lastName: payload.lastName,
          userName: payload.userName,
          profilePicUrl: payload.profilePicUrl,
          coverPicUrl: payload.coverPicUrl,
          bio: payload.bio,
        },
      });
      return user;
    } catch (error) {
      throw new Error('Failed to update user profile');
    }
  }

  static async createUser(payload: CreateUserInput) {
    try {
      const checkUser = await db.user.findUnique({
        where: {
          email: payload.email,
        },
      });
      if (checkUser?.id) throw new Error('User already exists');

      const hash = await bcrypt.hash(payload.password, 10);

      const user = await db.user.create({
        data: {
          firstName: payload.firstName,
          lastName: payload.lastName,
          userName: payload.userName,
          email: payload.email,
          passwordHash: hash,
          profilePicUrl: payload.profilePicUrl,
        },
      });
      return true;
    } catch (error: any) {
      console.log(error.message);
      const err = new Error('Failed to create user');
      return false;
    }
  }

  static async signInUser(email: string, password: string) {
    try {
      const user = await db.user.findUnique({
        where: {
          email,
        },
      });

      if (!user) throw new Error('Invalid credentials');
      if (!user.passwordHash) throw new Error('Account created with Google');

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) throw new Error('Invalid credentials');
      const token = generateJWTUserToken(user);
      return token;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  static async checkUserName(userName: string) {
    const user = await db.user.findUnique({ where: { userName } });
    if (user) {
      return false;
    }
    return true;
  }

  static async checkUserEmail(email: string) {
    const user = await db.user.findUnique({ where: { email } });
    if (user) {
      return false;
    }
    return true;
  }

  static async searchUsers(query: string) {
    try {
      const users = db.user.findMany({
        where: {
          OR: [
            {
              firstName: {
                contains: query,
                mode: 'insensitive',
              },
            },
            {
              lastName: {
                contains: query,
                mode: 'insensitive',
              },
            },
            {
              userName: {
                contains: query,
                mode: 'insensitive',
              },
            },
          ],
        },
      });

      return users || [];
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  static async getAllNotifications(userId: string) {
    const chachedNotifications = await redisClient.get(
      `Notification:${userId}`
    );
    if (chachedNotifications) {
      return JSON.parse(chachedNotifications);
    }
    const notifications = await db.notification.findMany({
      where: {
        receiverId: userId,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            userName: true,
            profilePicUrl: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });
    await redisClient.setex(
      `Notification:${userId}`,
      60 * 60 * 24,
      JSON.stringify(notifications)
    );
    return notifications;
  }

  static async getUserLikedPosts(userId: string, loggedInUserId: string) {
    const likes = await db.like.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        post: {
          include: {
            bookmarks: true,
            likes: true,
            replies: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    const likedPosts = likes.map((like) => like.post);
    const postWithInfo = likedPosts.map((post) => {
      const isBookmarked = post.bookmarks.some(
        (bookmark) => bookmark.userId === loggedInUserId
      );
      const isLiked = post.likes.some((like) => like.userId === loggedInUserId);
      return {
        ...post,
        isBookmarked,
        isLiked: isLiked,
        likeCount: post.likes.length,
        bookmarkCount: post.bookmarks.length,
      };
    });

    return postWithInfo || [];
  }

  static async getUserBookmarkedPosts(userId: string) {
    const bookmark = await db.bookmark.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        post: {
          include: {
            bookmarks: true,
            likes: true,
            replies: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    const bookmarkedPosts = bookmark.map((bookmark) => bookmark.post);
    const postWithInfo = bookmarkedPosts.map((post) => {
      const isLiked = post.likes.some((bookmark) => bookmark.userId === userId);
      return {
        ...post,
        isBookmarked: true,
        isLiked,
        likeCount: post.likes.length,
        bookmarkCount: post.bookmarks.length,
      };
    });

    return postWithInfo || [];
  }

  static async getUserPostsWithMedia(userId: string, loggedInUserId: string) {
    const posts = await db.post.findMany({
      where: {
        authorId: userId,
        imageUrl: {
          not: '',
        },
      },
      include: {
        bookmarks: true,
        likes: true,
        replies: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const postsWithInfo = posts.map((post: Post) => {
      const isLiked = post.likes.some((like) => like.userId === loggedInUserId);
      const isBookmarked = post.bookmarks.some(
        (bookmark) => bookmark.userId === loggedInUserId
      );
      return {
        ...post,
        isLiked,
        isBookmarked,
        bookmarkCount: post.bookmarks.length,
        likeCount: post.likes.length,
      };
    });

    return postsWithInfo || [];
  }
}

export default UserService;
