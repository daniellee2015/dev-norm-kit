import { getUIColors, renderPage, renderSummaryTable } from "cli-menu-kit";
import { STATUS_ACTIONS } from "../constants.mjs";
import { t } from "../i18n.mjs";
import { targetExists } from "../services/path-service.mjs";
import { readStatusFlags } from "../services/config-bundle-service.mjs";
import { providerDisplayText } from "../services/dnk-provider-service.mjs";
import { menuHints, buildSecondaryHeader } from "../ui/page.mjs";
import { buildMenuLabel } from "../ui/menu-label.mjs";

function normalizeValue(result) {
  if (result && typeof result === "object" && "value" in result) {
    return result.value;
  }
  return result;
}

function formatStatusFlag(state, value) {
  if (value) {
    return `\x1b[32m✓ ${t(state, "statusTrue")}\x1b[0m`;
  }
  return `\x1b[31m✗ ${t(state, "statusFalse")}\x1b[0m`;
}

function formatPathForSummary(pathValue) {
  if (typeof pathValue !== "string") {
    return "";
  }
  return pathValue;
}

function formatProviderSource(state, source) {
  if (source === "active-provider") {
    return t(state, "statusProviderSourceActiveFile");
  }
  if (source === "filesystem") {
    return t(state, "statusProviderSourceFilesystem");
  }
  return source || "-";
}

export async function showStatusMenu(state) {
  const statusActions = [
    {
      action: STATUS_ACTIONS.SET_TARGET,
      label: buildMenuLabel({ prefix: "1.", main: t(state, "setTargetPath") }),
    },
    { action: STATUS_ACTIONS.BACK, label: buildMenuLabel({ prefix: "b.", main: t(state, "back") }) },
  ];

  const exists = targetExists(state.targetPath);
  const flags = exists
    ? readStatusFlags(state.targetPath)
    : {
        hasNormConfig: false,
        hasActiveProviderConfig: false,
        activeProviderId: "agnostic",
        providerResolutionSource: "filesystem",
        hasOrchestratorState: false,
        activeProviderArtifactSummary: { existingCount: 0, totalCount: 0 },
        providerArtifactGroups: [],
      };

  const result = await renderPage({
    header: buildSecondaryHeader(state, t(state, "statusTitle")),
    mainArea: {
      type: "display",
      render: () => {
        const sections = [
          {
            header: t(state, "statusWorkspaceSection"),
            items: [
              { key: t(state, "targetPath"), value: formatPathForSummary(state.targetPath) },
              { key: t(state, "targetExists"), value: formatStatusFlag(state, exists) },
            ],
          },
          {
            header: t(state, "statusArtifactsSection"),
            items: [
              {
                key: t(state, "hasNormConfig"),
                value: formatStatusFlag(state, flags.hasNormConfig),
              },
              {
                key: t(state, "statusActiveProviderConfig"),
                value: formatStatusFlag(state, flags.hasActiveProviderConfig),
              },
              {
                key: t(state, "statusActiveProvider"),
                value: providerDisplayText(state, flags.activeProviderId ?? "agnostic"),
              },
              {
                key: t(state, "statusActiveProviderSource"),
                value: formatProviderSource(state, flags.providerResolutionSource),
              },
              {
                key: t(state, "statusActiveProviderCoverage"),
                value:
                  flags.activeProviderArtifactSummary.totalCount > 0
                    ? `${flags.activeProviderArtifactSummary.existingCount}/${flags.activeProviderArtifactSummary.totalCount}`
                    : "-",
              },
              {
                key: t(state, "statusOrchestratorState"),
                value: formatStatusFlag(state, flags.hasOrchestratorState),
              },
            ],
          },
        ];

        if (Array.isArray(flags.providerArtifactGroups) && flags.providerArtifactGroups.length > 0) {
          for (const group of flags.providerArtifactGroups) {
            sections.push({
              header: `${providerDisplayText(state, group.providerId)} ${t(
                state,
                "statusProviderConfigChecksLabel",
              )} (${group.existingCount}/${group.totalCount})`,
              items: group.artifacts.map((artifact) => ({
                key: artifact.path,
                value: formatStatusFlag(state, artifact.exists),
              })),
            });
          }
        }

        const warningItems = [];
        if (!exists) {
          warningItems.push({
            key: t(state, "targetMissing"),
            value: formatPathForSummary(state.targetPath),
          });
        }
        if (exists && (!Array.isArray(flags.providerArtifactGroups) || flags.providerArtifactGroups.length === 0)) {
          warningItems.push({
            key: t(state, "statusProviderMissingHint"),
            value: t(state, "statusProviderMissingAction"),
          });
        }

        if (warningItems.length > 0) {
          sections.push({
            header: t(state, "statusWarningsSection"),
            items: warningItems,
          });
        }

        renderSummaryTable({
          title: t(state, "statusTitle"),
          sections,
          titleAlign: "left",
          colors: {
            title: "white+bold",
            sectionHeader: "bold",
            key: `${getUIColors().accent}`,
            value: "",
          },
        });
      },
    },
    footer: {
      menu: {
        options: statusActions.map((entry) => entry.label),
        allowLetterKeys: true,
        allowNumberKeys: true,
        preserveOnSelect: true,
      },
      hints: menuHints(state),
    },
  });

  if (result && typeof result === "object" && typeof result.index === "number") {
    return statusActions[result.index]?.action ?? STATUS_ACTIONS.BACK;
  }
  return normalizeValue(result);
}
