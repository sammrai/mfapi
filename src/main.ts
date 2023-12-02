import fs from "fs";
import { Config } from "./config";
import { checkAndLogin } from "./authentication";
// import { Asset } from "./actions/asset";
// import { Account, AccountCategory } from "./actions/account";
import { Account } from "./actions/account";
import { Portfolio, AssetSubclass } from "./actions/portfolio";

async function main() {
  const configPath = process.env.CONFIG_PATH ?? "config.json";
  const config: Config = JSON.parse(fs.readFileSync(configPath, "utf8"));

  // セッションを取得
  const session = await checkAndLogin(config);

  // 取引内容を追加
  // const asset = new Asset(session);
  // await asset.addTransaction("テスト内容", 100);

  // アカウント作成・一覧
  const account = new Account(session);
  // await account.addManualAccount(AccountCategory.OtherAssets, "xxx");
  const manualAccounts = await account.getManualAccounts();
  console.log(manualAccounts);

  // 資産追加・一覧・削除
  const portfolio = new Portfolio(session);
  await portfolio.addPortfolio(
    manualAccounts[0],
    AssetSubclass.Cash,
    `Cash${AssetSubclass.Cash}`,
    100
  );
  const portfolios = await portfolio.getPortfolios(manualAccounts[0]);
  console.log(portfolios.length);
  // await portfolio.deletePortfolio(portfolios[0]);
}

(async () => {
  try {
    await main();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
