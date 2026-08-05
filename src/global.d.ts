// Next's own ambient types (node_modules/next/types/global.d.ts) only declare
// '*.module.css' / '.sass' / '.scss'. Plain, non-module stylesheets like
// './globals.css' (imported for side effects only in src/app/layout.tsx) have
// no matching ambient module declaration, which some TS/editor setups report
// as "Cannot find module or type declarations for side-effect import of
// './globals.css'". This covers plain CSS side-effect imports project-wide.
declare module '*.css';
