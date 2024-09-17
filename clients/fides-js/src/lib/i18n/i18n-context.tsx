import { createContext, h } from "preact";
import { ReactNode } from "preact/compat";
import {
  Dispatch,
  StateUpdater,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "preact/hooks";

import { FIDES_I18N_ICON } from "../consent-constants";
import type { I18n } from ".";

interface I18nContextProps {
  i18n: I18n;
  currentLocale: string | undefined;
  setCurrentLocale: (locale: string) => void;
  isLoading: boolean;
  setIsLoading: Dispatch<StateUpdater<boolean>>;
}

const I18nContext = createContext<I18nContextProps | Record<any, never>>({});

interface I18nProviderProps {
  i18nInstance: I18n;
  children: ReactNode;
}
export const I18nProvider = ({ i18nInstance, children }: I18nProviderProps) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const icon = document.getElementById(FIDES_I18N_ICON);
    if (isLoading) {
      icon?.style.setProperty("animation-name", "spin");
    } else {
      icon?.style.removeProperty("animation-name");
    }
  }, [isLoading]);

  const value: I18nContextProps = useMemo(
    () => ({
      i18n: i18nInstance,
      currentLocale: i18nInstance.locale,
      setCurrentLocale: i18nInstance.activate,
      isLoading,
      setIsLoading,
    }),
    [i18nInstance, isLoading],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context || Object.keys(context).length === 0) {
    throw new Error("useI18n must be used within a I18nProvider");
  }
  return context;
};
