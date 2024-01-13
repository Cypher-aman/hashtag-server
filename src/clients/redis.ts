import Redis from 'ioredis';

const redisClient = new Redis(
  `rediss://default:${process.env.REDIS_CLIENT_PASS}@${process.env.REDIS_HOST}`
);

export default redisClient;
