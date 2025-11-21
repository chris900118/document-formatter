#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试格式化功能
"""

import json
from formatter import format_document

# 测试配置
test_profile = {
    "documentTitle": {
        "fontFamily": "宋体",
        "fontSize": 42,
        "bold": True,
        "color": "#000000",
        "alignment": "center",
        "lineSpacing": 1.5,
        "spaceBefore": 35,
        "spaceAfter": 35,
        "firstLineIndent": 0
    },
    "body": {
        "fontFamily": "微软雅黑",
        "fontSize": 22,
        "bold": False,
        "color": "#000000",
        "alignment": "left",
        "lineSpacing": 1.5,
        "spaceBefore": 28,
        "spaceAfter": 0,
        "firstLineIndent": 0
    },
    "heading1": {
        "fontFamily": "黑体",
        "fontSize": 16,
        "bold": True,
        "color": "#000000",
        "alignment": "left",
        "lineSpacing": 1.5,
        "spaceBefore": 0,
        "spaceAfter": 0,
        "firstLineIndent": 0
    },
    "heading2": {
        "fontFamily": "黑体",
        "fontSize": 14,
        "bold": True,
        "color": "#000000",
        "alignment": "left",
        "lineSpacing": 1.5,
        "spaceBefore": 0,
        "spaceAfter": 0,
        "firstLineIndent": 0
    },
    "heading3": {
        "fontFamily": "黑体",
        "fontSize": 12,
        "bold": True,
        "color": "#000000",
        "alignment": "left",
        "lineSpacing": 1.5,
        "spaceBefore": 0,
        "spaceAfter": 0,
        "firstLineIndent": 0
    },
    "heading4": {
        "fontFamily": "黑体",
        "fontSize": 12,
        "bold": True,
        "color": "#000000",
        "alignment": "left",
        "lineSpacing": 1.5,
        "spaceBefore": 0,
        "spaceAfter": 0,
        "firstLineIndent": 0
    }
}

# 测试映射（将前两段设为 documentTitle，其他为 body）
test_mappings = {
    "0": "documentTitle",
    "1": "documentTitle"
}

# 输入输出路径（请根据实际情况修改）
input_path = r"D:\test_input.docx"  # 修改为你的测试文档路径
output_path = r"D:\test_output_formatted.docx"

print("开始测试格式化...")
print(f"输入文件: {input_path}")
print(f"输出文件: {output_path}")
print(f"\n应用的规范:")
print(json.dumps(test_profile, ensure_ascii=False, indent=2))
print(f"\n映射关系:")
print(json.dumps(test_mappings, ensure_ascii=False, indent=2))

result = format_document(input_path, test_profile, output_path, test_mappings)
print(f"\n格式化结果:")
print(json.dumps(result, ensure_ascii=False, indent=2))

if result.get("success"):
    print(f"\n✓ 格式化成功! 请打开文件查看: {output_path}")
else:
    print(f"\n✗ 格式化失败: {result.get('error')}")
