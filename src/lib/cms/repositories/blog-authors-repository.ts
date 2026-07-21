export interface BlogAuthor {
  id: string;
  name: string;
  email: string;
}

const defaultAuthors = (): BlogAuthor[] => [
  { id: "editorial", name: "Oboya Editorial", email: "editorial@oboya.cc" },
  { id: "marketing", name: "Marketing Team", email: "marketing@oboya.cc" },
];

let cache: BlogAuthor[] | null = null;

export function getBlogAuthors(): BlogAuthor[] {
  if (!cache) cache = defaultAuthors();
  return cache;
}

export function getBlogAuthorById(id: string): BlogAuthor | undefined {
  return getBlogAuthors().find((a) => a.id === id);
}

export function saveBlogAuthor(author: BlogAuthor): BlogAuthor {
  const authors = getBlogAuthors();
  const idx = authors.findIndex((a) => a.id === author.id);
  if (idx >= 0) authors[idx] = author;
  else authors.push(author);
  cache = authors;
  return author;
}

export function deleteBlogAuthor(id: string): boolean {
  const authors = getBlogAuthors();
  const idx = authors.findIndex((a) => a.id === id);
  if (idx < 0) return false;
  authors.splice(idx, 1);
  cache = authors;
  return true;
}
