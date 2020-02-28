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

  constructor() {
    this.url =
      "http://api.scb.se/OV0104/v1/doris/sv/ssd/START/ME/ME0104/ME0104D/ME0104T4";
  }

  async startApp() {
    try {
      const initData = await this.fetchInitData();
      const percentData = await this.fetchPercentData(initData.regions);
      this.printResult(percentData, initData.years, initData.regions);
    } catch (error) {
      console.error(error);
    }
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

  private getRegions(regionData: GetVariables) {
    const values = regionData.values;
    const valueTexts = regionData.valueTexts;

    const regions = values.map(
      (value, index) => new Region(valueTexts[index], value)
    );
    const allowedRegions = regions.filter(region =>
      this.isAllowedRegion(region.value)
    );

    return allowedRegions;
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

    const years = yearData.values;

    const regionData = this.findVariableData(data, "Region");
    if (!regionData) {
      throw new Error("Region data could not be found");
    }
    const regions = this.getRegions(regionData);

    return { years, regions };
  }

  private async fetchPercentData(regions: Region[]) {
    const regionValues = this.getValuesFromRegions(regions);
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

  private findRegion(value: string, regions: Region[]) {
    return regions.find(region => region.value === value);
  }

  private getResultsFromYear(values: Data[], year: string) {
    return values.filter((value: Data) => value.key[1] === year);
  }

  private getTopScoringRegions(values: Data[]) {
    const topRegion = values.reduce((prev: Data, current: Data) =>
      prev.values[0] > current.values[0] ? prev : current
    );
    // Return all regions with the same score
    return values.filter((v: Data) => v.values[0] === topRegion.values[0]);
  }

  private printResult(
    response: ME0104T4_PostResponse,
    years: string[],
    regions: Region[]
  ) {
    for (const year of years) {
      const results = this.getResultsFromYear(response.data, year);
      // Skip year if no results
      if (results?.length > 0) {
        const topRegions = this.getTopScoringRegions(results);
        const regionNames = topRegions.map(
          (r: Data) => this.findRegion(r.key[0], regions)?.name
        );
        const percent = topRegions[0].values[0];

        console.log(year, regionNames.join(", "), `${percent}%`);
      }
    }
  }
}
