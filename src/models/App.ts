import axios from "axios";

export default class App {
  private url: string;

  constructor() {
    this.url =
      "http://api.scb.se/OV0104/v1/doris/sv/ssd/START/ME/ME0104/ME0104D/ME0104T4";
  }

  async startApp() {
    try {
      await this.init();
    } catch (error) {
      console.error(error);
    }
  }

  private async init() {
    await this.fetchInitData();
  }

  private async fetchInitData() {
    const response = await axios.get(this.url);
    const data = response?.data;
    if (!data) {
      throw new Error("Response data could not be found");
    }
  }
}
