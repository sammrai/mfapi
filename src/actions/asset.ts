import { ApiResponseHandler } from './api'

export class Asset extends ApiResponseHandler {
  public async addTransaction(content: string, amount: number) {
    const postData = {
      'user_asset_act[is_transfer]': '0',
      'user_asset_act[is_income]': '0',
      'user_asset_act[large_category_id]': '',
      'user_asset_act[middle_category_id]': '',
      'user_asset_act[amount]': amount,
      'user_asset_act[sub_account_id_hash]': '0',
      'user_asset_act[content]': content,
    };
    return this.handleRequest('/user_asset_acts', postData);
  }
}