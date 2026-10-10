// src/components/Pathology/PathologySidebar.tsx
import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, BookOpen } from "lucide-react";
import { PathologyTree } from "../../data/pathologyTree";
import type { Chapter, Tree } from "../../data/pathologyTree";

const PathologySidebar: React.FC = () => {
  const [openParts, setOpenParts] = useState<Record<string, boolean>>({});
  const [openChapters, setOpenChapters] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState("");

  const togglePart = (part: string) =>
    setOpenParts((prev) => ({ ...prev, [part]: !prev[part] }));

  const toggleChapter = (chapterKey: string) =>
    setOpenChapters((prev) => ({ ...prev, [chapterKey]: !prev[chapterKey] }));

  const filteredTree: Tree = useMemo(() => {
    if (!searchTerm) return PathologyTree;
    const term = searchTerm.toLowerCase();
    const newTree: Tree = {};

    Object.entries(PathologyTree).forEach(([partKey, partValue]) => {
      const filteredChapters: Record<string, Chapter> = {};
      Object.entries(partValue.chapters).forEach(
        ([chapterKey, chapterValue]) => {
          const filteredPages = chapterValue.pages.filter((p) =>
            p.name.toLowerCase().includes(term),
          );
          if (filteredPages.length > 0) {
            filteredChapters[chapterKey] = {
              title: chapterValue.title,
              pages: filteredPages,
            };
          }
        },
      );
      if (Object.keys(filteredChapters).length > 0) {
        newTree[partKey] = {
          title: partValue.title,
          chapters: filteredChapters,
        };
      }
    });
    return newTree;
  }, [searchTerm]);

  const partDisplayName = (part: string) => {
    const match = part.match(/^part(\d+)$/);
    return match ? `第${Number(match[1])}部` : part;
  };

  const chapterDisplayName = (chapter: string) => {
    const match = chapter.match(/^chapter(\d+)$/);
    return match ? `第${Number(match[1])}章` : chapter;
  };

  return (
    <div className="flex flex-col h-full min-h-0 font-sans bg-gray-50 physio-sidebar">
      {/* ヘッダー */}
      <div className="flex items-center gap-2 p-3 font-extrabold text-xl border-b border-gray-300 bg-gradient-to-r from-blue-100 to-blue-200 shadow-md rounded-b-lg">
        <BookOpen className="w-6 h-6 text-gray-700" />
        病理学ナビ
      </div>

      {/* 検索 */}
      <div className="p-3 border-b border-gray-200 bg-white">
        <input
          type="text"
          placeholder="ページ名で検索"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900 font-semibold text-base shadow-sm"
        />
      </div>

      {/* ナビゲーション */}
      <div className="flex-1 overflow-auto p-2 space-y-2">
        {Object.entries(filteredTree).map(([partKey, partValue]) => (
          <div key={partKey} className="rounded-lg shadow-sm">
            {/* 部（part） */}
            <button
              type="button"
              aria-expanded={!!openParts[partKey]}
              className={`part-item flex items-center justify-between cursor-pointer px-3 py-2 rounded-lg transition-colors ${
                openParts[partKey] ? "bg-blue-100" : ""
              }`}
              onClick={() => togglePart(partKey)}
            >
              <span className="font-semibold">
                {partDisplayName(partKey)}　{partValue.title}
              </span>
              <ChevronRight
                className={`chevron w-5 h-5 text-gray-600 ${openParts[partKey] ? "rotate-90" : "rotate-0"}`}
              />
            </button>

            {openParts[partKey] &&
              Object.entries(partValue.chapters).map(
                ([chapterKey, chapterValue]) => {
                  const chapterToggleKey = `${partKey}-${chapterKey}`;
                  return (
                    <div key={chapterKey} className="ml-4 mt-1">
                      {/* 章（chapter） */}
                      <button
                        type="button"
                        aria-expanded={!!openChapters[chapterToggleKey]}
                        className={`chapter-item flex items-center justify-between cursor-pointer px-3 py-2 rounded-md transition-colors ${
                          openChapters[chapterToggleKey] ? "bg-blue-50" : ""
                        }`}
                        onClick={() => toggleChapter(chapterToggleKey)}
                      >
                        <span className="font-medium">
                          {chapterDisplayName(chapterKey)}　{chapterValue.title}
                        </span>

                        <ChevronRight
                          className={`chevron w-4 h-4 text-gray-500 ${openChapters[chapterToggleKey] ? "rotate-90" : "rotate-0"}`}
                        />
                      </button>

                      {/* ページ */}
                      {openChapters[chapterToggleKey] && (
                        <ul className="ml-6 mt-1 space-y-1 border-l border-gray-200 pl-3">
                          {chapterValue.pages.map((page) => (
                            <li key={page.name}>
                              <Link
                                to={page.path}
                                className="page-link block px-3 py-1.5 rounded-md transition font-medium"
                              >
                                {page.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                },
              )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PathologySidebar;
