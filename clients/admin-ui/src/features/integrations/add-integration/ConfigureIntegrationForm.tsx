import { AntButton as Button, Box, useToast, VStack } from "fidesui";
import { Form, Formik } from "formik";
import { isEmpty, isUndefined, mapValues, omitBy } from "lodash";
import * as Yup from "yup";

import FidesSpinner from "~/features/common/FidesSpinner";
import { ControlledSelect } from "~/features/common/form/ControlledSelect";
import { CustomTextInput } from "~/features/common/form/inputs";
import { getErrorMessage } from "~/features/common/helpers";
import { useGetConnectionTypeSecretSchemaQuery } from "~/features/connection-type";
import type { ConnectionTypeSecretSchemaResponse } from "~/features/connection-type/types";
import { useGetAllFilteredDatasetsQuery } from "~/features/dataset";
import {
  usePatchDatastoreConnectionMutation,
  usePatchDatastoreConnectionSecretsMutation,
} from "~/features/datastore-connections";
import { useDatasetConfigField } from "~/features/datastore-connections/system_portal_config/forms/fields/DatasetConfigField/useDatasetConfigField";
import { formatKey } from "~/features/datastore-connections/system_portal_config/helpers";
import {
  useGetAllSystemsQuery,
  usePatchSystemConnectionConfigsMutation,
} from "~/features/system";
import {
  AccessLevel,
  BigQueryDocsSchema,
  ConnectionConfigurationResponse,
  ConnectionSystemTypeMap,
  ConnectionType,
  DynamoDBDocsSchema,
  ScyllaDocsSchema,
} from "~/types/api";
import { isErrorResult } from "~/types/errors";

type ConnectionSecrets = Partial<
  BigQueryDocsSchema & ScyllaDocsSchema & DynamoDBDocsSchema
>;

type FormValues = {
  name: string;
  description: string;
  system_fides_key?: string;
  secrets?: ConnectionSecrets;
  dataset?: string[];
};

