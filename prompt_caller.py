#!/usr/bin/env python3
"""
Prompt Caller - 快速调用和填充 prompt 模板
支持股票搜索、自动变量、多平台跳转

使用方法: python3 prompt_caller.py
"""

import json
import os
import re
import sys
import webbrowser
from datetime import datetime
from pathlib import Path
from urllib.parse import quote

# 可选依赖：pyperclip（用于剪贴板功能）
try:
    import pyperclip
    CLIPBOARD_AVAILABLE = True
except ImportError:
    CLIPBOARD_AVAILABLE = False
    pyperclip = None

# 可选依赖：prompt_toolkit（用于实时联想功能）
try:
    from prompt_toolkit import prompt
    from prompt_toolkit.completion import Completer, Completion
    PROMPT_TOOLKIT_AVAILABLE = True

    class StockCompleter(Completer):
        """股票自动完成器（用于 prompt_toolkit）"""

        def __init__(self, stocks_data):
            self.stocks_data = stocks_data

        def get_completions(self, document, complete_event):
            """获取自动完成建议"""
            text = document.text_before_cursor

            if len(text) < 1:
                return

            # 搜索匹配的股票
            text_lower = text.lower()
            count = 0
            max_results = 10

            for stock in self.stocks_data:
                if count >= max_results:
                    break

                code = stock.get('code', '')
                name = stock.get('name', '')
                market = stock.get('market', '')

                if text_lower in code.lower() or text_lower in name.lower():
                    # 格式化显示
                    display = f"{name} ({code}) [{market}]"
                    # 实际插入的文本
                    insert_text = f"{name}，{code}"

                    yield Completion(
                        insert_text,
                        start_position=-len(text),
                        display=display,
                        display_meta=market
                    )
                    count += 1

except ImportError:
    PROMPT_TOOLKIT_AVAILABLE = False


