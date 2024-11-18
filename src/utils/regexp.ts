export const serializeRegExp = (exp: RegExp): Pick<RegExp, 'source' | 'flags'> => ({
  source: exp.source,
  flags: exp.flags,
});
