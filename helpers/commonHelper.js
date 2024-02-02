const FormData = require("form-data");
const puppeteer = require("puppeteer-extra");
const ncp = require("node-clipboardy");
const cheerio = require("cheerio");
const axios = require("axios");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const { connectDB } = require("../utils/connectMongoDb.js");

// add stealth plugin and use defaults (all evasion techniques)
const { logger } = require("../utils/logger");
const { utilityConstants } = require("../constants/appConstant");

exports.getRandomElements = (arr, count) => {
  logger.info("getRandomElements");
  const shuffled = arr.sort(() => 0.5 - Math.random()); // Shuffle the array
  return shuffled.slice(0, count); // Return the specified number of elements
};

exports.getArticleLinks = async (siteCode) => {
  const dbCon = await connectDB();
  const targetSites = dbCon.collection("target_sites");
  logger.info("getArticleLinks");
  const stagingData = await targetSites
    .find({ status: 1, siteCode: siteCode })
    .limit(10)
    .toArray();
  const ottNews = await axios.get(stagingData[0].link);
  const $ = this.getCheerio(ottNews.data);
  const links = $("a");
  return [links, $];
};

exports.createPosts = async (newsLinks) => {
  logger.info("createPosts");
  console.log(newsLinks);
  const randomNews = this.getRandomElements(
    newsLinks,
    utilityConstants.randomArticleCount
  );
  await this.getBlogDetails(randomNews);
};

exports.getCheerio = (html) => {
  logger.info("getBlogDetails");
  return cheerio.load(html);
};

exports.getBlogDetails = async (randomNews) => {
  logger.info("getBlogDetails");
  const newsPromise = [];
  const titlesArr = [];
  for (const articleLinks of randomNews) {
    const articleResp = await axios.get(articleLinks);
    const oCherio = this.getCheerio(articleResp.data);
    const newsTitle = oCherio("h1")
      .toArray()
      .map((title) => oCherio(title).text());
    let paragraphs = "<p>";
    paragraphs += oCherio("p:not([class])")
      .toArray()
      .map((p) => oCherio(p).text())
      .slice(1)
      .filter(
        (line) => !line.includes("ALSO READ:") || !line.includes("also read")
      )
      .join("\n</p><p>");
    paragraphs += "</p>";
    titlesArr.push(newsTitle[0]);
    // console.log(newsTitle[0]);
    // console.log(paragraphs);
    const rephrasedTitle = await this.rephrase(newsTitle[0], "title");
    const rephrasedPara = await this.rephrase(paragraphs, "para");
    const tags = await this.rephrase(rephrasedPara, "tags");
    logger.info(rephrasedTitle);
    logger.info(rephrasedPara);
    logger.info(tags);
  }
  console.log(newsPromise, titlesArr);
  return false;
  return [newsPromise, titlesArr];
};

exports.getWpPostConfig = (newsTitle, paragraphs) => {
  logger.info("getWpPostConfig");
  const data = new FormData();
  data.append("title", newsTitle);
  data.append("content", paragraphs);
  data.append("status", "draft");
  data.append("categories", "2");
  const config = {
    method: "post",
    url: utilityConstants.wpApiUrl,
    headers: {
      "Content-Type": "application/json",
      Authorization: utilityConstants.apiAuthKey,
      ...data.getHeaders(),
    },
    data: data,
  };
  return config;
};

