import axios from "axios";
import {
  ME0104T4_GetResponse,
  GetVariables,
  ME0104T4_PostResponse,
  Data
} from "../types/scb";
import Region from "./Region";

export default class App {
  private url: string;
  private years: string[];
  private regions: Region[];

  constructor() {
    this.url =
      "http://api.scb.se/OV0104/v1/doris/sv/ssd/START/ME/ME0104/ME0104D/ME0104T4";
  }

  async startApp() {
    try {
      await this.init();

      const percentData = await this.fetchPercentData();
      this.printResult(percentData);
    } catch (error) {
      console.error(error);
    }
  }

  private async init() {
    this.years = [];
    this.regions = [];
    await this.fetchInitData();
  }

  private findVariableData(data: ME0104T4_GetResponse, code: string) {
    return data.variables.find((value: GetVariables) => value.code === code);
  }

  private getValuesFromRegions(regions: Region[]) {
    return regions.map(a => a.value);
  }

  private isAllowedRegion(value: string) {
    return value !== "00";
  }

  private addRegions(regionData: GetVariables) {
    const values = regionData.values;
    const valueTexts = regionData.valueTexts;

    for (let i = 0; i < values.length; i++) {
      const name = valueTexts[i];
      const value = values[i];

      if (this.isAllowedRegion(value)) {
        const region = new Region(name, value);
        this.regions.push(region);
      }
    }
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

    const regionData = this.findVariableData(data, "Region");
    if (!regionData) {
      throw new Error("Region data could not be found");
    }
    this.addRegions(regionData);
  }

  private async fetchPercentData() {
    const regionValues = this.getValuesFromRegions(this.regions);
    const response = await axios.post(this.url, {
      query: [
        {
          code: "Region",
          selection: {
            filter: "vs:RegionKommun07+BaraEjAggr",
            values: regionValues
          }
        },
        {
          code: "ContentsCode",
          selection: {
            filter: "item",
            values: ["ME0104B8"]
          }
        }
      ],
      response: {
        format: "json"
      }
    });
    const data = response?.data;
    if (!data) {
      throw new Error("Response data could not be found");
    }

    return JSON.parse(data.trim());
  }

  private getResultsFromYear(values: Data[], year: string) {
    return values.filter((value: Data) => value.key[1] === year);
  }

  private printResult(response: ME0104T4_PostResponse) {
    for (const year of this.years) {
      const results = this.getResultsFromYear(response.data, year);
      // Skip year if no results
      if (!results || results.length === 0) {
        return;
      }

      console.log(results);
    }
  }
}
