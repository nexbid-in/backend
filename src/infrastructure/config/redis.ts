import IORedis from "ioredis";
import { logger } from "../logging/logger";


const redis = new IORedis({
    host:process.env.REDIS_HOST,
    port:Number(process.env.REDIS_PORT ?? 6379),
    maxRetriesPerRequest:null
});


redis.on('connect',() => {
    logger.info("Redis connected")
});

redis.on("error",(err) => {
    logger.error(`Redis Error ${err}`)
});

process.on("SIGINT", async ()=>{
    logger.info("Closing redis")
    await redis.quit()
    process.exit(0)
});

export default redis;