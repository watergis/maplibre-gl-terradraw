import api from '$api/index.js';
import { json } from '@sveltejs/kit';
import type { RequestEvent, RequestHandler } from './$types.js';

export const prerender = true;

export const GET: RequestHandler = async (event: RequestEvent) => json(await api.openapi(event));
