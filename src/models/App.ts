import axios from "axios";
import { ME0104T4_GetResponse, GetVariables } from "../types/scb";

export default class App {
  private url: string;
  private years: string[];

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

  private findVariableData(data: ME0104T4_GetResponse, code: string) {
    return data.variables.find((value: GetVariables) => value.code === code);
  }

  private async fetchInitData() {
    const response = await axios.get(this.url);
    const data = response?.data;
    if (!data) {
      throw new Error("Response data could not be found");
    }

    const yearData = this.findVariableData(data, "Tid");
    if (!yearData) {
      throw new Error("Year data could not be found");
    }

    this.years = yearData.values;
    console.log(this.years);
  }
}
