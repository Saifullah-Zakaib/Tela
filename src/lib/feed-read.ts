import { useEffect, useMemo, useState } from 'react';

type FeedMessage = {
  createdAt: string;
  sender?: { _id?: string };
};

function storageKey(projectId: string, role: string) {
  return `feed_last_read_${role}_${projectId}`;
}

export function getFeedLastReadAt(projectId: string, role: string): number {
  try {
    const value = localStorage.getItem(storageKey(projectId, role));
    return value ? Number(value) : 0;
  } catch {
    return 0;
  }
}

export function markFeedAsRead(projectId: string, role: string) {
  try {
    localStorage.setItem(storageKey(projectId, role), String(Date.now()));
  } catch {
    // ignore storage errors
  }
}

export function countUnreadFeedMessages(
  messages: FeedMessage[],
  lastReadAt: number,
  currentUserId?: string,
): number {
  if (!currentUserId) return 0;

  const userId = currentUserId.toString();
  return messages.filter((message) => {
    const senderId = message.sender?._id?.toString();
    if (!senderId || senderId === userId) return false;
    return new Date(message.createdAt).getTime() > lastReadAt;
  }).length;
}

export function useFeedUnread(
  projectId: string,
  role: 'freelancer' | 'client',
  messages: FeedMessage[],
  currentUserId: string | undefined,
  feedTabActive: boolean,
) {
  const [lastReadAt, setLastReadAt] = useState(() => getFeedLastReadAt(projectId, role));

  useEffect(() => {
    setLastReadAt(getFeedLastReadAt(projectId, role));
  }, [projectId, role]);

  useEffect(() => {
    if (feedTabActive) {
      markFeedAsRead(projectId, role);
      setLastReadAt(Date.now());
    }
  }, [feedTabActive, projectId, role, messages]);

  return useMemo(
    () => countUnreadFeedMessages(messages, lastReadAt, currentUserId),
    [messages, lastReadAt, currentUserId],
  );
}