const ConfigureIntegrationForm = ({
  connection,
  connectionOption,
  onCancel,
  description,
}: {
  connection?: ConnectionConfigurationResponse;
  connectionOption: ConnectionSystemTypeMap;
  onCancel: () => void;
  description: React.ReactNode;
}) => {
  const [
    patchConnectionSecretsMutationTrigger,
    { isLoading: secretsIsLoading },
  ] = usePatchDatastoreConnectionSecretsMutation();
  const [patchDatastoreConnectionsTrigger, { isLoading: patchIsLoading }] =
    usePatchDatastoreConnectionMutation();
  const [patchSystemConnectionsTrigger, { isLoading: systemPatchIsLoading }] =
    usePatchSystemConnectionConfigsMutation();

  const { data: secrets, isLoading: secretsSchemaIsLoading } =
    useGetConnectionTypeSecretSchemaQuery(connectionOption.identifier);

  const { data: allSystems } = useGetAllSystemsQuery();

  const systemOptions = allSystems?.map((s) => ({
    label: s.name ?? s.fides_key,
    value: s.fides_key,
  }));

  const { data: allDatasets } = useGetAllFilteredDatasetsQuery({
    minimal: true,
    connection_type: ConnectionType.BIGQUERY,
  });
  const datasetOptions = allDatasets?.map((d) => ({
    label: d.name ?? d.fides_key,
    value: d.fides_key,
  }));

  const { patchConnectionDatasetConfig, initialDatasets } =
    useDatasetConfigField({
      connectionConfig: connection,
    });

  const submitPending =
    secretsIsLoading || patchIsLoading || systemPatchIsLoading;

  const initialValues: FormValues = {
    name: connection?.name ?? "",
    description: connection?.description ?? "",
    secrets: mapValues(
      secrets?.properties,
      (s, key) => connection?.secrets?.[key] ?? "",
    ),
    dataset: initialDatasets,
  };

  const toast = useToast();

  const isEditing = !!connection;

  // Exclude secrets fields that haven't changed
  // The api returns secrets masked as asterisks (*****)
  // and we don't want to PATCH with those values.
  const excludeUnchangedSecrets = (secretsValues: ConnectionSecrets) =>
    omitBy(
      mapValues(secretsValues, (s, key) =>
        (connection?.secrets?.[key] ?? "") === s ? undefined : s,
      ),
      isUndefined,
    );

  const handleSubmit = async (values: FormValues) => {
    const newSecretsValues = excludeUnchangedSecrets(values.secrets!);

    const connectionPayload = isEditing
      ? {
          ...connection,
          disabled: connection.disabled ?? false,
          name: values.name,
          description: values.description,
          secrets: undefined,
        }
      : {
          name: values.name,
          key: formatKey(values.name),
          connection_type: connectionOption.identifier as ConnectionType,
          access: AccessLevel.READ,
          disabled: false,
          description: values.description,
          secrets: values.secrets,
          dataset: values.dataset,
        };

    // if system is attached, use patch request that attaches to system
    let patchResult;
    if (values.system_fides_key) {
      patchResult = await patchSystemConnectionsTrigger({
        systemFidesKey: values.system_fides_key,
        connectionConfigs: [connectionPayload],
      });
    } else {
      patchResult = await patchDatastoreConnectionsTrigger(connectionPayload);
    }
    if (isErrorResult(patchResult)) {
      const patchErrorMsg = getErrorMessage(
        patchResult.error,
        `A problem occurred while ${
          isEditing ? "updating" : "creating"
        } this integration. Please try again.`,
      );
      toast({ status: "error", description: patchErrorMsg });
      return;
    }
    if (!values.secrets) {
      toast({
        status: "success",
        description: `Integration ${
          isEditing ? "updated" : "created"
        } successfully`,
      });
      return;
    }

    // if provided, update secrets with separate request
    if (!isEmpty(newSecretsValues)) {
      const secretsResult = await patchConnectionSecretsMutationTrigger({
        connection_key: connectionPayload.key,
        secrets: newSecretsValues,
      });

      if (isErrorResult(secretsResult)) {
        const secretsErrorMsg = getErrorMessage(
          secretsResult.error,
          `An error occurred while ${
            isEditing ? "updating" : "creating"
          } this integration's secret.  Please try again.`,
        );
        toast({ status: "error", description: secretsErrorMsg });
        return;
      }
    }

    toast({
      status: "success",
      description: `Integration secret ${
        isEditing ? "updated" : "created"
      } successfully`,
    });
    onCancel();

    if (
      connectionPayload &&
      values.dataset &&
      connectionOption.identifier === ConnectionType.DATAHUB
    ) {
      await patchConnectionDatasetConfig(values, connectionPayload.key, {
        showSuccessAlert: false,
      });
    }
  };

  if (secretsSchemaIsLoading) {
    return <FidesSpinner />;
  }

  const generateFields = (secretsSchema: ConnectionTypeSecretSchemaResponse) =>
    Object.entries(secretsSchema.properties).map(([fieldKey, fieldInfo]) => {
      const fieldName = `secrets.${fieldKey}`;
      return (
        <CustomTextInput
          name={fieldName}
          key={fieldName}
          id={fieldName}
          type={fieldInfo.sensitive ? "password" : undefined}
          label={fieldInfo.title}
          isRequired={secretsSchema.required.includes(fieldKey)}
          tooltip={fieldInfo.description}
          variant="stacked"
        />
      );
    });

  const generateValidationSchema = (
    secretsSchema: ConnectionTypeSecretSchemaResponse,
  ) => {
    const fieldsFromSchema = Object.entries(secretsSchema.properties).map(
      ([fieldKey, fieldInfo]) => [
        fieldKey,
        secretsSchema.required.includes(fieldKey)
          ? Yup.string().required().label(fieldInfo.title)
          : Yup.string().nullable().label(fieldInfo.title),
      ],
    );

    return Yup.object().shape({
      name: Yup.string().required().label("Name"),
      description: Yup.string().nullable().label("Description"),
      secrets: Yup.object().shape(Object.fromEntries(fieldsFromSchema)),
    });
  };
  return (
    <>
      {description && (
        <Box
          padding="20px 24px"
          backgroundColor="gray.50"
          borderRadius="md"
          border="1px solid"
          borderColor="gray.200"
          fontSize="sm"
          marginTop="16px"
        >
          {description}
        </Box>
      )}
      <Formik
        initialValues={initialValues}
        enableReinitialize
        onSubmit={handleSubmit}
        validationSchema={generateValidationSchema(secrets!)}
      >
        {({ dirty, isValid, resetForm }) => (
          <Form>
            <VStack alignItems="start" spacing={6} mt={4}>
              <CustomTextInput
                id="name"
                name="name"
                label="Name"
                variant="stacked"
                isRequired
              />
              <CustomTextInput
                id="description"
                name="description"
                label="Description"
                variant="stacked"
              />
              {generateFields(secrets!)}
              {!isEditing && (
                <ControlledSelect
                  id="system_fides_key"
                  name="system_fides_key"
                  options={systemOptions ?? []}
                  label="System"
                  tooltip="The system to associate with the integration"
                  layout="stacked"
                />
              )}
              {connectionOption.identifier === ConnectionType.DATAHUB && (
                <ControlledSelect
                  id="dataset"
                  name="dataset"
                  options={datasetOptions ?? []}
                  label="Datasets"
                  tooltip="Only BigQuery datasets are supported. Selected datasets will sync with matching DataHub datasets. If none are selected, all datasets will be included by default."
                  layout="stacked"
                  mode="multiple"
                />
              )}
              <div className="flex w-full justify-between">
                <Button
                  onClick={() => {
                    onCancel();
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  htmlType="submit"
                  type="primary"
                  disabled={!dirty || !isValid}
                  loading={submitPending}
                  data-testid="save-btn"
                >
                  Save
                </Button>
              </div>
            </VStack>
          </Form>
        )}
      </Formik>
    </>
  );
};

export default ConfigureIntegrationForm;
