const axios = require("axios");
const { connectDB } = require("./utils/connectMongoDb.js");
const { logger } = require("./utils/logger");
const { utilityConstants } = require("./constants/appConstant.js");
const {
  getRandomElements,
  getCheerio,
  getBlogDetails,
  getArticleLinks,
  createPosts,
} = require("./helpers/commonHelper.js");

const getToiNews = async () => {
  try {
    const startTime = performance.now();
    const dbCon = await connectDB();
    const targetSites = dbCon.collection("target_sites");
    logger.info("service:getToiNews");
    const stagingData = await targetSites
      .find({ status: 1, siteCode: "tim" })
      .limit(10)
      .toArray();
    const news = await axios.get(stagingData[0].link);
    const $ = getCheerio(news.data);
    const links = $("a");
    const newsLinks = [];
    // console.log(links)
    links.map((key, val) => {
      const link = $(val).attr("href");
      if (
        link &&
        !newsLinks.includes(link) &&
        link.includes("news/") &&
        (link.match(/-/g) || []).length >= 6 &&
        link.startsWith("/entertainment")
      ) {
        const finalLink = link.replace(/\/entertainment/g, stagingData[0].link);
        newsLinks.push(finalLink);
      }
    });
    const randomNews = getRandomElements(
      newsLinks,
      utilityConstants.randomArticleCount
    );
    const [newsPromise, titlesArr] = await getBlogDetails(randomNews);
    // return false;
    const apiResponse = (await Promise.all(newsPromise)).map(
      (wpRespData) => wpRespData.status
    );
    const endTime = `${performance.now() - startTime} MS`;
    logger.info({
      wpResponse: apiResponse,
      timeTake: endTime,
      originalTitle: titlesArr,
    });
  } catch (err) {
    logger.error(err);
  }
};

const getVogueNews = async () => {
  try {
    const startTime = performance.now();
    const dbCon = await connectDB();
    const targetSites = dbCon.collection("target_sites");
    logger.info("service:getVogueNews");
    const stagingData = await targetSites
      .find({ status: 1, siteCode: "vog" })
      .limit(10)
      .toArray();
    const news = await axios.get(stagingData[0].link);
    const $ = getCheerio(news.data);
    const links = $("a");
    const newsLinks = [];
    // console.log(links)
    links.map((key, val) => {
      const link = $(val).attr("href");
      // if (link && !newsLinks.includes(link) && link.includes('news/') && (link.match(/-/g) || []).length >= 6 && link.startsWith('/entertainment')) {
      if (
        link &&
        !newsLinks.includes(link) &&
        link.includes("content/") &&
        (link.match(/-/g) || []).length >= 6
      ) {
        const finalLink = `${stagingData[0].link}${link})`;
        if (!newsLinks.includes(finalLink)) {
          newsLinks.push(finalLink);
        }
      }
    });
    const randomNews = getRandomElements(
      newsLinks,
      utilityConstants.randomArticleCount
    );
    const [newsPromise, titlesArr] = await getBlogDetails(randomNews);
    const apiResponse = (await Promise.all(newsPromise)).map(
      (wpRespData) => wpRespData.status
    );
    const endTime = `${performance.now() - startTime} MS`;
    logger.info({
      wpResponse: apiResponse,
      timeTake: endTime,
      originalTitle: titlesArr,
    });
  } catch (err) {
    logger.error(err);
  }
};

