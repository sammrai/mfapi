import { ApiResponseHandler } from "./api";

export enum AssetSubclass {
  // 預金・現金・暗号資産
  Cash = 49, // 現金
  ElectronicMoney = 50, // 電子マネー
  OrdinaryDeposit = 1, // 普通預金
  TimeDeposit = 2, // 定期預金
  AccumulationTimeDeposit = 69, // 積立定期預金 //非対応
  ForeignCurrencyDeposit = 3, // 外貨預金 // 非対応
  DepositoryMoney_MRF = 5, // 預り金・MRF
  Deposit_Margin = 51, // 保証金・証拠金
  Cryptocurrency = 66, // 暗号資産
  OtherDeposits = 6, // その他預金

  // 株式（現物）
  DomesticStock = 14, // 国内株
  USStock = 15, // 米国株
  ChinaStock = 16, // 中国株
  ForeignStock = 55, // 外国株
  UnlistedStock = 56, // 未公開株式
  OtherStocks = 17, // その他株式

  // 株式（信用）
  CreditMargin_Deposit = 62, // 保証金・証拠金（信用） //非対応
  DomesticStock_Credit = 57, // 国内株（信用） //非対応
  USStock_Credit = 58, // 米国株（信用）
  ChinaStock_Credit = 59, // 中国株（信用）
  ForeignStock_Credit = 60, // 外国株（信用） //非対応
  OtherStocks_Credit = 61, // その他株式（信用）

  // 投資信託
  InvestmentTrust = 12, // 投資信託
  ForeignInvestmentTrust = 52, // 外国投資信託
  MidTermGovernmentBondFund = 53, // 中期国債ファンド
  MMF = 54, // MMF
  ForeignCurrencyMMF = 4, // 外貨MMF
  OtherInvestmentTrust = 13, // その他投信

  // 債券
  GovernmentBond = 7, // 国債
  CorporateBond = 8, // 社債
  ForeignBond = 9, // 外債
  StructuredBond = 10, // 仕組み債
  OtherBonds = 11, // その他債券
  SocialLending = 67, // ソーシャルレンディング

  // FX
  FXMargin = 64, // 証拠金（FX）
  OverTheCounterFX = 18, // 店頭FX
  Click365 = 19, // くりっく365
  OsakaFX = 20, // 大証FX
  OtherFX = 21, // その他FX

  // 先物OP
  FuturesOPMargin = 63, // 証拠金（先物OP）
  IndexFutures = 22, // 指数先物
  IndexOP = 23, // 指数OP
  CFD = 24, // CFD
  ClickStock365 = 25, // くりっく株365
  CommodityFutures = 26, // 商品先物
  OtherFuturesOP = 27, // その他先物OP

  // ストックオプション
  DomesticStock_StockOption = 70, // 国内株（ストックオプション） //非対応

  // 保険
  AccumulationTypeInsurance = 32, // 積立型保険 //非対応

  // 不動産
  Building_Home = 28, // 建物（自宅）
  Building_InvestmentBusiness = 29, // 建物（投資・事業用）//非対応
  Land_Home = 30, // 土地（自宅）
  Land_InvestmentBusiness = 31, // 土地（投資・事業用）// 非対応

  // 年金
  NationalPension = 33, // 国民年金
  WelfarePension = 34, // 厚生年金
  MutualAidPension = 35, // 共済年金
  CorporatePension = 36, // 企業年金
  WelfarePensionFund = 37, // 厚生年金基金
  NationalPensionFund = 38, // 国民年金基金  //非対応
  DefinedContributionPension = 39, // 確定拠出年金  //非対応
  PrivatePension = 40, // 私的年金

  // ポイント
  Points_Miles = 48, // ポイント・マイル

  // その他の資産
  Automobile = 41, // 自動車
  PreciousMetals_Jewelry = 42, // 貴金属・宝石類  //非対応
  OtherAssets = 43, // その他
}

export interface AssetModel {
  assetId: string;
  assetSubclassId: string;
  name: string;
  value: number;
  entriedPrice: number;
  entriedAt: string;
}

export class Asset extends ApiResponseHandler {
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // getMonth() は0から始まるため、+1する
    const day = date.getDate();

    return `${year}/${month}/${day}`;
  }

  public async addAsset(
    accountString: string,
    assetSubclassId: AssetSubclass,
    assetName: string,
    assetValue: number,
    assetEntryValue?: number,
    assetEntryAt?: Date
  ) {
    const postData = {
      "user_asset_det[id]": "",
      "user_asset_det[sub_account_id_hash]": accountString.split("@")[1],
      "user_asset_det[asset_subclass_id]": assetSubclassId,
      "user_asset_det[name]": assetName,
      "user_asset_det[value]": assetValue,
      "user_asset_det[entried_price]":
        assetEntryValue !== undefined ? assetEntryValue : "",
      "user_asset_det[entried_at]": assetEntryAt
        ? this.formatDate(assetEntryAt)
        : "",
    };
    return this.post("/bs/portfolio/new", postData);
  }

  public async getAssets(
    accountString: string
  ): Promise<AssetModel[]> {
    const url = `/accounts/show_manual/${accountString.split("@")[0]}`;

    return this.get(url, ($) => {
      const assetDetails: AssetModel[] = [];

      $('form.form-horizontal[action="/bs/portfolio/edit"]').each((_, form) => {
        const formId = $(form).attr("id")?.replace("new_user_asset_det_", "");
        const formInputs = $(form).find(".control-group input[id]");
        const detail: Partial<AssetModel> = {};

        if (formId) {
          detail.assetId = formId;
        }

        formInputs.each((_, input) => {
          const id = $(input).attr("id");
          const value = $(input).val() as string;

          if (id && value) {
            switch (id.replace("user_asset_det_", "")) {
              case "sub_account_id_hash":
                break;
              case "temp_asset_subclass_id":
                break;
              case "asset_subclass_id":
                detail.assetSubclassId = AssetSubclass[parseInt(value, 10)];
                break;
              case "name":
                detail.name = value;
                break;
              case "value":
                detail.value = parseInt(value, 10); // 数値に変換
                break;
              case "entried_price":
                detail.entriedPrice = parseInt(value, 10); // 数値に変換
                break;
              case "entried_at":
                detail.entriedAt = value;
                break;
            }
          }
        });

        if (Object.keys(detail).length > 0) {
          assetDetails.push(detail as AssetModel);
        }
      });

      return assetDetails;
    });
  }

  public async deleteAsset(
    accountString: string,
    assetId: string
    ): Promise<void> {
    const url = `/bs/portfolio/${assetId}?sub_account_id_hash=${accountString.split("@")[1]}`;
    const postData = {
      _method: "delete",
    };
        return this.post(url, postData);
  }
}
