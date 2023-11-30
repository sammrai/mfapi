import { Page } from 'puppeteer-core'
import { Config } from './config'
import fs from 'fs'
import { setupBrowser } from './browser'

export async function login(config: Config, page: Page):Promise<LoginSession> {
  await page.goto('https://moneyforward.com/users/sign_in')
  await new Promise((resolve) => setTimeout(resolve, 3000))

  // login
  const mailAddress = config.moneyforward.mail_address
  const password = config.moneyforward.password
  await page
    .waitForXPath('//*[@id="mfid_user[email]"]', {
      visible: true,
    })
    .then((el) => el?.type(mailAddress))
  await page
  .waitForXPath('//*[@id="mfid_user[password]"]', {
      visible: true,
    })
    .then((el) => el?.type(password))
  await new Promise((resolve) => setTimeout(resolve, 1000))

  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle0' }),
    page.waitForSelector('#submitto', { visible: true }).then((el) => el?.click())
  ]);

  // get csrf token
  const csrfToken = await page.evaluate(() => {
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    return metaTag ? metaTag.getAttribute('content') : null;
  });

  // get cookies
  const cookies = await page.cookies();

  const result = {
    'csrf-token': csrfToken,
    'cookie': cookies
  };

  return result;

}

export async function checkAndLogin(config: Config):Promise<LoginSession> {
  const session_file = '/data/session.json';
  try {
    const data = fs.readFileSync(session_file, 'utf8');
    console.log(`Load ${session_file}`);

    return JSON.parse(data);
  } catch (error) {
    console.log('Login...')
    const page = await setupBrowser()
    const ret = await login(config, page);
    await page.browser().close()

    const jsonContent = JSON.stringify(ret, null, 2);
    fs.writeFile(session_file, jsonContent, 'utf8', (err) => {
      if (err) {
        console.log(`ERROR: Failed to write ${session_file}`, err);
      } else {
        console.log(`SUCCESS: Wrote to ${session_file}`);
      }
    });
    return ret;
  }
  
}

export interface LoginSession {
  'csrf-token': string | null;
  'cookie': any[];
}