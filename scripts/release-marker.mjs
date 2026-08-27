export const RELEASE_MARKER_FILE = "release.txt";

const gitShaPattern = /^[0-9a-f]{40}$/;
const markerPattern = /^(?:local|[0-9a-f]{40})\n$/;

function configuredReleaseId(environment) {
  const value = environment.GITHUB_SHA?.trim();
  if (!value) return null;
  if (!gitShaPattern.test(value)) {
    throw new Error("GITHUB_SHA must be a 40-character lowercase Git SHA.");
  }
  return value;
}

export function releaseIdFromEnvironment(environment = process.env) {
  return configuredReleaseId(environment) || "local";
}

export function createReleaseMarker(environment = process.env) {
  return `${releaseIdFromEnvironment(environment)}\n`;
}

export function validateReleaseMarker(contents, environment = process.env) {
  if (!markerPattern.test(contents)) {
    throw new Error(
      `${RELEASE_MARKER_FILE} must contain only "local" or a 40-character lowercase Git SHA followed by a newline.`,
    );
  }

  const releaseId = contents.trim();
  const expectedReleaseId = configuredReleaseId(environment);
  if (expectedReleaseId && releaseId !== expectedReleaseId) {
    throw new Error(
      `${RELEASE_MARKER_FILE} identifies ${releaseId}, expected ${expectedReleaseId}.`,
    );
  }
  return releaseId;
}