const continueClick = async (page) => {
  logger.info("continueClick");
  try {
    const dSelec = "div"; // Selector for the parent <div> tag
    const buttonSelector = "button"; // Selector for the button inside the <div>
    const buttonText = "Continue"; // Text to match inside the button
    await page.waitForSelector(dSelec);
    const divHandle = await page.$(dSelec);
    const btn = await divHandle.$(buttonSelector);
    const navigationPromise = page.waitForNavigation(); // Set the navigation timeout
    await btn.click();
    await navigationPromise;
    const buttonInnerText = await page.evaluate(
      (elem) => elem.textContent,
      btn
    );
    if (buttonInnerText === buttonText) {
      await btn.click();
      logger.info(" continue Button clicked!");
      return true;
    }
    logger.info("Button not found or does not have the expected text.");
  } catch (error) {
    logger.error("Error occurred during navigation:");
  }
};
exports.rephrase = async (textToRephrase, instructionType) => {
  logger.info("rephrase");
  puppeteer.use(StealthPlugin());
  return puppeteer
    .launch({
      headless: false,
      executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    })
    .then(async (browser) => {
      const page = await browser.newPage();
      await page.goto("https://chat.openai.com/");
      const loginButton = await page.$('[data-testid="login-button"]');
      // Click the login button
      await loginButton.click();
      const userNameSelector = "input#username";
      await page.waitForSelector(userNameSelector);
      await page.type(userNameSelector, "riyajmulla16296@rediffmail.com");
      await continueClick(page);
      const passSelec = "input#password";
      await page.waitForSelector(passSelec);
      await page.type(passSelec, "Riyaj@123");
      const btnlogIn = "div >  button._button-login-password";
      await page.waitForSelector(btnlogIn);
      const logC = await page.$(btnlogIn);
      await logC.click();

      // Click on the "Next" button twice
      // for (let i = 0; i < 2; i++) {
      //   await page.waitForSelector("button.btn.relative.btn-neutral.ml-auto");
      //   await page.click("button.btn.relative.btn-neutral.ml-auto");
      //   await page.waitForTimeout(1000); // Delay of 1 second
      // }
      await page.waitForSelector(".btn-primary");
      await page.click(".btn-primary");
      await page.waitForTimeout(1000); // Delay of 1 second
      // Click on the "Done" button

      // await page.waitForSelector("button.btn.relative.btn-primary.ml-auto");
      // await page.click("button.btn.relative.btn-primary.ml-auto");
      // await page.waitForTimeout(1000); // Delay of 1 second

      // for (const val of textToRephrase) {
      const textareaId = "prompt-textarea";
      let timeOut = 3000;
      let instruction = null;
      if (instructionType === "para") {
        instruction =
          " Act as a experienced entertainment news article writer ,summerize  given article and strictly follow below rules\n paragraph should be a catchy\n1.paragraph should have maximum SEO score\n2.paragraph should have maximum 60 words\n3.use less complex words\n4.use shorten sentence which have max 15-18 words only\n5.article should have 9% passive voice only.\n 6.dont use koimoi,ottplay,pinkvilla \n below is the text to summerize  \n";
        timeOut = 3000;
      }
      if (instructionType === "title") {
        instruction =
          "Act as a experienced entertainment news article  writer and rewrite given headline and strictly follow below given rules \n  1. headline should be a catchy\n2. headline should be seo friendly\n3. headline should contain maximum 7 words only \n4. headline should have positive sentiment\b 5. headline should have power words\n 6. headline should drive more clicks\n7. headline should in single line \n below is the headline to rewrite \n";
        timeOut = 2000;
      }
      if (instructionType === "tags") {
        instruction =
          "Act as a experienced entertainment news article writer and give me only 25 comma separated tags for given content ";
        timeOut = 3000;
      }

      const clipboardContent = `${instruction} - ${textToRephrase}`;
      const textareaSelector = `textarea#${textareaId}`;
      await page.waitForSelector(textareaSelector); // Wait for the textarea to appear
      await page.focus(textareaSelector);
      // Paste the clipboard content into the textarea using a DOM manipulation function
      await page.evaluate(
        (textareaSelector, clipboardContent) => {
          const textarea = document.querySelector(textareaSelector);
          textarea.value = clipboardContent;
        },
        textareaSelector,
        clipboardContent
      );
      await page.type(textareaSelector, " ");
      // click on generate
      // const loginButton = await page.$('[data-testid="login-button"]');

      const buttonSelector = '[data-testid="send-button"]'; // Replace with the actual selector of the button
      await page.waitForSelector(buttonSelector, {
        visible: true,
        enabled: true,
      });
      await page.click(buttonSelector);
      // click on copy
      await page.waitForTimeout(timeOut);

      // isTitle ? await page.waitForTimeout(2000) : await page.waitForTimeout(10000); // Delay of 1 second
      const cb = ".text-gray-400 span button"; // Replace with the actual selector of the button
      await page.waitForSelector(cb, {
        visible: true,
        // enabled: true,
        // timeout: 0,
      });
      await page.click(cb);
      await browser.close();
      return await ncp.read();
    });
};