const getRottenTomatoNews = async () => {
  try {
    const startTime = performance.now();
    const dbCon = await connectDB();
    const targetSites = dbCon.collection("target_sites");
    logger.info("service:getRottenTomatoNews");
    const stagingData = await targetSites
      .find({ status: 1, siteCode: "rot" })
      .limit(10)
      .toArray();
    const news = await axios.get(stagingData[0].link);
    const $ = getCheerio(news.data);
    const links = $("a");
    const newsLinks = [];
    // console.log(links)
    links.map((key, val) => {
      const link = $(val).attr("href");
      if (link && !newsLinks.includes(link) && link.includes("article")) {
        newsLinks.push(link);
      }
    });
    // console.log(newsLinks)
    // return false
    const randomNews = getRandomElements(
      newsLinks,
      utilityConstants.randomArticleCount
    );
    const [newsPromise, titlesArr] = await getBlogDetails(randomNews);
    return false;
    const apiResponse = (await Promise.all(newsPromise)).map(
      (wpRespData) => wpRespData.status
    );
    const endTime = `${performance.now() - startTime} MS`;
    logger.info({
      wpResponse: apiResponse,
      timeTake: endTime,
      originalTitle: titlesArr,
    });
  } catch (err) {
    logger.error(err);
  }
};

// active functions
const getOttNews = async () => {
  try {
    const startTime = performance.now();
    const [links, $] = await getArticleLinks("ott");
    const newsLinks = [];
    links.map((key, val) => {
      const link = $(val).attr("href");

      if (
        typeof link === "string" &&
        link.includes("news/") &&
        !newsLinks.includes(link)
      ) {
        newsLinks.push($(val).attr("href"));
      }
    });
    await createPosts(newsLinks);
    const endTime = `${performance.now() - startTime} MS`;
    return true;
  } catch (err) {
    logger.error(err);
  }
};

const getHtNews = async () => {
  try {
    const startTime = performance.now();
    const [links, $] = await getArticleLinks("hin");
    const newsLinks = [];
    links.map((key, val) => {
      const link = $(val).attr("href");
      if (link.startsWith("/entertainment") && link.endsWith("html")) {
        const finalLink = $(val)
          .attr("href")
          .replace(
            /\/entertainment/g,
            "https://www.hindustantimes.com/entertainment"
          );
        if (!newsLinks.includes(finalLink)) {
          newsLinks.push(finalLink);
        }
      }
    });
    const [apiResponse, titlesArr] = await createPosts(newsLinks);
    const endTime = `${performance.now() - startTime} MS`;
    return {
      wpResponse: apiResponse,
      timeTake: endTime,
      originalTitle: titlesArr,
    };
  } catch (err) {
    logger.error(err);
  }
};

const getGqNews = async () => {
  try {
    const startTime = performance.now();
    const [links, $] = await getArticleLinks("gqi");
    const newsLinks = [];
    const baseUrl = "https://www.gqindia.com";
    links.map((key, val) => {
      let link = $(val).attr("href");
      const hyphenCount = (link.match(/-/g) || []).length;
      if (link.startsWith("/content") && hyphenCount >= 7) {
        link = link.replace(/\/content/g, `${baseUrl}/content`);
        if (!newsLinks.includes(link)) {
          console.log(link);
          newsLinks.push(link);
        }
      }
    });
    const [apiResponse, titlesArr] = await createPosts(newsLinks);
    const endTime = `${performance.now() - startTime} MS`;
    return {
      wpResponse: apiResponse,
      timeTake: endTime,
      originalTitle: titlesArr,
    };
  } catch (err) {
    logger.error(err);
  }
};

const getGqBingeNews = async () => {
  try {
    const startTime = performance.now();
    const dbCon = await connectDB();
    const [links, $] = await getArticleLinks("gqb");
    const newsLinks = [];
    links.map((key, val) => {
      const link = $(val).attr("href");
      if (
        link &&
        !newsLinks.includes(link) &&
        link.includes("/binge-watch/collection/")
      ) {
        newsLinks.push(link);
      }
    });
    const [apiResponse, titlesArr] = await createPosts(newsLinks);
    const endTime = `${performance.now() - startTime} MS`;
    return {
      wpResponse: apiResponse,
      timeTake: endTime,
      originalTitle: titlesArr,
    };
  } catch (err) {
    logger.error(err);
  }
};

