import dayjsRelativeTimePlugin from 'dayjs/plugin/relativeTime';
import dayjs from 'dayjs';

import handlebars from './handlebars';

dayjs.extend(dayjsRelativeTimePlugin);
handlebars.init();
