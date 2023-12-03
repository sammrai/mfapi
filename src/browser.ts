import puppeteer, {
  LaunchOptions,
  BrowserLaunchArgumentOptions,
  BrowserConnectOptions,
  Page,
  Product,
} from "puppeteer-core";

export async function setupBrowser(): Promise<Page> {
  const puppeteerOptions: LaunchOptions &
    BrowserLaunchArgumentOptions &
    BrowserConnectOptions & {
      product?: Product;
      extraPrefsFirefox?: Record<string, unknown>;
    } = {
    headless: true,
    slowMo: 100,
    executablePath: "/usr/bin/chromium-browser",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--single-process", // <- this one doesn't works in Windows
      "--disable-gpu",
    ],
  };

  const browser = await puppeteer.launch(puppeteerOptions);
  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:70.0) Gecko/20100101 Firefox/70.0"
  );
  return page;
}
