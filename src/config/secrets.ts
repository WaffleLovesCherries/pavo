/**
 * The secret drawer's notes and its password, read from secrets.json next to this file:
 *
 *   {
 *     "password": "…",             what the keyhole asks for; case and surrounding space do not matter
 *     "title": "Para ti",          optional; the drawer's title when the notes open full size
 *     "notes": [
 *       { "text": "…", "pattern": "hearts" }   pattern optional: hearts, flowers, dots, stripes or stars
 *     ]
 *   }
 *
 * The password is hashed here at build time; only the hash reaches the page.
 */
import raw from './secrets.json';
import { parseSecrets } from '../lib/secret';

export const SECRETS = parseSecrets(raw);
