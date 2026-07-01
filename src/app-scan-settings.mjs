import {
  buildScanSummaryText,
  normalizeDirectoryName,
  normalizeGeneralRulePattern,
  normalizeScanExtension,
  renderScanOption,
} from './scan-settings.mjs';

export function createScanSettingsController({ elements, state }) {
  function renderScanSettings() {
    elements.scanExtensionList.innerHTML = state.scan.extensionOptions
      .map((extension) => renderScanOption('extension', extension, state.scan.markdownExtensions.includes(extension)))
      .join('');
    elements.generalRuleList.innerHTML = state.scan.generalRuleOptions
      .map((pattern) => renderScanOption('rule', pattern, state.scan.ignoredDirectoryPatterns.includes(pattern)))
      .join('');
    elements.ignoreDirectoryList.innerHTML = state.scan.ignoredDirectoryOptions
      .map((directory) => renderScanOption('directory', directory, state.scan.ignoredDirectoryNames.includes(directory)))
      .join('');
    renderScanSummary();
  }

  function updateScanSettingsFromInputs() {
    state.scan.markdownExtensions = [...elements.scanExtensionList.querySelectorAll('[data-scan-extension]')]
      .filter((input) => input.checked)
      .map((input) => input.dataset.scanExtension);
    state.scan.ignoredDirectoryPatterns = [...elements.generalRuleList.querySelectorAll('[data-general-rule]')]
      .filter((input) => input.checked)
      .map((input) => input.dataset.generalRule);
    state.scan.ignoredDirectoryNames = [...elements.ignoreDirectoryList.querySelectorAll('[data-ignore-dir]')]
      .filter((input) => input.checked)
      .map((input) => input.dataset.ignoreDir);
    state.scan.ignoreDotDirectories = state.scan.ignoredDirectoryPatterns.includes('.*');
    renderScanSummary();
  }

  function openScanSettingsDialog() {
    renderScanSettings();
    elements.scanSettingsDialog.classList.add('is-visible');
    elements.scanSettingsDialog.setAttribute('aria-hidden', 'false');
    elements.scanExtensionInput.focus();
  }

  function closeScanSettingsDialog() {
    elements.scanSettingsDialog.classList.remove('is-visible');
    elements.scanSettingsDialog.setAttribute('aria-hidden', 'true');
  }

  function addScanExtension() {
    const extension = normalizeScanExtension(elements.scanExtensionInput.value);
    if (!extension) return;
    if (!state.scan.extensionOptions.includes(extension)) {
      state.scan.extensionOptions.push(extension);
    }
    if (!state.scan.markdownExtensions.includes(extension)) {
      state.scan.markdownExtensions.push(extension);
    }
    elements.scanExtensionInput.value = '';
    renderScanSettings();
  }

  function addGeneralRule() {
    const pattern = normalizeGeneralRulePattern(elements.generalRuleInput.value);
    if (!pattern) return;
    if (!state.scan.generalRuleOptions.includes(pattern)) {
      state.scan.generalRuleOptions.push(pattern);
    }
    if (!state.scan.ignoredDirectoryPatterns.includes(pattern)) {
      state.scan.ignoredDirectoryPatterns.push(pattern);
    }
    state.scan.ignoreDotDirectories = state.scan.ignoredDirectoryPatterns.includes('.*');
    elements.generalRuleInput.value = '';
    renderScanSettings();
  }

  function addIgnoredDirectory() {
    const directory = normalizeDirectoryName(elements.ignoreDirectoryInput.value);
    if (!directory) return;
    if (!state.scan.ignoredDirectoryOptions.includes(directory)) {
      state.scan.ignoredDirectoryOptions.push(directory);
    }
    if (!state.scan.ignoredDirectoryNames.includes(directory)) {
      state.scan.ignoredDirectoryNames.push(directory);
    }
    elements.ignoreDirectoryInput.value = '';
    renderScanSettings();
  }

  function removeScanOption(event) {
    const button = event.target.closest('[data-scan-remove]');
    if (!button) return;

    const value = button.dataset.value;
    if (button.dataset.scanRemove === 'extension') {
      state.scan.extensionOptions = state.scan.extensionOptions.filter((extension) => extension !== value);
      state.scan.markdownExtensions = state.scan.markdownExtensions.filter((extension) => extension !== value);
    } else if (button.dataset.scanRemove === 'rule') {
      state.scan.generalRuleOptions = state.scan.generalRuleOptions.filter((pattern) => pattern !== value);
      state.scan.ignoredDirectoryPatterns = state.scan.ignoredDirectoryPatterns.filter((pattern) => pattern !== value);
      state.scan.ignoreDotDirectories = state.scan.ignoredDirectoryPatterns.includes('.*');
    } else {
      state.scan.ignoredDirectoryOptions = state.scan.ignoredDirectoryOptions.filter((directory) => directory !== value);
      state.scan.ignoredDirectoryNames = state.scan.ignoredDirectoryNames.filter((directory) => directory !== value);
    }
    renderScanSettings();
  }

  function renderScanSummary() {
    elements.scanSummary.textContent = buildScanSummaryText(state.scan);
  }

  return {
    addGeneralRule,
    addIgnoredDirectory,
    addScanExtension,
    closeScanSettingsDialog,
    openScanSettingsDialog,
    removeScanOption,
    renderScanSettings,
    renderScanSummary,
    updateScanSettingsFromInputs,
  };
}
