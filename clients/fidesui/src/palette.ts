import * as AntColors from "@ant-design/colors";

export interface TagColor {
  color: string;
  backgroundColor: string;
  borderColor: string;
}

const processingTag: TagColor = {
  color: "#2B2E35",
  backgroundColor: "#CECAC2",
  borderColor: "#91CAFF",
};

const tags: Record<string, TagColor> = { processingTag };

export const palette = {
  ...AntColors,
  tags,
};
