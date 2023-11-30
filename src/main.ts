import fs from "fs";
import { Config } from "./config";
import { checkAndLogin } from "./authentication";
import { Asset } from "./actions/asset";
import { Account, AccountCategory } from "./actions/account";
// import { Account } from "./actions/account";

async function main() {
  const configPath = process.env.CONFIG_PATH ?? "config.json";
  const config: Config = JSON.parse(fs.readFileSync(configPath, "utf8"));

  // セッションを取得
  const session = await checkAndLogin(config);

  // 取引内容を追加
  const asset = new Asset(session);
  await asset.addTransaction("テスト内容", 100);

  // 口座を制御
  const account = new Account(session);
  await account.addManualAccount(AccountCategory.OtherAssets, "testaccount");
  const a = await account.getManualAccounts();
  console.log(a);
  await account.deleteAccount(a[0].id);
}

(async () => {
  try {
    await main();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
