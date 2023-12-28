import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import cors from 'cors';
import express from 'express';
import { User } from './users';

const initServer = async () => {
  const app = express();
  app.use(cors());

  const server = new ApolloServer({
    typeDefs: `

        ${User.types}
        type Query {
            ${User.queries}
        }
    `,
    resolvers: {
      Query: {
        ...User.resolvers.query,
      },
    },
  });
  // Note you must call `start()` on the `ApolloServer`
  // instance before passing the instance to `expressMiddleware`
  await server.start();

  // Specify the path where we'd like to mount our server
  //highlight-start
  app.use('/graphql', express.json(), expressMiddleware(server));
  //highlight-end

  return app;
};

export default initServer;
