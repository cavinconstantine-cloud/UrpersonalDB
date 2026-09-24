import "server-only";

/** Postgres errors surface with a `code`/`message`; a discarded error here silently turns a real write failure into "nothing happened," which is what causes data to look lost. */
export function throwIfError(error: { message: string } | null, action: string) {
  if (error) throw new Error(`Gagal ${action}: ${error.message}`);
}
