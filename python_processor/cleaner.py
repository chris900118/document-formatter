"""
手动编号智能清洗模块
识别并清理文档中的手动编号（数字编号、中文数字、括号编号等）
"""
import re
from typing import Optional, Dict


class ManualNumberingCleaner:
    """手动编号检测与清洗器"""
    
    # 正则表达式模式
    PATTERNS = {
        'arabic': re.compile(r'^(\d+(\.\d+)*)[.．\s]+'),  # 数字+点/空格: "1.1 ", "2. "
        'chinese': re.compile(r'^((第?([一二三四五六七八九十百]+)[章节条]?) ?[、，,])'),  # 中文数字: "一、", "第二章"
        'parenthesis': re.compile(r'^([\(（\【\[]((\d+)|([一二三四五六七八九十]+))[\)）\】\]])'),  # 括号: "(1)", "（一）"
    }
    
    # 单位关键字（用于熔断保护）
    UNIT_KEYWORDS = ['kg', 'g', 'mg', 'km', 'm', 'cm', 'mm', '%', '年', '月', '日', '时', '分', '秒', 'G', 'GB', 'MB', 'TB']
    
    def __init__(self):
        pass
    
    def detect(self, text: str) -> Optional[Dict]:
        """
        检测文本中的手动编号
        
        Args:
            text: 要检测的文本
            
        Returns:
            如果检测到编号，返回字典: {
                'type': 'arabic' | 'chinese' | 'parenthesis',
                'raw_match': '1.1 ',  # 匹配到的原始编号
                'clean_text': '项目建设目标'  # 清洗后的文本
            }
            如果未检测到或触发熔断保护，返回 None
        """
        if not text or not isinstance(text, str):
            return None
        
        text = text.strip()
        if not text:
            return None
        
        # 遍历所有模式
        for pattern_type, pattern in self.PATTERNS.items():
            match = pattern.match(text)
            if match:
                raw_match = match.group(1) if match.lastindex >= 1 else match.group(0)
                clean_text = text[match.end():].strip()
                
                # 熔断保护 1: 编号长度检查
                if len(raw_match) > 15:
                    continue
                
                # 熔断保护 2: 数字编号年份检查（如 "2025. 年度规划"）
                if pattern_type == 'arabic':
                    # 提取第一个数字
                    first_num_match = re.match(r'^(\d+)', raw_match)
                    if first_num_match:
                        first_num = int(first_num_match.group(1))
                        if first_num > 50:  # 可能是年份
                            continue
                
                # 熔断保护 3: 剩余文本以单位开头（如 "10kg 重量"）
                if clean_text:
                    # 检查是否以单位关键字开头
                    clean_lower = clean_text.lower()
                    if any(clean_lower.startswith(unit.lower()) for unit in self.UNIT_KEYWORDS):
                        continue
                
                # 熔断保护 4: 清洗后文本为空或过短
                if not clean_text or len(clean_text) < 2:
                    continue
                
                return {
                    'type': pattern_type,
                    'raw_match': raw_match,
                    'clean_text': clean_text
                }
        
        return None


# 测试代码
if __name__ == '__main__':
    cleaner = ManualNumberingCleaner()
    
    test_cases = [
        "1.1 项目建设目标",
        "2. 项目范围",
        "一、总体要求",
        "第二章 技术方案",
        "(1) 需求分析",
        "（一）实施步骤",
        "2025. 年度规划",  # 应被忽略（年份）
        "10kg 重量标准",  # 应被忽略（单位）
        "正常文本无编号",  # 应返回 None
        "123456789012345. 超长编号",  # 应被忽略（长度）
    ]
    
    print("手动编号检测测试：\n")
    for text in test_cases:
        result = cleaner.detect(text)
        if result:
            print(f"✓ 检测到编号: '{text}'")
            print(f"  类型: {result['type']}, 编号: '{result['raw_match']}', 清洗后: '{result['clean_text']}'")
        else:
            print(f"✗ 未检测到: '{text}'")
        print()
