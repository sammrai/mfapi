import { ApiResponseHandler } from "./api";

export enum AccountCategory {
  Bank = 2, // 銀行
  Securities = 3, // 証券
  InvestmentTrust = 4, // 投信
  CryptoFXMetals = 5, // 暗号資産・FX・貴金属
  Card = 6, // カード
  Pension = 7, // 年金
  EMoneyPrepaid = 8, // 電子マネー・プリペイド
  Points = 9, // ポイント
  OnlineShopping = 12, // 通販
  Supermarket = 16, // スーパー
  OtherAssets = 14, // その他保有資産
}

export interface ManualAccount {
  name: string;
  id: string;
  subAccountIdHash: string | null;
}

export default AccountCategory;

export class Account extends ApiResponseHandler {
  public async addManualAccount(category: AccountCategory, name: string) {
    const postData = {
      "new_manual_account[category_id]": category,
      "new_manual_account[name]": name,
    };

    return this.handleRequest("/accounts/manual_account", postData);
  }

  public async getManualAccounts(): Promise<ManualAccount[]> {
    const accounts = await this.fetchData("/accounts", ($) => {
      const results: { name: string; id: string }[] = [];
      const cssSelector = "section.manual_accounts tr td:first-child a";

      $(cssSelector).each((_, el) => {
        const elem = el;
        const name = $(elem).text().trim();
        const href = $(elem).attr("href") || "";
        const id = href.split("/").pop() || "";
        results.push({ name, id });
      });

      return results;
    });

    // 各アカウントに対して getSubAccountIdHash を非同期的に呼び出す
    const enrichedAccounts = await Promise.all(
      accounts.map(async (account) => {
        const subAccountIdHash = await this.getSubAccountIdHash(account.id);
        return { ...account, subAccountIdHash };
      })
    );

    return enrichedAccounts;
  }

  public async getSubAccountIdHash(accountId: string): Promise<string | null> {
    const url = `/accounts/show_manual/${accountId}`;

    return this.fetchData(url, ($) => {
      const value =
        $("#user_asset_det_sub_account_id_hash > option")
          .first()
          .attr("value") || null;
      return value;
    });
  }

  public async deleteAccount(accountIdHash: string) {
    const postData = {
      _method: "delete",
      account_id_hash: accountIdHash,
    };

    return this.handleRequest("/accounts", postData);
  }
}
