import { useEffect, useState } from "react";

import { auctionApi } from "../services/api";
import type { AuctionWindow } from "../types";

export function useAuctionWindow() {
  const [auctionWindow, setAuctionWindow] = useState<AuctionWindow | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadAuctionWindow = async () => {
      try {
        const data = await auctionApi.getWindow();
        if (!cancelled) {
          setAuctionWindow(data);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadAuctionWindow();

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void loadAuctionWindow();
      }
    }, 30000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  return { auctionWindow, isLoading };
}
