/** Base URL for links in emails (invite, verify, portal, etc.) */
export const getClientUrl = () => {
  const url = process.env.CLIENT_URL || 'http://localhost:8080';
  return url.replace(/\/$/, '');
};
