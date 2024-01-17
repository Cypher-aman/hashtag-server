import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { db } from '../clients/db';
import { GraphQlContext } from '../utils/interface';
import { Bookmark, Like, NotificationType } from '@prisma/client';
import redisClient from '../clients/redis';
import { POST_PER_PAGE } from '../utils/constant';
import NodemailerServices from './nodemailer';

const s3CLient = new S3Client({
  region: 'ap-south-1',
  credentials: {
    accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY as string,
  },
});

interface CreatePostInput {
  content: string;
  imageUrl?: string;
}

interface CreateReplyInput {
  content: string;
  imageUrl?: string;
  parentId: string;
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

class PostService {
  static async getAllPosts(userId?: string, cursor: string | undefined = '') {
    const cursorObj = cursor ? { id: cursor } : undefined;

    const posts = await db.post.findMany({
      take: POST_PER_PAGE,
      cursor: cursorObj,
      skip: cursor ? 1 : 0,
      where: {
        parent: null,
      },
      include: {
        likes: true,
        bookmarks: true,
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

    if (!userId) {
      return posts;
    }

    const postsWithInfo = posts.map((post: Post) => {
      const isLiked = post.likes.some((like) => like.userId === userId);
      const isBookmarked = post.bookmarks.some(
        (bookmark) => bookmark.userId === userId
      );
      return {
        ...post,
        isLiked,
        isBookmarked,
        bookmarkCount: post.bookmarks.length,
        likeCount: post.likes.length,
      };
    });

    return {
      posts: postsWithInfo,
      nextId:
        posts.length === POST_PER_PAGE ? posts[posts.length - 1].id : undefined,
    };
  }

  static async getUserPosts(userName: string, userId?: string) {
    if (!userName) {
      return null;
    }
    const posts = await db.post.findMany({
      where: {
        author: {
          userName,
        },
        parent: null,
      },
      include: {
        likes: true,
        bookmarks: true,
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
      const isLiked = post.likes.some((like) => like.userId === userId);
      const isBookmarked = post.bookmarks.some(
        (bookmark) => bookmark.userId === userId
      );
      return {
        ...post,
        isLiked,
        isBookmarked,
        bookmarkCount: post.bookmarks.length,
        likeCount: post.likes.length,
      };
    });

    return postsWithInfo;
  }

  static async getPresignerURL(
    imageType: string,
    imageName: string,
    ctx: GraphQlContext
  ) {
    if (!ctx.userSignature || !ctx.userSignature.id)
      throw new Error('Unauthorized');
    const supportedTypes = [
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp',
    ];

    if (!supportedTypes.includes(imageType))
      throw new Error('Unsupported image type');

    const putObjectCommand = new PutObjectCommand({
      Bucket: process.env.MY_AWS_BUCKET_NAME,
      ContentType: imageType,
      Key: `uploads/posts/${ctx.userSignature.id}/${Date.now()}-${imageName}`,
    });

    const presignerURL = await getSignedUrl(s3CLient, putObjectCommand);

    return presignerURL;
  }

  static async getPresignerURLForSignUp(
    imageType: string,
    imageName: string,
    email: string
  ) {
    if (!email) throw new Error('Unauthorized');
    const supportedTypes = [
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp',
    ];

    if (!supportedTypes.includes(imageType))
      throw new Error('Unsupported image type');

    const putObjectCommand = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      ContentType: imageType,
      Key: `uploads/users/email/${email}/${Date.now()}-${imageName}`,
    });

    const presignerURL = await getSignedUrl(s3CLient, putObjectCommand);

    return presignerURL;
  }

  static async createPost(payload: CreatePostInput, ctx: GraphQlContext) {
    const authorId = ctx.userSignature?.id;

    if (!authorId) {
      return 'Unauthorized';
    }

    const post = await db.post.create({
      data: {
        content: payload.content,
        imageUrl: payload.imageUrl,
        author: {
          connect: {
            id: authorId,
          },
        },
      },
    });
    await NodemailerServices.sendPostCreationUpdateEmail(post);
    return post;
  }

  static async likePost(postId: string, userId: string) {
    try {
      const checkLiked = await db.like.findUnique({
        where: {
          postId_userId: {
            postId,
            userId,
          },
        },
      });

      if (checkLiked) {
        throw new Error('Already liked');
      }

      await db.like.create({
        data: {
          post: {
            connect: {
              id: postId,
            },
          },
          user: {
            connect: {
              id: userId,
            },
          },
        },
      });

      const post = await db.post.findUnique({
        where: {
          id: postId,
        },
        include: {
          author: {
            select: {
              id: true,
            },
          },
        },
      });

      if (userId === post?.author?.id) return 'Liked';

      await db.notification.create({
        data: {
          type: NotificationType.POST_LIKE,
          sender: {
            connect: {
              id: userId,
            },
          },
          receiver: {
            connect: {
              id: post?.author?.id,
            },
          },
          postId: post?.id,
        },
      });

      await redisClient.del(`Notification:${post?.author?.id}`);

      return 'Liked';
    } catch (error: any) {
      return error.message;
    }
  }

  static async unlikePost(postId: string, userId: string) {
    try {
      const checkLiked = await db.like.findUnique({
        where: {
          postId_userId: {
            postId,
            userId,
          },
        },
      });
      console.log(checkLiked);
      if (!checkLiked) {
        throw new Error('You have not liked this post');
      }
      await db.like.delete({
        where: {
          postId_userId: {
            postId,
            userId,
          },
        },
      });
      return 'Unliked';
    } catch (error: any) {
      return error.message;
    }
  }

  static async createReply(data: CreateReplyInput, userId: string) {
    const { content, imageUrl, parentId } = data;
    try {
      const comment = await db.post.create({
        data: {
          content,
          imageUrl,
          author: {
            connect: {
              id: userId,
            },
          },
          parent: {
            connect: {
              id: parentId,
            },
          },
        },
      });

      const post = await db.post.findUnique({
        where: {
          id: parentId,
        },
        include: {
          author: {
            select: {
              id: true,
            },
          },
        },
      });

      if (userId === post?.author?.id) return 'Reply created';

      await db.notification.create({
        data: {
          type: NotificationType.POST_COMMENT,
          sender: {
            connect: {
              id: userId,
            },
          },
          receiver: {
            connect: {
              id: post?.author?.id,
            },
          },
          postId: post?.id,
        },
      });

      await redisClient.del(`Notification:${post?.author?.id}`);
    } catch (error) {
      throw new Error('Failed to create reply');
    }
  }

  static async getRepliesToPost(postId: string, userId?: string) {
    try {
      const post = await db.post.findUnique({
        where: {
          id: postId,
        },
        include: {
          replies: {
            include: {
              likes: true,
              bookmarks: true,
              replies: {
                select: {
                  id: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
          likes: true,
          bookmarks: true,
        },
      });
      if (!post) {
        throw new Error('Post not found');
      }
      const isLiked = post.likes.some((like) => like.userId === userId);
      const isBookmarked = post.bookmarks.some(
        (bookmark) => bookmark.userId === userId
      );
      const repliesWithInfo = post.replies.map((reply) => {
        const isLiked = reply.likes.some((like) => like.userId === userId);
        const isBookmarked = reply.bookmarks.some(
          (bookmark) => bookmark.userId === userId
        );
        return {
          ...reply,
          isLiked,
          isBookmarked,
          bookmarkCount: reply.bookmarks.length,
          likeCount: reply.likes.length,
        };
      });
      return {
        ...post,
        replies: repliesWithInfo,
        likeCount: post.likes.length,
        isLiked,
        isBookmarked,
        bookmarkCount: post.bookmarks.length,
      };
    } catch (error) {
      throw new Error('Failed to get replies');
    }
  }

  static async searchPosts(query: string) {
    try {
      const posts = await db.post.findMany({
        where: {
          content: {
            search: query,
          },
        },
      });
      return posts || [];
    } catch (error) {
      throw new Error('Failed to search posts');
    }
  }

  static async bookmarkPost(postId: string, userId: string) {
    try {
      const checkBookmarked = await db.bookmark.findUnique({
        where: {
          postId_userId: {
            postId,
            userId,
          },
        },
      });

      if (checkBookmarked) {
        throw new Error('Already bookmarked');
      }

      await db.bookmark.create({
        data: {
          post: {
            connect: {
              id: postId,
            },
          },
          user: {
            connect: {
              id: userId,
            },
          },
        },
      });

      return 'Bookmarked';
    } catch (error: any) {
      return error.message;
    }
  }

  static async unBookmarkPost(postId: string, userId: string) {
    try {
      const checkBookmarked = await db.bookmark.findUnique({
        where: {
          postId_userId: {
            postId,
            userId,
          },
        },
      });
      if (!checkBookmarked) {
        throw new Error('You have not bookmarked this post');
      }
      await db.bookmark.delete({
        where: {
          postId_userId: {
            postId,
            userId,
          },
        },
      });
      return 'UnBookmarked';
    } catch (error: any) {
      return error.message;
    }
  }
}

export default PostService;
