import { Post } from '@prisma/client';
import { db } from '../../clients/db';
import { GraphQlContext } from '../../services/interface';
import { dateScalar } from './scalars';

interface CreatePostInput {
  content: string;
  imageUrl?: string;
}

const extraTypes = {
  Date: dateScalar,
};
const query = {
  getAllPosts: async () => {
    return await db.post.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  },
};

const mutation = {
  createPost: async (
    parent: any,
    { payload }: { payload: CreatePostInput },
    ctx: GraphQlContext
  ) => {
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
  },
};

const extraResolvers = {
  Post: {
    author: async (parent: Post) => {
      return await db.user.findUnique({
        where: {
          id: parent.authorId,
        },
      });
    },
  },
};

export const resolvers = { mutation, query, extraResolvers, extraTypes };
