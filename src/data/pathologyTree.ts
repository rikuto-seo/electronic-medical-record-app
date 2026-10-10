// src/data/PathologyTree.ts
export type Page = { name: string; path: string };
export type Chapter = { title: string; pages: Page[] };
export type Tree = Record<string, { title: string; chapters: Record<string, Chapter> }>;

// 病理学コンテンツは未登録。追加する際はここに目次を定義する。
export const PathologyTree: Tree = {};


