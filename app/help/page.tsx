'use client';

export default function HelpPage() {
  return (
    <main className="px-3 py-4 sm:px-5 lg:px-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
        <header className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-soft">
          <h1 className="text-xl font-bold text-slate-900">帮助中心</h1>
          <p className="mt-1 text-sm text-slate-500">快速上手 PromptDock，了解所有功能</p>
        </header>

        {/* Keyboard Shortcuts */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">⌨️ 快捷键说明</h2>
          <p className="mb-3 text-sm text-slate-600">
            PromptDock 是网页应用，键盘快捷键依赖浏览器和操作系统本身：
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5">
              <kbd className="rounded border border-slate-300 bg-white px-2 py-0.5 text-xs font-mono font-medium text-slate-700 shadow-sm">
                Ctrl
              </kbd>
              <span className="text-sm text-slate-600">+</span>
              <kbd className="rounded border border-slate-300 bg-white px-2 py-0.5 text-xs font-mono font-medium text-slate-700 shadow-sm">
                C
              </kbd>
              <span className="text-sm text-slate-600">复制渲染后的提示词</span>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5">
              <kbd className="rounded border border-slate-300 bg-white px-2 py-0.5 text-xs font-mono font-medium text-slate-700 shadow-sm">
                Ctrl
              </kbd>
              <span className="text-sm text-slate-600">+</span>
              <kbd className="rounded border border-slate-300 bg-white px-2 py-0.5 text-xs font-mono font-medium text-slate-700 shadow-sm">
                V
              </kbd>
              <span className="text-sm text-slate-600">粘贴到 AI 平台输入框</span>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5">
              <kbd className="rounded border border-slate-300 bg-white px-2 py-0.5 text-xs font-mono font-medium text-slate-700 shadow-sm">
                Ctrl
              </kbd>
              <span className="text-sm text-slate-600">+</span>
              <kbd className="rounded border border-slate-300 bg-white px-2 py-0.5 text-xs font-mono font-medium text-slate-700 shadow-sm">
                Enter
              </kbd>
              <span className="text-sm text-slate-600">唤起「跳转 AI 平台」操作菜单</span>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5">
              <kbd className="rounded border border-slate-300 bg-white px-2 py-0.5 text-xs font-mono font-medium text-slate-700 shadow-sm">
                Tab
              </kbd>
              <span className="text-sm text-slate-600">在变量填写框之间快速切换</span>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-400">
            Mac 用户可将 Ctrl 替换为 ⌘ Command
          </p>
        </section>

        {/* How to use templates */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">📋 如何使用模板</h2>
          <ol className="list-inside list-decimal space-y-2 text-sm text-slate-700">
            <li>
              <strong>选择模板</strong> — 左侧模板列表选择内置模板，或上传自己的 .md 模板
            </li>
            <li>
              <strong>填写变量</strong> — 表格中填写各变量内容，股票变量可直接搜索选择
            </li>
            <li>
              <strong>复制提示词</strong> — 点击「复制提示词」按钮，提示词自动复制到剪贴板
            </li>
            <li>
              <strong>跳转到 AI 平台</strong> — 点击任意平台按钮（如 Claude、ChatGPT），自动粘贴并跳转
            </li>
          </ol>
          <div className="mt-3 rounded-lg border border-teal-100 bg-teal-50 px-4 py-2.5">
            <p className="text-sm text-teal-800">
              💡 内置模板支持自动填充日期、时间等变量，无需手动填写
            </p>
          </div>
        </section>

        {/* How to create good prompts */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">✍️ 如何写出好的提示词</h2>
          <div className="space-y-3">
            <div className="rounded-lg border border-slate-100 p-3">
              <p className="text-sm font-medium text-slate-800">1. 明确任务目标</p>
              <p className="mt-1 text-xs text-slate-600">
                开头说明要 AI 做什么：「你是一个 X，请帮我完成 Y」
              </p>
            </div>
            <div className="rounded-lg border border-slate-100 p-3">
              <p className="text-sm font-medium text-slate-800">2. 给出具体要求</p>
              <p className="mt-1 text-xs text-slate-600">
                避免模糊描述，列出具体格式、风格、字数等要求
              </p>
            </div>
            <div className="rounded-lg border border-slate-100 p-3">
              <p className="text-sm font-medium text-slate-800">3. 结构化输入</p>
              <p className="mt-1 text-xs text-slate-600">
                用分段落或编号组织信息，让 AI 更容易理解上下文
              </p>
            </div>
            <div className="rounded-lg border border-slate-100 p-3">
              <p className="text-sm font-medium text-slate-800">4. 添加约束条件</p>
              <p className="mt-1 text-xs text-slate-600">
                说明「不要做什么」，例如：不要编造数据、不要使用某格式
              </p>
            </div>
            <div className="rounded-lg border border-slate-100 p-3">
              <p className="text-sm font-medium text-slate-800">5. 提供示例</p>
              <p className="mt-1 text-xs text-slate-600">
                在模板中给出输入输出示例，帮助 AI 理解期望的格式
              </p>
            </div>
          </div>
        </section>

        {/* Template syntax reference */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">🔧 模板语法参考</h2>
          <p className="mb-3 text-sm text-slate-600">
            PromptDock 使用 <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono text-slate-800">[变量名]</code> 作为变量占位符：
          </p>
          <div className="space-y-2">
            <div className="flex items-start gap-3 rounded-lg border border-slate-100 p-3">
              <code className="shrink-0 rounded bg-teal-50 px-2 py-1 text-sm font-mono text-teal-700">
                [股票]
              </code>
              <div>
                <p className="text-sm font-medium text-slate-800">股票变量</p>
                <p className="text-xs text-slate-500">会自动显示股票搜索选择器，支持 A 股、港股、美股</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-slate-100 p-3">
              <code className="shrink-0 rounded bg-teal-50 px-2 py-1 text-sm font-mono text-teal-700">
                [日期]
              </code>
              <div>
                <p className="text-sm font-medium text-slate-800">自动日期</p>
                <p className="text-xs text-slate-500">
                  变量名含「今天、日期、current_date、today」自动填充当日日期
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-slate-100 p-3">
              <code className="shrink-0 rounded bg-teal-50 px-2 py-1 text-sm font-mono text-teal-700">
                [时间]
              </code>
              <div>
                <p className="text-sm font-medium text-slate-800">自动时间</p>
                <p className="text-xs text-slate-500">
                  变量名含「时间、current_time」自动填充当前时间
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-slate-100 p-3">
              <code className="shrink-0 rounded bg-teal-50 px-2 py-1 text-sm font-mono text-teal-700">
                [你的问题]
              </code>
              <div>
                <p className="text-sm font-medium text-slate-800">普通文本变量</p>
                <p className="text-xs text-slate-500">其他所有变量都按手动输入处理</p>
              </div>
            </div>
          </div>
          <div className="mt-3 rounded-lg border border-amber-100 bg-amber-50 px-4 py-2.5">
            <p className="text-sm text-amber-800">
              ⚠️ 变量名必须与模板中实际使用的名称完全一致才能自动填充
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">❓ 常见问题</h2>
          <div className="space-y-4">
            <details className="group rounded-lg border border-slate-200">
              <summary className="cursor-pointer select-none px-4 py-3 text-sm font-medium text-slate-800">
                上传的模板保存在哪里？
              </summary>
              <div className="px-4 pb-3 text-sm text-slate-600">
                本地模板保存在浏览器本地缓存（LocalStorage），不会上传到任何服务器。清除浏览器数据会导致模板丢失。
              </div>
            </details>
            <details className="group rounded-lg border border-slate-200">
              <summary className="cursor-pointer select-none px-4 py-3 text-sm font-medium text-slate-800">
                如何在不同设备间同步模板？
              </summary>
              <div className="px-4 pb-3 text-sm text-slate-600">
                目前不支持自动同步。可以将模板导出为 .md 文件，再上传到其他设备。
              </div>
            </details>
            <details className="group rounded-lg border border-slate-200">
              <summary className="cursor-pointer select-none px-4 py-3 text-sm font-medium text-slate-800">
                为什么股票搜索不到某些股票？
              </summary>
              <div className="px-4 pb-3 text-sm text-slate-600">
                股票数据每日更新一次。如发现缺失，可在 GitHub 提交 Issue 反馈。
              </div>
            </details>
            <details className="group rounded-lg border border-slate-200">
              <summary className="cursor-pointer select-none px-4 py-3 text-sm font-medium text-slate-800">
                如何投稿公共模板？
              </summary>
              <div className="px-4 pb-3 text-sm text-slate-600">
                通过 GitHub Pull Request 提交，或发送邮件至 tz@ittz.top。模板审核通过后会出现在内置模板列表中。
              </div>
            </details>
            <details className="group rounded-lg border border-slate-200">
              <summary className="cursor-pointer select-none px-4 py-3 text-sm font-medium text-slate-800">
                支持哪些 AI 平台？
              </summary>
              <div className="px-4 pb-3 text-sm text-slate-600">
                目前支持 Claude、ChatGPT、DeepSeek、Grok 等主流平台。点击平台按钮后，会自动打开新窗口并粘贴提示词。
              </div>
            </details>
          </div>
        </section>

        <footer className="px-1 pb-1 pt-2 text-center text-xs text-slate-500">
          <p>
            <a
              href="https://github.com/nbzz/PromptDock"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-slate-700 underline decoration-slate-300 underline-offset-2 hover:text-teal-700"
            >
              GitHub: PromptDock
            </a>
            {' · '}
            <a
              href="/"
              className="font-medium text-slate-700 underline decoration-slate-300 underline-offset-2 hover:text-teal-700"
            >
              返回首页
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}
