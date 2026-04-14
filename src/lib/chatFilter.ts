// Regex patterns for detecting links and phone numbers in messages
const URL_REGEX = /https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.(com|fr|org|net|io|dev|co|me|app|xyz|info|biz)[^\s]*/gi;
const PHONE_REGEX = /(\+?\d{1,4}[\s.-]?)?(\(?\d{2,4}\)?[\s.-]?){1,3}\d{2,4}/g;
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;

/**
 * Check if a message contains links, phone numbers or emails
 */
export function containsSensitiveContent(text: string): boolean {
  return URL_REGEX.test(text) || PHONE_REGEX.test(text) || EMAIL_REGEX.test(text);
}

/**
 * Mask sensitive content in a message for non-Pro users
 */
export function maskSensitiveContent(text: string): string {
  let result = text;
  result = result.replace(URL_REGEX, '🔒 [lien masqué - réservé aux abonnés Pro]');
  result = result.replace(EMAIL_REGEX, '🔒 [email masqué]');
  // Only mask phone-like sequences of 7+ digits
  result = result.replace(PHONE_REGEX, (match) => {
    const digits = match.replace(/\D/g, '');
    if (digits.length >= 7) return '🔒 [n° masqué]';
    return match;
  });
  return result;
}

/**
 * Check if sender is allowed to include sensitive content
 * Only Pro/Enterprise accounts can share links and phone numbers
 */
export function canShareSensitiveContent(senderAccountType?: string): boolean {
  return senderAccountType === 'pro' || senderAccountType === 'enterprise';
}

/**
 * Check if receiver can see sensitive content
 */
export function canSeeSensitiveContent(receiverAccountType?: string): boolean {
  return receiverAccountType === 'pro' || receiverAccountType === 'enterprise';
}