exports.rephraseEdge = async (textToRephrase, instructionType) => {
  logger.info("rephrase");
  puppeteer.use(StealthPlugin());
  return puppeteer
    .launch({
      headless: false,
      executablePath:
        "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    })
    .then(async (browser) => {
      const page = await browser.newPage();
      await page.goto(
        "https://www.bing.com/search?q=Bing&showconv=1&FORM=HDRSC2"
      );
      const textareaId = "searchbox";
      let timeOut = 5000;
      let instruction = null;
      if (instructionType === "para") {
        instruction =
          " Act as a experienced entertainment news article writer to rewrite given text and strictly follow below given rules\n paragraphs should be a catchy\n1.paragraphs should have maximum SEO score\n2.paragraphs should have minimum 400 words\n3.use less complex words\n4.use shorten sentence which have max 15-18 words only\n5.article should have 9% passive voice only.\n5.Create list whenever if content requires list and pointer\n 6.dont use koimoi,ottplay,pinkvilla \n below is the text to rewrite \n";
        timeOut = 10000;
      }
      if (instructionType === "title") {
        instruction =
          "Act as a experienced entertainment news article  writer and rewrite given headline and strictly follow below given rules \n  1. headline should be a catchy\n2. headline should be seo friendly\n3. headline should contain maximum 7 words only \n4. headline should have positive sentiment\b 5. headline should have power words\n 6. headline should drive more clicks\n7. headline should in single line \n below is the text to rewrite \n";
        timeOut = 2000;
      }
      if (instructionType === "tags") {
        instruction =
          "Act as a experienced entertainment news article writer and give me only 25 comma separated tags for given content ";
        timeOut = 3000;
      }
      await page.waitForSelector(".button-compose-wrapper");
      await page.click(".button-compose-wrapper .button-compose");
      await page.waitForTimeout(3000);
      // const clipboardContent = `${instruction} - ${textToRephrase}`;
      // const textareaSelector = `textarea#${textareaId}`;
      // await page.waitForSelector(textareaSelector); // Wait for the textarea to appear
      // await page.focus(textareaSelector);
      // // Paste the clipboard content into the textarea using a DOM manipulation function
      // await page.evaluate((textareaSelector, clipboardContent) => {
      //   const textarea = document.querySelector(textareaSelector);
      //   textarea.value = clipboardContent;
      // }, textareaSelector, clipboardContent);
      // await page.type(textareaSelector, ' ');
      // const buttonSelector = 'div.control.submit button'; // Replace with the actual selector of the button
      // await page.waitForSelector(buttonSelector, { visible: true, enabled: true });
      // await page.click(buttonSelector);
      // // click on copy
      // await page.waitForTimeout(timeOut);
      // const cb = 'button[type="button"][role="button"][aria-label="Copy"]'; // Replace with the actual selector of the button
      // await page.waitForSelector(cb, { visible: true, enabled: true, timeout: 0 });
      // await page.click(cb);
      // await browser.close();
      // return await ncp.read();
      //   const chatSelector = 'li#b-scopeListItem-conv';
      //   await page.waitForSelector(chatSelector);
      //   const chatC = await page.$(chatSelector);
      //   await chatC.click();
    });
  return false;
};
