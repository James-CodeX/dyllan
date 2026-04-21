function configuredChannelInput() {
  return process.env.YOUTUBE_CHANNEL_INPUT?.trim() || "";
}

function configuredRssUrl() {
  return process.env.YOUTUBE_RSS_URL?.trim() || "";
}

export function getConfiguredScanSource() {
  const fromChannelInput = configuredChannelInput();
  if (fromChannelInput) {
    return fromChannelInput;
  }

  const fromRss = configuredRssUrl();
  if (fromRss) {
    return fromRss;
  }

  return "";
}

export function resolveScanSource(input?: string | null) {
  const provided = input?.trim();
  if (provided) {
    return provided;
  }

  const configured = getConfiguredScanSource();
  if (configured) {
    return configured;
  }

  throw new Error(
    "Missing channel input. Provide a channel/feed URL in the request or set YOUTUBE_CHANNEL_INPUT/YOUTUBE_RSS_URL.",
  );
}
