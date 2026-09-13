/**
 * Host half of the Spanish language pack (dsh-locale-es).
 *
 * The pack contributes only client UI copy, so this entry registers nothing on
 * the Host. It is plain JavaScript, with no build step, so the profile can load
 * it without a transpiler.
 *
 * The registration happens in the browser half (lib/client.js), which the
 * client module scan discovers because this package declares `dsh.client`.
 */

export function apply() {}
