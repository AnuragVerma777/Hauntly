/** Helpers for first-time onboarding state, persisted in localStorage. */

export const getOnboardingKey = (userId: string) => `hauntly-onboarded-${userId}`;

export function markOnboardingComplete(userId: string): void {
  localStorage.setItem(getOnboardingKey(userId), '1');
}

export function needsOnboarding(userId: string): boolean {
  return !localStorage.getItem(getOnboardingKey(userId));
}
