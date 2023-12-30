import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import cors from 'cors';
import express from 'express';
import { User } from './users';
import { Post } from './posts';
import { GraphQlContext } from '../services/interface';
import { verifyJWTUserToken } from '../services/helper';
import { dateScalar } from './posts/scalars';

const initServer = async () => {
  const app = express();
  app.use(cors());

  const server = new ApolloServer<GraphQlContext>({
    typeDefs: `

        ${User.types}
        ${Post.types}
        scalar Date

        type Query {
            ${User.queries}
            ${Post.queries}
        }

        type Mutation {
            ${Post.mutations}
        }
    `,
    resolvers: {
      Query: {
        ...User.resolvers.query,
        ...Post.resolvers.query,
      },
      Mutation: {
        ...Post.resolvers.mutation,
      },
      ...Post.resolvers.extraResolvers,
      ...Post.resolvers.extraTypes,
    },
  });
  // Note you must call `start()` on the `ApolloServer`
  // instance before passing the instance to `expressMiddleware`
  await server.start();

  // Specify the path where we'd like to mount our server
  //highlight-start
  app.use(
    '/graphql',
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }) => {
        return {
          userSignature: req.headers.authorization
            ? verifyJWTUserToken(req.headers.authorization.split('Bearer ')[1])
            : null,
        };
      },
    })
  );
  //highlight-end

  return app;
};

export default initServer;
