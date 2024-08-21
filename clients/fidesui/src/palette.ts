import * as AntColors from "@ant-design/colors";

export interface TagColor {
  color: string;
  backgroundColor: string;
  borderColor: string;
}

// Generate color palettes by a given color
const newColor: AntColors.Palette = [
  "#fff1f0",
  "#ffccc7",
  "#ffa39e",
  "#ff7875",
  "#ff4d4f",
  "#f5222d",
  "#cf1322",
  "#a8071a",
  "#820014",
  "#5c0011",
];
const primary = newColor[5];
newColor.primary = primary;

const processingTag: TagColor = {
  color: "#2B2E35",
  backgroundColor: "#CECAC2",
  borderColor: "#91CAFF",
};

const tags: Record<string, TagColor> = { processingTag };

export const palette = {
  ...AntColors,
  newColor,
  tags,
};
