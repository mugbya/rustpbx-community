// prismjs 的语言包以 `prismjs/components/prism-xxx` 形式按需引入，
// 但 @types/prismjs 仅为主入口提供了类型声明，未覆盖各语言子模块。
// 这里统一声明这些副作用模块（它们注册语法后无导出内容）。
declare module 'prismjs/components/prism-*'
