import "server-only";

import {
  getBlogAuthors,
  replaceBlogAuthorsCache,
  saveBlogAuthor as saveAuthorMemory,
  deleteBlogAuthor as deleteAuthorMemory,
  type BlogAuthor,
} from "@/lib/cms/repositories/blog-authors-repository";
import {
  readCmsDocumentData,
  writeCmsDocumentData,
} from "@/lib/cms/server/cms-document.server";

export const BLOG_AUTHORS_DOC_ID = "blog-authors";

function isAuthors(value: unknown): value is BlogAuthor[] {
  return Array.isArray(value);
}

export async function readBlogAuthorsDurable(): Promise<BlogAuthor[]> {
  const remote = await readCmsDocumentData(BLOG_AUTHORS_DOC_ID);
  if (isAuthors(remote)) {
    replaceBlogAuthorsCache(remote);
  }
  return getBlogAuthors();
}

export async function saveBlogAuthorDurable(
  author: BlogAuthor
): Promise<BlogAuthor> {
  await readBlogAuthorsDurable();
  const saved = saveAuthorMemory(author);
  await writeCmsDocumentData(BLOG_AUTHORS_DOC_ID, "blog", getBlogAuthors());
  return saved;
}

export async function deleteBlogAuthorDurable(id: string): Promise<boolean> {
  await readBlogAuthorsDurable();
  const ok = deleteAuthorMemory(id);
  if (ok) {
    await writeCmsDocumentData(BLOG_AUTHORS_DOC_ID, "blog", getBlogAuthors());
  }
  return ok;
}
