import axios, { AxiosInstance } from "axios";
import { LoginSession } from "../authentication";
import cheerio, { CheerioAPI } from "cheerio";

export abstract class ApiResponseHandler {
  private axiosInstance: AxiosInstance;

  constructor(session: LoginSession) {
    this.axiosInstance = axios.create({
      baseURL: "https://moneyforward.com",
      headers: {
        cookie: this.formatCookies(session.cookie),
        origin: "https://moneyforward.com",
        referer: "https://moneyforward.com/",
        "x-csrf-token": session["csrf-token"],
        "x-requested-with": "XMLHttpRequest",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      transformRequest: [
        function (data) {
          if (data) {
            return Object.entries(data)
              .map(
                ([key, value]) =>
                  `${encodeURIComponent(key)}=${encodeURIComponent(
                    String(value)
                  )}`
              )
              .join("&");
          }
          return data;
        },
      ],
    });
  }

  private formatCookies(
    cookies: Array<{ name: string; value: string }>
  ): string {
    return cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
  }

  protected async handleRequest<T, U = T>(url: string, data?: T): Promise<U> {
    try {
      const response = await this.axiosInstance.post<U>(url, data);
      // console.log("SUCCESS:", response.data);
      return response.data;
    } catch (error) {
      console.error("ERROR:", error);
      throw error;
    }
  }

  protected async fetchData<T>(
    url: string,
    decorator: (cheerio: CheerioAPI) => T
  ): Promise<T> {
    const response = await this.axiosInstance.get(url);
    const $ = cheerio.load(response.data);
    return decorator($);
  }
}
