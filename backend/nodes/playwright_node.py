from typing import Any, Dict
from nodes.base import BaseNode, NodeInput, NodeOutput
from nodes import register_node


@register_node
class PlaywrightNode(BaseNode):
    node_type = "playwright"
    display_name = "Browser Automation"
    description = "Run headless browser automation with Playwright"

    async def execute(self, inputs: NodeInput, config: Dict[str, Any]) -> NodeOutput:
        try:
            from playwright.async_api import async_playwright
        except ImportError:
            raise RuntimeError("playwright not installed. Run: pip install playwright && playwright install chromium")

        url = config.get("url", "").strip()
        script = config.get("script", "").strip()

        if not url:
            raise ValueError("URL is required for Browser Automation node")

        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            await page.goto(url)

            output_data: Dict[str, Any] = {"url": url, "title": await page.title()}

            if script:
                local_vars: Dict[str, Any] = {"page": page, "output_data": output_data}
                exec(compile(script, "<playwright_script>", "exec"), {}, local_vars)
                output_data = local_vars.get("output_data", output_data)

            await browser.close()

        return NodeOutput(data=output_data)
