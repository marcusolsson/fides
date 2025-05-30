import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import {
  AntEmpty as Empty,
  AntForm as Form,
  AntInput as Input,
  AntTypography as Typography,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  useToast,
} from "fidesui";
import { isEmpty } from "lodash";
import { useEffect, useState } from "react";

import {
  PreferencesSavedExtended,
  PreferenceWithNoticeInformation,
} from "~/types/api";

import { getErrorMessage } from "../common/helpers";
import { FidesTableV2 } from "../common/table/v2";
import { useLazyGetCurrentPrivacyPreferencesQuery } from "./consent-reporting.slice";
import useConsentLookupTableColumns from "./hooks/useConsentLookupTableColumns";
import useTcfConsentColumns, {
  TcfDetailRow,
} from "./hooks/useTcfConsentColumns";

interface ConsentLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ConsentLookupModal = ({ isOpen, onClose }: ConsentLookupModalProps) => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<
    PreferencesSavedExtended | undefined | null
  >();
  const [getCurrentPrivacyPreferencesTrigger] =
    useLazyGetCurrentPrivacyPreferencesQuery();

  const toast = useToast();

  useEffect(() => {
    // reset state when modal is closed
    if (!isOpen) {
      setSearchResults(undefined);
      setIsSearching(false);
    }
  }, [isOpen]);

  const handleSearch = async (search: string) => {
    setIsSearching(true);
    const { data, isError, error } = await getCurrentPrivacyPreferencesTrigger({
      search,
    });
    const errorStatus = error && "status" in error && error?.status;
    if (isError && errorStatus !== 404) {
      const errorMsg = getErrorMessage(
        error,
        `A problem occurred while looking up the preferences.`,
      );

      toast({ status: "error", description: errorMsg });
    } else {
      setSearchResults(data || null);
    }
    setIsSearching(false);
  };

  const columns = useConsentLookupTableColumns();
  const preferences = searchResults?.preferences || [];
  const hasPreferences = !isEmpty(preferences);
  const tableInstance = useReactTable<PreferenceWithNoticeInformation>({
    getCoreRowModel: getCoreRowModel(),
    data: preferences,
    columns,
    getRowId: (row) => `${row.privacy_notice_history_id}`,
    manualPagination: true,
  });

  const {
    tcfColumns,
    mapTcfPreferencesToRowColumns,
    filterTcfConsentPreferences,
  } = useTcfConsentColumns();
  const tcfData = mapTcfPreferencesToRowColumns(searchResults);
  const filteredTcfData = filterTcfConsentPreferences(tcfData);

  const hasTcfData = !isEmpty(filteredTcfData);
  const tcfTableInstance = useReactTable<TcfDetailRow>({
    getCoreRowModel: getCoreRowModel(),
    data: filteredTcfData,
    columns: tcfColumns,
    getRowId: (row) => `${row.key}-${row.id}`,
    manualPagination: true,
  });

  return (
    <Modal
      id="consent-lookup-modal"
      isOpen={isOpen}
      onClose={onClose}
      size="6xl"
      returnFocusOnClose={false}
      isCentered
    >
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalHeader pb={2}>Consent preference lookup</ModalHeader>
        <ModalBody>
          <Typography.Paragraph>
            Use this search to look up an individual&apos;s latest consent
            record. You can search by phone number, email, external ID or device
            ID to retrieve the most recent consent preference associated with
            that exact identifier.
          </Typography.Paragraph>
          <Typography.Paragraph>
            <strong>Note:</strong> This is an exact match search—partial entries
            or similar results will not be returned. This lookup retrieves only
            the most recent consent preference, not the full consent history.
          </Typography.Paragraph>

          <Form layout="vertical" className="w-1/2">
            <Form.Item label="Subject search" className="mb-4 mt-6">
              <Input.Search
                data-testid="subject-search-input"
                placeholder="Enter email, phone number, external ID or device ID"
                enterButton="Search"
                onSearch={handleSearch}
                loading={isSearching}
              />
            </Form.Item>
          </Form>
          <div className="mb-4">
            {(!hasTcfData || hasPreferences) && (
              <FidesTableV2<PreferenceWithNoticeInformation>
                tableInstance={tableInstance}
                emptyTableNotice={
                  <Empty
                    description={
                      searchResults === undefined
                        ? "Search for an email, phone number, or device ID."
                        : "No results found."
                    }
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    imageStyle={{ marginBottom: 15 }}
                  />
                }
              />
            )}
            {hasTcfData && (
              <div className="mt-4">
                <FidesTableV2<TcfDetailRow> tableInstance={tcfTableInstance} />
              </div>
            )}
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
export default ConsentLookupModal;
