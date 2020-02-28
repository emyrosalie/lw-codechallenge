export interface ME0104T4_GetResponse {
  title: string;
  variables: GetVariables[];
}

export interface ME0104T4_PostResponse {
  columns: PostVariables[];
  data: Data[];
}

interface Variables {
  code: string;
  text: string;
}

export interface GetVariables extends Variables {
  values: string[];
  valueTexts: string[];
}

interface PostVariables extends Variables {
  type: string;
}

interface Data {
  key: string[];
  values: string[];
}
