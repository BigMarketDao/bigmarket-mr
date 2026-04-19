export function truncate(str?: string, amount = 4) {
  if (!str) return "?";
  return `${str.slice(0, amount)}...${str.slice(-amount)}`;
}

export function truncateEnd(str?: string, amount = 4) {
  if (!str) return "?";
  return `..${str.slice(-amount)}`;
}
