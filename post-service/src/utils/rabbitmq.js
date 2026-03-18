import amqb from "amqplib";
import logger from "../utils/logger.js";

let connection = null;
let channel = null;

const EXCHANGE_NAME = "facebook_events";

export async function connectToRabbitMQ() {
  try {
    const connection = await amqb.connect(process.env.RABBITMQ_URL);
    const channel = await connection.createChannel();
    await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: false });
    logger.info("rabbitmq connected success");
    return channel;
  } catch (err) {
    logger.error("error connecting rabbitmq", err);
  }
}
