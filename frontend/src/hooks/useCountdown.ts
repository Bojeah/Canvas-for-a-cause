import { useEffect, useMemo, useState } from "react";

import { getCountdownParts } from "../utils/date";

export const useCountdown = (targetIsoDate: string | null) => {
  const targetDate = useMemo(
    () => (targetIsoDate ? new Date(targetIsoDate) : null),
    [targetIsoDate],
  );
  const [parts, setParts] = useState(() =>
    targetDate
      ? getCountdownParts(targetDate)
      : { days: 0, hours: 0, minutes: 0, seconds: 0, ended: true },
  );

  useEffect(() => {
    if (!targetDate) {
      setParts({ days: 0, hours: 0, minutes: 0, seconds: 0, ended: true });
      return;
    }

    const interval = window.setInterval(() => {
      setParts(getCountdownParts(targetDate));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [targetDate]);

  return parts;
};
