import "server-only";

import {
  getBlogPosts,
  replaceBlogPostsCache,
  saveBlogPost as savePostMemory,
  deleteBlogPost as deletePostMemory,
  type CmsBlogPost,
} from "@/lib/cms/repositories/blog-repository";
import {
  readCmsDocumentData,
  writeCmsDocumentData,
} from "@/lib/cms/server/cms-document.server";

export const BLOG_POSTS_DOC_ID = "blog-posts";

function isPosts(value: unknown): value is CmsBlogPost[] {
  return Array.isArray(value);
}

export async function readBlogPostsDurable(): Promise<CmsBlogPost[]> {
  const remote = await readCmsDocumentData(BLOG_POSTS_DOC_ID);
  if (isPosts(remote) && remote.length >= 0) {
    replaceBlogPostsCache(remote);
  }
  return getBlogPosts();
}

export async function saveBlogPostDurable(
  post: CmsBlogPost
): Promise<CmsBlogPost> {
  await readBlogPostsDurable();
  const saved = savePostMemory(post);
  await writeCmsDocumentData(BLOG_POSTS_DOC_ID, "blog", getBlogPosts());
  return saved;
}

export async function deleteBlogPostDurable(id: string): Promise<boolean> {
  await readBlogPostsDurable();
  const ok = deletePostMemory(id);
  if (ok) {
    await writeCmsDocumentData(BLOG_POSTS_DOC_ID, "blog", getBlogPosts());
  }
  return ok;
}
