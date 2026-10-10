// src/types/require-context.d.ts

interface WebpackRequireContext {
  (id: string): any;
  keys(): string[];
  resolve(id: string): string;
  id: string;
}

// Nodeのrequireを上書きせず、Webpackのcontextを拡張する。
declare namespace NodeJS {
  interface Require {
    context(path: string, deep?: boolean, filter?: RegExp): WebpackRequireContext;
  }
}
