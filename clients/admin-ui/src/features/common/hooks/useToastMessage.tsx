import {
  AlertDescription,
  useToast as chakraUseToast,
  UseToastOptions,
} from "fidesui";
import { ReactNode } from "react";

import { sentenceCase } from "~/features/common/utils";

export const useToast = () => {
  const toast = chakraUseToast();

  const toastMessage = (
    message: ReactNode,
    status: UseToastOptions["status"] = "success",
    includePrefix: boolean = true
  ): UseToastOptions => ({
    status,
    title: (
      /* Using `title` instead of `description` to thwart a Chakra issue where they incorrectly add `aria-labelledby` to the toast component's `role=alert` element, which requires a title. Otherwise, a11y is completely broken here. Even using `title` + `description` here would be problematic, unfortunately, so we'll just use the `AlertDesctipion` component as a rememdy. */
      <>
        {typeof message === "string" &&
          includePrefix &&
          `${sentenceCase(status)}: `}
        <AlertDescription
          data-testid={`toast-${status}-msg`}
          fontWeight="normal"
        >
          {message}
        </AlertDescription>
      </>
    ),
  });

  const successToast = (message: ReactNode, includePrefix = true) =>
    toast(toastMessage(message, "success", includePrefix));

  const errorToast = (message: ReactNode, includePrefix = true) =>
    toast(toastMessage(message, "error", includePrefix));

  const warningToast = (message: ReactNode, includePrefix = true) =>
    toast(toastMessage(message, "warning", includePrefix));

  const infoToast = (message: ReactNode, includePrefix = true) =>
    toast(toastMessage(message, "info", includePrefix));

  return { successToast, errorToast, warningToast, infoToast };
};
