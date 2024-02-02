const puppeteer = require('puppeteer-extra');
var ncp = require('node-clipboardy');

// add stealth plugin and use defaults (all evasion techniques)
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

const continueClick = async (page) => {
  try {
    const dSelec = 'div'; // Selector for the parent <div> tag
    const buttonSelector = 'button'; // Selector for the button inside the <div>
    const buttonText = 'Continue'; // Text to match inside the button

    await page.waitForSelector(dSelec);
    const divHandle = await page.$(dSelec);
    const btn = await divHandle.$(buttonSelector);

    const navigationPromise = page.waitForNavigation({ timeout: 5000 }); // Set the navigation timeout
    await btn.click();
    await navigationPromise;

    const buttonInnerText = await page.evaluate((elem) => elem.textContent, btn);

    if (buttonInnerText === buttonText) {
      await btn.click();
      console.log(' continue Button clicked!');
      return true;
    }
    console.log('Button not found or does not have the expected text.');
  } catch (error) {
    console.log('Error occurred during navigation:', error);
  }
};


// puppeteer usage as normal
puppeteer.launch({ headless: false, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' }).then(async (browser) => {
  const page = await browser.newPage();
  await page.goto('https://chat.openai.com/'); // Replace with the URL of your target page

  const login = 'button > div'; // Selector for the <div> inside the button
  const loginText = 'Log in'; // Text to match inside the <div>

  await page.waitForSelector(login);

  const buttonHandle = await page.$(login);
  const divText = await page.evaluate((element) => element.textContent, buttonHandle);

  if (divText === loginText) {
    await buttonHandle.click();
    console.log('Button clicked!');
  } else {
    console.log('Button not found or does not have the expected text.');
  }

  const userNameSelector = 'input#username';

  await page.waitForSelector(userNameSelector);
  await page.type(userNameSelector, 'riyajmulla16296@rediffmail.com');
  await continueClick(page);
  const passSelec = 'input#password';

  await page.waitForSelector(passSelec);
  await page.type(passSelec, 'Riyaj@123');
  const btnlogIn = 'button._button-login-password'; // Selector for the button with class 'test'
  await page.waitForSelector(btnlogIn);

  const logC = await page.$(btnlogIn);

  await logC.click();

  const textareaId = 'prompt-textarea'; // Replace with the actual ID of the textarea
  const textToEnter = 'rephrase this  : Riyaj is good boy';

  const textareaSelector = `textarea#${textareaId}`;

  await page.waitForSelector(textareaSelector); // Wait for the textarea to appear
  await page.type(textareaSelector, textToEnter);

  const buttonSelector = 'button.absolute.p-1'; // Replace with the actual selector of the button
  await page.waitForSelector(buttonSelector, { visible: true, enabled: true });
  await page.click(buttonSelector);

  const cb = 'button.flex.ml-auto.gap-2'; // Replace with the actual selector of the button
  await page.waitForSelector(cb, { visible: true, enabled: true });
  await page.click(cb);
  const text = await ncp.read();

  console.log('Text from clipboard:', text);
  return false;
//   const divSelector = 'div.prose.w-full'; // Replace with the actual selector of the div

//   const paragraphTexts = await page.evaluate((div2) => {
//     const div = document.querySelector(div2);
//     const paragraphs = Array.from(div.querySelectorAll('p.markdown'));
//     const invisibleSpan = div.querySelector('span.invisible');
//     console.log(22222222222);
//     console.log(paragraphs);
//     let stopIndex = paragraphs.length;
//     if (invisibleSpan) {
//       const spanParent = invisibleSpan.parentNode;
//       stopIndex = paragraphs.indexOf(spanParent);
//     }

//     const filteredTexts = paragraphs.slice(0, stopIndex).map((p) => p.textContent);
//     return filteredTexts;
//   }, divSelector);

//   console.log(paragraphTexts);
});