class PromptCaller:
    def __init__(self, base_dir=None):
        """初始化 Prompt Caller"""
        if base_dir is None:
            base_dir = Path(__file__).parent
        else:
            base_dir = Path(base_dir)

        self.base_dir = base_dir
        self.prompts_dir = base_dir / "prompts"
        self.stocks_file = base_dir / "stocks.json"
        self.stocks_data = None

        # AI 平台 URL 模板
        self.platforms = {
            'pplx': 'https://www.perplexity.ai/',  # Perplexity 手动粘贴
            'yuanbao': 'https://yuanbao.tencent.com/',  # 元宝需要手动粘贴
            'openai': 'https://chat.openai.com/',  # OpenAI 需要手动粘贴
            'deepseek': 'https://chat.deepseek.com/',  # DeepSeek 需要手动粘贴
            'kimi': 'https://kimi.moonshot.cn/',  # Kimi 需要手动粘贴
            'doubao': 'https://www.doubao.com/chat/',  # 豆包需要手动粘贴
            'gemini': 'https://gemini.google.com/app',  # Gemini 需要手动粘贴
            'grok': 'https://x.com/i/grok',  # Grok 需要手动粘贴
        }

    def load_stocks(self):
        """加载股票数据"""
        if self.stocks_data is not None:
            return self.stocks_data

        try:
            with open(self.stocks_file, 'r', encoding='utf-8') as f:
                self.stocks_data = json.load(f)
            print(f"✓ 已加载 {len(self.stocks_data)} 只股票")
            return self.stocks_data
        except FileNotFoundError:
            print(f"警告: 股票数据文件不存在: {self.stocks_file}")
            self.stocks_data = []
            return []
        except json.JSONDecodeError as e:
            print(f"错误: 股票数据文件格式错误: {e}")
            self.stocks_data = []
            return []

    def search_stocks(self, query, limit=10):
        """搜索股票"""
        if not self.stocks_data:
            self.load_stocks()

        if not query or len(query) < 1:
            return []

        query_lower = query.lower()
        results = []

        for stock in self.stocks_data:
            if len(results) >= limit:
                break

            code = stock.get('code', '')
            name = stock.get('name', '')

            if query_lower in code.lower() or query_lower in name.lower():
                results.append(stock)

        return results

    def format_stock(self, stock):
        """格式化股票显示"""
        return f"{stock['name']}，{stock['code']}"

    def get_prompts(self):
        """获取所有 prompt 文件"""
        if not self.prompts_dir.exists():
            print(f"错误: prompts 目录不存在: {self.prompts_dir}")
            return []

        prompts = []
        for file in self.prompts_dir.glob("*.md"):
            if file.name != "README.md":
                prompts.append(file)

        return sorted(prompts)

    def extract_variables(self, content):
        """从内容中提取变量 [变量名]"""
        variables = []
        seen = set()

        # 匹配 [变量名] 格式
        pattern = r'\[([^\]]+)\]'
        matches = re.finditer(pattern, content)

        for match in matches:
            placeholder = match.group(1).strip()
            if placeholder not in seen:
                seen.add(placeholder)

                # 判断变量类型
                var_type = 'text'
                auto_fill = None

                if placeholder in ['日期', '当前日期']:
                    var_type = 'date'
                    auto_fill = 'date'
                elif placeholder in ['时间', '当前时间']:
                    var_type = 'time'
                    auto_fill = 'time'
                elif '股票' in placeholder:
                    var_type = 'stock'

                variables.append({
                    'id': placeholder,
                    'name': placeholder,
                    'type': var_type,
                    'auto_fill': auto_fill
                })

        return variables

    def execute_auto_fill(self, var_type):
        """执行自动填充"""
        now = datetime.now()

        if var_type == 'date':
            return now.strftime('%Y-%m-%d')
        elif var_type == 'time':
            return now.strftime('%H:%M:%S')

        return ''

    def render_template(self, content, values):
        """渲染模板"""
        result = content

        for placeholder, value in values.items():
            pattern = r'\[' + re.escape(placeholder) + r'\]'
            result = re.sub(pattern, value, result)

        return result

    def select_prompt(self):
        """选择 prompt"""
        prompts = self.get_prompts()

        if not prompts:
            print("错误: 没有找到任何 prompt 文件")
            return None

        print("\n可用的 Prompts:")
        print("-" * 50)
        for i, prompt in enumerate(prompts, 1):
            print(f"{i}. {prompt.stem}")
        print("-" * 50)

        while True:
            try:
                choice = input(f"\n请选择 prompt (1-{len(prompts)}) 或按 q 退出: ").strip()
                if choice.lower() == 'q':
                    return None

                idx = int(choice) - 1
                if 0 <= idx < len(prompts):
                    return prompts[idx]
                else:
                    print(f"请输入 1-{len(prompts)} 之间的数字")
            except ValueError:
                print("请输入有效的数字")
            except KeyboardInterrupt:
                print("\n\n已取消")
                return None

    def input_variable(self, variable):
        """输入单个变量"""
        var_name = variable['name']
        var_type = variable['type']
        auto_fill = variable.get('auto_fill')

        # 自动填充
        if auto_fill:
            value = self.execute_auto_fill(auto_fill)
            print(f"  {var_name}: {value} (自动填充)")
            return value

        # 股票类型
        if var_type == 'stock':
            return self.input_stock(var_name)

        # 普通文本输入
        value = input(f"  {var_name}: ").strip()
        return value

    def input_stock(self, var_name):
        """输入股票（带搜索和实时联想）"""
        # 确保股票数据已加载
        if not self.stocks_data:
            self.load_stocks()

        # 如果有 prompt_toolkit，使用实时联想
        if PROMPT_TOOLKIT_AVAILABLE:
            return self.input_stock_with_autocomplete(var_name)
        else:
            return self.input_stock_simple(var_name)

    def input_stock_with_autocomplete(self, var_name):
        """使用 prompt_toolkit 的实时联想输入"""
        print(f"  {var_name} (输入股票代码或名称，支持实时联想):")
        print("    提示: 输入时会显示匹配的股票，使用 ↓↑ 选择，Tab/Enter 确认")

        completer = StockCompleter(self.stocks_data)

        try:
            result = prompt("    > ", completer=completer)
            if result:
                return result.strip()
            else:
                print("    未输入，请重新输入")
                return self.input_stock_with_autocomplete(var_name)
        except KeyboardInterrupt:
            raise
        except Exception as e:
            print(f"    输入出错: {e}")
            # 降级到简单模式
            return self.input_stock_simple(var_name)

    def input_stock_simple(self, var_name):
        """简单的股票输入（无实时联想）"""
        while True:
            query = input(f"  {var_name} (输入股票代码或名称): ").strip()

            if not query:
                continue

            results = self.search_stocks(query, limit=8)

            if not results:
                print("    未找到匹配的股票，请重新输入")
                continue

            if len(results) == 1:
                # 只有一个结果，直接使用
                stock = results[0]
                formatted = self.format_stock(stock)
                print(f"    → {formatted}")
                return formatted

            # 多个结果，让用户选择
            print("\n    搜索结果:")
            for i, stock in enumerate(results, 1):
                market_badge = stock.get('market', '')
                print(f"    {i}. {stock['name']} ({stock['code']}) [{market_badge}]")

            try:
                choice = input(f"    选择 (1-{len(results)}): ").strip()
                idx = int(choice) - 1
                if 0 <= idx < len(results):
                    stock = results[idx]
                    formatted = self.format_stock(stock)
                    return formatted
                else:
                    print(f"    请输入 1-{len(results)} 之间的数字")
            except ValueError:
                print("    请输入有效的数字")

    def select_output_method(self):
        """选择输出方式"""
        print("\n输出方式:")
        print("-" * 50)

        options = []
        if CLIPBOARD_AVAILABLE:
            print("1. 复制到剪贴板")
            options.append('clipboard')
        else:
            print("1. 复制到剪贴板 (需安装 pyperclip)")
            options.append('clipboard')

        print("2. 跳转到 Perplexity (pplx) - 推荐 (需手动粘贴)")
        print("3. 跳转到 元宝 (yuanbao) - 国产推荐")
        print("4. 跳转到 OpenAI")
        print("5. 跳转到 DeepSeek")
        print("6. 跳转到 Kimi")
        print("7. 跳转到 豆包 (doubao)")
        print("8. 跳转到 Gemini")
        print("9. 跳转到 Grok")
        options.extend(['pplx', 'yuanbao', 'openai', 'deepseek', 'kimi', 'doubao', 'gemini', 'grok'])
        print("-" * 50)
        print("提示: 所有平台都需手动粘贴 (Cmd+V)")

        while True:
            try:
                choice = input("\n请选择输出方式 (1-9，默认 2): ").strip()
                if not choice:
                    choice = '2'

                idx = int(choice)
                if 1 <= idx <= 9:
                    return options[idx - 1]
                else:
                    print("请输入 1-9 之间的数字")
            except ValueError:
                print("请输入有效的数字")
            except KeyboardInterrupt:
                print("\n\n已取消")
                return None

    def output_result(self, content, method):
        """输出结果"""
        if method == 'clipboard':
            if not CLIPBOARD_AVAILABLE:
                print("\n⚠️  剪贴板功能不可用")
                print("提示: 安装 pyperclip 可启用剪贴板功能")
                print("      pip install pyperclip")
                print("\n内容已显示在下方，请手动复制:")
                print("-" * 50)
                print(content)
                print("-" * 50)
                return True

            try:
                pyperclip.copy(content)
                print("\n✓ 已复制到剪贴板")
                return True
            except Exception as e:
                print(f"\n错误: 复制到剪贴板失败: {e}")
                print("\n内容已显示在下方，请手动复制:")
                print("-" * 50)
                print(content)
                print("-" * 50)
                return False

        elif method in self.platforms:
            url_template = self.platforms[method]

            # 对于需要手动粘贴的平台，先复制到剪贴板
            if method in ['pplx', 'yuanbao', 'openai', 'deepseek', 'kimi', 'doubao', 'gemini', 'grok']:
                # 先复制到剪贴板
                if CLIPBOARD_AVAILABLE:
                    try:
                        pyperclip.copy(content)
                        print(f"\n✓ 内容已复制到剪贴板")
                    except:
                        pass

                # 打开平台（不带参数）
                try:
                    webbrowser.open(url_template)
                    print(f"✓ 已在浏览器中打开 {method.upper()}")
                    print(f"💡 提示: 内容已复制到剪贴板，请在 {method.upper()} 中粘贴 (Cmd+V)")
                    return True
                except Exception as e:
                    print(f"\n错误: 打开浏览器失败: {e}")
                    return False
            else:
                # 对于支持 URL 参数的平台（Perplexity）
                url = url_template.format(quote(content))

                try:
                    webbrowser.open(url)
                    print(f"\n✓ 已在浏览器中打开 {method.upper()}")
                    return True
                except Exception as e:
                    print(f"\n错误: 打开浏览器失败: {e}")
                    return False

        else:
            print(f"\n错误: 未知的输出方式: {method}")
            return False

    def run(self):
        """运行主程序"""
        print("=" * 50)
        print("  Prompt Caller - 快速调用 Prompt 模板")
        if PROMPT_TOOLKIT_AVAILABLE:
            print("  ✨ 实时联想已启用")
        print("=" * 50)

        # 1. 选择 prompt
        prompt_file = self.select_prompt()
        if not prompt_file:
            return

        # 2. 读取 prompt 内容
        try:
            with open(prompt_file, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception as e:
            print(f"\n错误: 读取文件失败: {e}")
            return

        # 3. 提取变量
        variables = self.extract_variables(content)

        if not variables:
            print("\n该 prompt 没有变量，直接使用原内容")
            result = content
        else:
            # 4. 输入变量
            print(f"\n请输入变量 (共 {len(variables)} 个):")
            print("-" * 50)

            values = {}
            for var in variables:
                value = self.input_variable(var)
                values[var['id']] = value

            # 5. 渲染模板
            result = self.render_template(content, values)

        # 6. 显示结果预览
        print("\n" + "=" * 50)
        print("生成的 Prompt 预览:")
        print("=" * 50)
        preview_lines = result.split('\n')[:10]
        print('\n'.join(preview_lines))
        if len(result.split('\n')) > 10:
            print("...")
        print("=" * 50)

        # 7. 选择输出方式
        method = self.select_output_method()
        if not method:
            return

        # 8. 输出结果
        self.output_result(result, method)

        print("\n完成！")


def main():
    """主函数"""
    # 支持命令行参数指定目录
    if len(sys.argv) > 1:
        base_dir = sys.argv[1]
    else:
        base_dir = None

    caller = PromptCaller(base_dir)

    try:
        caller.run()
    except KeyboardInterrupt:
        print("\n\n已取消")
        sys.exit(0)


if __name__ == "__main__":
    main()
