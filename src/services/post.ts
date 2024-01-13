import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { db } from '../clients/db';
import { GraphQlContext } from '../utils/interface';
import { Bookmark, Like, NotificationType } from '@prisma/client';
import redisClient from '../clients/redis';

const s3CLient = new S3Client({});

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
  static async getAllPosts(userId?: string) {
    const posts = await db.post.findMany({
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

    return postsWithInfo;
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
      Bucket: process.env.AWS_BUCKET_NAME,
      ContentType: imageType,
      Key: `uploads/posts/${ctx.userSignature.id}/${Date.now()}-${imageName}`,
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
        },
      });
      if (!post) {
        throw new Error('Post not found');
      }
      const isLiked = post.likes.some((like) => like.userId === userId);
      const repliesWithLikeInfo = post.replies.map((reply) => {
        const isLiked = reply.likes.some((like) => like.userId === userId);
        return {
          ...reply,
          isLiked,
          likeCount: reply.likes.length,
        };
      });
      return {
        ...post,
        replies: repliesWithLikeInfo,
        likeCount: post.likes.length,
        isLiked,
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
