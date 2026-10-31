import { drizzle } from 'drizzle-orm/d1';
import * as schema from './models';

export function database(binding: D1Database) {
    return drizzle(binding, { schema });
}
