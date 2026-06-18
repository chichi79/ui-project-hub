import { revalidatePath } from "next/cache";

export function revalidateProjectPages(projectId?: number) {
  revalidatePath("/");
  if (projectId) {
    revalidatePath(`/projects/${projectId}`);
  }
}
