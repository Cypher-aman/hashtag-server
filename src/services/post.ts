import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { db } from '../clients/db';
import { GraphQlContext } from '../utils/interface';
import { Like, Reply } from '@prisma/client';

const s3CLient = new S3Client({});

interface CreatePostInput {
  content: string;
  imageUrl?: string;
}

interface Post {
  id: string;
  content: string;
  imageUrl: string | null;
  authorId: string;
  likes: Like[]; // Add the likes property
  createdAt: Date;
  updatedAt: Date;
}

class PostService {
  static async getAllPosts(userId?: string) {
    const posts = await db.post.findMany({
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
    });

    if (!userId) {
      return posts;
    }

    const postsWithLikeInfo = posts.map((post: Post) => {
      const isLiked = post.likes.some((like) => like.userId === userId);

      return {
        ...post,
        isLiked,
        likeCount: post.likes.length,
      };
    });

    return postsWithLikeInfo;
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
      },
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
    });

    const postsWithLikeInfo = posts.map((post: Post) => {
      const isLiked = post.likes.some((like) => like.userId === userId);

      return {
        ...post,
        isLiked,
        likeCount: post.likes.length,
      };
    });

    return postsWithLikeInfo;
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
      console.log(checkLiked);

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

  static async createReply(data: Reply, userId: string) {
    const { content, imageUrl, postId, parentId } = data;
    try {
      if (parentId) {
        await db.reply.create({
          data: {
            content,
            imageUrl,
            author: {
              connect: {
                id: userId,
              },
            },
            post: {
              connect: {
                id: postId,
              },
            },
            parent: {
              connect: {
                id: parentId,
              },
            },
          },
        });
      } else {
        await db.reply.create({
          data: {
            content,
            imageUrl,
            author: {
              connect: {
                id: userId,
              },
            },
            post: {
              connect: {
                id: postId,
              },
            },
          },
        });
      }
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
          replies: true,
          likes: {
            select: {
              userId: true,
            },
          },
          bookmarks: {
            select: {
              userId: true,
            },
          },
        },
      });
      if (!post) throw new Error('Post not found');

      const withDirectReplies = post.replies.filter((reply) => !reply.parentId);
      if (userId) {
        const isLiked = post.likes.some((like) => like.userId === userId);
        return {
          ...post,
          replies: withDirectReplies,
          isLiked,
          likeCount: post.likes.length,
        };
      }
      return {
        ...post,
        replies: withDirectReplies,
        likeCount: post.likes.length,
      };
    } catch (error) {
      throw new Error('Failed to get replies');
    }
  }

  static async getNestedReplies(postId: string) {
    try {
      const reply = await db.reply.findUnique({
        where: {
          id: postId,
        },
        include: {
          replies: {
            include: {
              author: {
                select: {
                  id: true,
                  userName: true,
                  lastName: true,
                  firstName: true,
                  profilePicUrl: true,
                },
              },
            },
          },
          author: {
            select: {
              id: true,
              userName: true,
              lastName: true,
              firstName: true,
              profilePicUrl: true,
            },
          },
        },
      });
      if (!reply) throw new Error('Reply not found');
      const withDirectReplies = reply?.replies.filter(
        (reply) => reply.parentId === postId
      );

      return {
        ...reply,
        replies: withDirectReplies,
      };
    } catch (error) {
      throw new Error('Failed to get replies');
    }
  }
}

export default PostService;
