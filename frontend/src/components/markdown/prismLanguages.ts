import { Prism } from 'prism-react-renderer'

// prism-react-renderer 内部使用自己打包的 Prism 实例，已内置常用语言
// （js/ts/jsx/tsx/python/go/bash/sql/json/yaml/css/markdown/diff/c/cpp/
// rust/kotlin/swift 等）。这里仅补充它未内置的语言。
//
// prismjs 的语言包以 `prismjs/components/prism-xxx` 引入，它们是 IIFE，
// 执行时会读取全局的 Prism 变量来注册语法。因此需要先把
// prism-react-renderer 的 Prism 实例挂到 globalThis.Prism，再动态 import。
// 不能用静态 import：模块求值顺序无法保证先赋值再执行语言包。
// 也不能用 top-level await：当前构建目标（es2020/safari14）不支持。

// 标记是否已加载，避免重复执行
let loaded = false

// 按需补充 prism-react-renderer 未内置的语言
export async function loadExtraLanguages(): Promise<void> {
  if (loaded) return
  loaded = true
  ;(globalThis as any).Prism = Prism
  await Promise.all([
    import('prismjs/components/prism-java'),
    import('prismjs/components/prism-php'),
    import('prismjs/components/prism-ruby'),
    import('prismjs/components/prism-docker'),
    import('prismjs/components/prism-toml'),
    import('prismjs/components/prism-ini'),
  ])
}
