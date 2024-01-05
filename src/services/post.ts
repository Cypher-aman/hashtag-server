import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { db } from '../clients/db';
import { GraphQlContext } from '../utils/interface';

const s3CLient = new S3Client({});

interface CreatePostInput {
  content: string;
  imageUrl?: string;
}

class PostService {
  static async getAllPosts() {
    return await db.post.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  static async getUserPosts(userName: string) {
    if (!userName) {
      return null;
    }
    return await db.post.findMany({
      where: {
        author: {
          userName,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
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
}

export default PostService;
