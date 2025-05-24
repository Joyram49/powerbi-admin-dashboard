export const generateTrialPeriod = (date: Date) => {
  const currentDay = date.getDate();
  let lastDayOfPeriod: Date;

  if (currentDay <= 15) {
    // If date is on or before 15th, end date is last day of current month
    lastDayOfPeriod = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  } else {
    // If date is after 15th, end date is last day of next month
    lastDayOfPeriod = new Date(date.getFullYear(), date.getMonth() + 2, 0);
  }

  // Calculate remaining days until the end date
  const remainingDays = Math.ceil(
    (lastDayOfPeriod.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
  );

  // Convert remaining days to seconds
  const remainingSeconds = remainingDays * 24 * 60 * 60;

  // Add current timestamp to get the end date in seconds
  const trialEnd = Math.floor(date.getTime() / 1000) + remainingSeconds;

  return trialEnd;
};
