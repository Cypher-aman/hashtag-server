import Redis from 'ioredis';

const redisClient = new Redis(
  `redis://default:${process.env.REDIS_CLIENT_PASS}@${process.env.REDIS_HOST}:44727`
);
export default redisClient;
