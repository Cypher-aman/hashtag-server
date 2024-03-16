"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("@apollo/server");
const express4_1 = require("@apollo/server/express4");
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const users_1 = require("./users");
const posts_1 = require("./posts");
const helper_1 = require("../utils/helper");
const initServer = () => __awaiter(void 0, void 0, void 0, function* () {
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)());
    app.use('/health', (req, res) => res.status(200).send('OK'));
    const server = new server_1.ApolloServer({
        typeDefs: `

        ${users_1.User.types}
        ${posts_1.Post.types}
        scalar Date

        type Query {
            ${users_1.User.queries}
            ${posts_1.Post.queries}
        }

        type Mutation {
            ${posts_1.Post.mutations}
            ${users_1.User.mutations}
        }
    `,
        resolvers: Object.assign(Object.assign(Object.assign({ Query: Object.assign(Object.assign({}, users_1.User.resolvers.query), posts_1.Post.resolvers.query), Mutation: Object.assign(Object.assign({}, posts_1.Post.resolvers.mutation), users_1.User.resolvers.mutations) }, posts_1.Post.resolvers.extraResolvers), posts_1.Post.resolvers.extraTypes), users_1.User.resolvers.extraResolvers),
    });
    // Note you must call `start()` on the `ApolloServer`
    // instance before passing the instance to `expressMiddleware`
    yield server.start();
    // Specify the path where we'd like to mount our server
    //highlight-start
    app.use('/graphql', express_1.default.json(), (0, express4_1.expressMiddleware)(server, {
        context: ({ req }) => __awaiter(void 0, void 0, void 0, function* () {
            return {
                userSignature: req.headers.authorization
                    ? (0, helper_1.verifyJWTUserToken)(req.headers.authorization.split('Bearer ')[1])
                    : null,
            };
        }),
    }));
    //highlight-end
    return app;
});
exports.default = initServer;
