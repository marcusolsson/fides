import type { TagProps } from "antd";
import { Tag } from "antd";
import { palette } from "fidesui";

interface AntTagProps extends TagProps {
  customColor?: string;
}

export const AntTag = ({ customColor, ...props }: AntTagProps) => {
  return (
    <Tag
      {...props}
      style={customColor ? palette.tags[customColor] : undefined}
    />
  );
};
