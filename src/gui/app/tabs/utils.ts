import type * as handlers from './handlers';

export const getSelectedTab = <K extends keyof typeof handlers>(): K => <K>location.hash.substring(1);
