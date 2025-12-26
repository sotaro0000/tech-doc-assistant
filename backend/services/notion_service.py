import os
from typing import List, Dict, Optional
from notion_client import Client
from markdownify import markdownify as md

# Notionクライアント初期化
notion = Client(auth=os.getenv("NOTION_TOKEN"))


def block_to_markdown(block: Dict) -> str:
    """Notionブロックを Markdown に変換"""
    
    block_type = block.get("type")
    
    # テキストブロック
    if block_type == "paragraph":
        return extract_rich_text(block["paragraph"]["rich_text"]) + "\n\n"
    
    # 見出し
    elif block_type in ["heading_1", "heading_2", "heading_3"]:
        level = int(block_type[-1])
        text = extract_rich_text(block[block_type]["rich_text"])
        return f"{'#' * level} {text}\n\n"
    
    # 箇条書き
    elif block_type == "bulleted_list_item":
        text = extract_rich_text(block["bulleted_list_item"]["rich_text"])
        return f"- {text}\n"
    
    # 番号付きリスト
    elif block_type == "numbered_list_item":
        text = extract_rich_text(block["numbered_list_item"]["rich_text"])
        return f"1. {text}\n"
    
    # コードブロック
    elif block_type == "code":
        language = block["code"].get("language", "")
        text = extract_rich_text(block["code"]["rich_text"])
        return f"```{language}\n{text}\n```\n\n"
    
    # 引用
    elif block_type == "quote":
        text = extract_rich_text(block["quote"]["rich_text"])
        return f"> {text}\n\n"
    
    # To-do
    elif block_type == "to_do":
        checked = block["to_do"].get("checked", False)
        text = extract_rich_text(block["to_do"]["rich_text"])
        checkbox = "[x]" if checked else "[ ]"
        return f"- {checkbox} {text}\n"
    
    # 区切り線
    elif block_type == "divider":
        return "---\n\n"
    
    # テーブル（簡易対応）
    elif block_type == "table":
        return "[表は未対応]\n\n"
    
    # 画像
    elif block_type == "image":
        image_url = block["image"].get("file", {}).get("url") or block["image"].get("external", {}).get("url")
        caption = extract_rich_text(block["image"].get("caption", []))
        return f"![{caption}]({image_url})\n\n"
    
    # その他
    else:
        return ""


def extract_rich_text(rich_text_array: List[Dict]) -> str:
    """リッチテキスト配列からプレーンテキストを抽出"""
    
    result = ""
    for text_obj in rich_text_array:
        text = text_obj.get("plain_text", "")
        annotations = text_obj.get("annotations", {})
        
        # フォーマット適用
        if annotations.get("bold"):
            text = f"**{text}**"
        if annotations.get("italic"):
            text = f"*{text}*"
        if annotations.get("code"):
            text = f"`{text}`"
        if annotations.get("strikethrough"):
            text = f"~~{text}~~"
        
        # リンク
        if text_obj.get("href"):
            text = f"[{text}]({text_obj['href']})"
        
        result += text
    
    return result


async def get_notion_page_as_markdown(page_id: str) -> Dict:
    """NotionページをMarkdownとして取得"""
    
    try:
        # ページ情報取得
        page = notion.pages.retrieve(page_id=page_id)
        
        # タイトル取得
        title = ""
        if "properties" in page:
            for prop_name, prop_value in page["properties"].items():
                if prop_value.get("type") == "title" and prop_value.get("title"):
                    title = extract_rich_text(prop_value["title"])
                    break
        
        # ブロック取得（再帰的に全て取得）
        blocks = []
        has_more = True
        start_cursor = None
        
        while has_more:
            response = notion.blocks.children.list(
                block_id=page_id,
                start_cursor=start_cursor,
                page_size=100
            )
            blocks.extend(response["results"])
            has_more = response["has_more"]
            start_cursor = response.get("next_cursor")
        
        # Markdownに変換
        markdown_content = ""
        for block in blocks:
            markdown_content += block_to_markdown(block)
        
        return {
            "title": title or "Untitled",
            "content": markdown_content.strip(),
            "page_id": page_id,
            "url": page.get("url", ""),
            "created_time": page.get("created_time", ""),
            "last_edited_time": page.get("last_edited_time", "")
        }
    
    except Exception as e:
        raise Exception(f"Failed to fetch Notion page: {str(e)}")


async def search_notion_pages(query: Optional[str] = None) -> List[Dict]:
    """Notionページを検索"""
    
    try:
        search_params = {
            "filter": {
                "value": "page",
                "property": "object"
            },
            "page_size": 20
        }
        
        if query:
            search_params["query"] = query
        
        response = notion.search(**search_params)
        
        pages = []
        for page in response["results"]:
            # タイトル取得
            title = ""
            if "properties" in page:
                for prop_name, prop_value in page["properties"].items():
                    if prop_value.get("type") == "title" and prop_value.get("title"):
                        title = extract_rich_text(prop_value["title"])
                        break
            
            pages.append({
                "id": page["id"],
                "title": title or "Untitled",
                "url": page.get("url", ""),
                "created_time": page.get("created_time", ""),
                "last_edited_time": page.get("last_edited_time", "")
            })
        
        return pages
    
    except Exception as e:
        raise Exception(f"Failed to search Notion pages: {str(e)}")