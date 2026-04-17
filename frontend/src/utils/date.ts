import { formatDistanceStrict, intervalToDuration } from "date-fns";

export const formatAuctionDate = (isoDate: string): string => {
  const date = new Date(isoDate);
  return date.toLocaleString();
};

export const formatRelativeCountdown = (isoDate: string): string => {
  const target = new Date(isoDate);
  const now = new Date();

  if (target.getTime() <= now.getTime()) {
    return "Ended";
  }

  return formatDistanceStrict(now, target);
};

export const getCountdownParts = (targetDate: Date) => {
  const now = new Date();
  if (targetDate.getTime() <= now.getTime()) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, ended: true };
  }

  const duration = intervalToDuration({ start: now, end: targetDate });
  return {
    days: duration.days ?? 0,
    hours: duration.hours ?? 0,
    minutes: duration.minutes ?? 0,
    seconds: duration.seconds ?? 0,
    ended: false,
  };
};
