export function withWorkspaceScope<Where extends Record<string, unknown>>(
  workspaceId: string,
  where: Where
): Where & { workspaceId: string } {
  return { ...where, workspaceId };
}
