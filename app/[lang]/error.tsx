"use client";

import { useEffect } from "react";
import log from "@/utils/logger";
import { useDictionary } from "@/hooks/use-dictionary";

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  const { dictionary: dict } = useDictionary();
  useEffect(() => {
    // Log the error to an error reporting service
    log.error("Unhandled error boundary", { error });
  }, [error]);

  return (
    <div>
      <h2>{dict.errors.somethingWentWrong}</h2>
      <button
        onClick={
          // Attempt to recover by trying to re-render the segment
          () => reset()
        }
      >
        {dict.common.retry}
      </button>
    </div>
  );
}
