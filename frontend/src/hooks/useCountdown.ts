import { useEffect, useMemo, useState } from "react";

import { getCountdownParts } from "../utils/date";

export const useCountdown = (targetIsoDate: string) => {
  const targetDate = useMemo(() => new Date(targetIsoDate), [targetIsoDate]);
  const [parts, setParts] = useState(() => getCountdownParts(targetDate));

  useEffect(() => {
    const interval = window.setInterval(() => {
      setParts(getCountdownParts(targetDate));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [targetDate]);

  return parts;
};
