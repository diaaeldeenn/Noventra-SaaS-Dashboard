import { redisClient } from "./redis.db.js";

export const set = async ({ key, value, ttl } = {}) => {
  try {
    const data = typeof value === "string" ? value : JSON.stringify(value);
    return ttl
      ? await redisClient.set(key, data, { EX: ttl })
      : await redisClient.set(key, data);
  } catch (error) {
    console.log("error to set data in redis", error);
  }
};

export const update = async ({ key, value } = {}) => {
  try {
    if (!(await redisClient.exists(key))) {
      return 0;
    }
    const data = typeof value === "string" ? value : JSON.stringify(value);
    return await redisClient.set(key, data);
  } catch (error) {
    console.log("error to update data in redis", error);
  }
};

export const get = async (key) => {
  try {
    try {
      return JSON.parse(await redisClient.get(key));
    } catch (error) {
      return await redisClient.get(key);
    }
  } catch (error) {
    console.log("error to get data in redis", error);
  }
};

export const exists = async (key) => {
  try {
    return await redisClient.exists(key);
  } catch (error) {
    console.log("error to check data exists in redis", error);
  }
};

export const ttl_redis = async (key) => {
  try {
    return await redisClient.ttl(key);
  } catch (error) {
    console.log("error to get ttl from redis", error);
  }
};

export const deleteKey = async (key) => {
  try {
    return await redisClient.del(key);
  } catch (error) {
    console.log("error to delete data in redis", error);
  }
};

export const keys = async (pattern) => {
  try {
    return await redisClient.keys(`${pattern}*`);
  } catch (error) {
    console.log("error to get keys from redis", error);
  }
};

export const incr = async (key) => {
  try {
    return await redisClient.incr(key);
  } catch (error) {
    console.log("error to incr operation", error);
  }
};
