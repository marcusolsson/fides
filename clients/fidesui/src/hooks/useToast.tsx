import { useTheme } from "@chakra-ui/system";
import { useToast as chakraUseToast, UseToastOptions } from "@chakra-ui/toast";

/**
 * Custom FidesUI hook that extends Chakra UI's useToast to support Toast.defaultProps in a custom theme.
 * @example in the theme:
 * ```tsx
 * Toast: { defaultProps: { position: "top" } },
 * ```
 */
export const useToast = (options?: UseToastOptions | undefined) => {
  const theme = useTheme();
  const toast = chakraUseToast({
    ...theme.components.Toast?.defaultProps,
    ...options,
  });
  return toast;
};
export * from "@chakra-ui/toast";
