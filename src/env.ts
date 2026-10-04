import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({ PROTOMAP_KEY: { schema: (input) => input ?? '' } });
