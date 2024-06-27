import { Text, UseToastOptions } from "fidesui";
import { ReactNode } from "react";

import { sentenceCase } from "~/features/common/utils";

interface MessageProps {
  status?: UseToastOptions["status"];
  children: ReactNode;
}
const Message = ({ status = "success", children }: MessageProps) => (
  <Text data-testid={`toast-${status}-msg`}>
    <strong>{sentenceCase(status)}:</strong> {children}
  </Text>
);

export const toastMessage = (
  message: ReactNode,
  status: UseToastOptions["status"] = "success"
): UseToastOptions => ({
  description: <Message status={status}>{message}</Message>,
});

export const successToastParams = (message: ReactNode): UseToastOptions =>
  toastMessage(message, "success");

export const errorToastParams = (message: ReactNode): UseToastOptions =>
  toastMessage(message, "error");

export const warningToastParams = (message: ReactNode): UseToastOptions =>
  toastMessage(message, "warning");

export const infoToastParams = (message: ReactNode): UseToastOptions =>
  toastMessage(message, "info");