const getPinkvillaNews = async () => {
  try {
    const startTime = performance.now();
    const [links, $] = await getArticleLinks("pin");
    const newsLinks = [];
    // console.log(links)
    links.map((key, val) => {
      const link = $(val).attr("href");
      if (
        link &&
        !newsLinks.includes(link) &&
        link.includes("/entertainment/") &&
        /^.*(\d)$/.test(link)
      ) {
        newsLinks.push(link);
      }
    });
    const [apiResponse, titlesArr] = await createPosts(newsLinks);
    const endTime = `${performance.now() - startTime} MS`;
    return {
      wpResponse: apiResponse,
      timeTake: endTime,
      originalTitle: titlesArr,
    };
  } catch (err) {
    logger.error(err);
  }
};

const getKoiMoiNews = async () => {
  try {
    const startTime = performance.now();
    const [links, $] = await getArticleLinks("koi");

    const newsLinks = [];
    // console.log(links)
    links.map((key, val) => {
      const link = $(val).attr("href");
      if (
        link &&
        !newsLinks.includes(link) &&
        link.includes("news", "reviews", "movies") &&
        (link.match(/-/g) || []).length >= 6
      ) {
        newsLinks.push(link);
      }
    });
    const [apiResponse, titlesArr] = await createPosts(newsLinks);
    const endTime = `${performance.now() - startTime} MS`;
    return {
      wpResponse: apiResponse,
      timeTake: endTime,
      originalTitle: titlesArr,
    };
  } catch (err) {
    logger.error(err);
  }
};

const getIndianExpNews = async () => {
  try {
    const startTime = performance.now();
    const [links, $] = await getArticleLinks("ind");
    const newsLinks = [];
    // console.log(links)
    links.map((key, val) => {
      const link = $(val).attr("href");
      if (
        link &&
        !newsLinks.includes(link) &&
        link.includes("entertainment") &&
        (link.match(/-/g) || []).length >= 6
      ) {
        newsLinks.push(link);
      }
    });
    const [apiResponse, titlesArr] = await createPosts(newsLinks);
    const endTime = `${performance.now() - startTime} MS`;
    return {
      wpResponse: apiResponse,
      timeTake: endTime,
      originalTitle: titlesArr,
    };
  } catch (err) {
    logger.error(err);
  }
};

const getFilmCompanionNews = async () => {
  try {
    const startTime = performance.now();
    const [links, $] = await getArticleLinks("fil");
    const newsLinks = [];
    // console.log(links)
    links.map((key, val) => {
      const link = $(val).attr("href");
      if (
        link &&
        !newsLinks.includes(link) &&
        /(news\/|\/interviews\/|reviews\/)/.test(link) &&
        (link.match(/-/g) || []).length >= 6
      ) {
        newsLinks.push(link);
      }
    });
    const [apiResponse, titlesArr] = await createPosts(newsLinks);
    const endTime = `${performance.now() - startTime} MS`;
    return {
      wpResponse: apiResponse,
      timeTake: endTime,
      originalTitle: titlesArr,
    };
  } catch (err) {
    logger.error(err);
  }
};

// const webMap = {
//   ott: getOttNews(),
//   hin: getHtNews(),
//   gqi: getGqNews(),
//   gqb: getGqBingeNews(),
//   pin: getPinkvillaNews(),
//   koi: getKoiMoiNews(),
//   ind: getIndianExpNews(),
//   fil: getFilmCompanionNews(),
// };
// const targetFuncArr = [getOttNews(), getHtNews(), getGqNews(), getGqBingeNews(), getPinkvillaNews(), getKoiMoiNews(), getIndianExpNews(), getFilmCompanionNews()];

const executeSequentially = async () => {
  try {
    const allResponses = [];
    allResponses.push(
      await getOttNews()
      // await getHtNews(),
      // await getGqNews(),
      // await getGqBingeNews(),
      // await getPinkvillaNews(),
      // await getKoiMoiNews(),
      // await getIndianExpNews(),
      // await getFilmCompanionNews()
    );
    logger.info("All functions executed successfully.");
    logger.info(allResponses);
  } catch (err) {
    logger.error(err);
  }
};

// Promise.all([getOttNews()]);

executeSequentially().then((resp) => {
  logger.error(resp);
});
