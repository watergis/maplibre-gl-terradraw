import api from '$api/index.js';
import type { RequestEvent, RequestHandler } from './$types.js';

export const GET: RequestHandler = (event: RequestEvent) => api.handle(event);
