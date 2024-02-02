const { MongoClient } = require("mongodb");
const { logger } = require("./logger");
const { utilityConstants } = require("../constants/appConstant");

const client = new MongoClient(utilityConstants.dbUrl);
const crickDbClient = new MongoClient(utilityConstants.crickScrapData);
console.log("db_url ---", utilityConstants.dbUrl);

exports.connectCrickDB = async () => {
  try {
    await client.connect();
    console.log(`${"crickData"} --- db Connected successfully to server`);
    return client.db("crickData");
  } catch (error) {
    logger.error(error);
  }
};

exports.connectDB = async () => {
  try {
    await client.connect();
    console.log(
      `${"silver_screen_spot"} --- db Connected successfully to server`
    );
    return client.db("silver_screen_spot");
  } catch (error) {
    logger.error(error);
  }
};
