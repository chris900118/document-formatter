import { Modal, Input } from '@arco-design/web-react'
import { IconSearch } from '@arco-design/web-react/icon'
import { useState, useMemo } from 'react'

interface FontPickerModalProps {
    visible: boolean
    onCancel: () => void
    onSelect: (font: string) => void
    systemFonts: string[]
    recommendedFonts: string[]
}

export default function FontPickerModal({
    visible,
    onCancel,
    onSelect,
    systemFonts,
    recommendedFonts
}: FontPickerModalProps) {
    const [searchText, setSearchText] = useState('')

    // 过滤逻辑：
    // 1. 保留推荐字体
    // 2. 保留中文字体 (包含汉字)
    // 3. 保留 Times New Roman
    // 4. 过滤掉其他纯英文字体
    const filteredFonts = useMemo(() => {
        const validFonts = systemFonts.filter(font => {
            const isRecommended = recommendedFonts.includes(font)
            const isChinese = /[\u4e00-\u9fa5]/.test(font)
            const isTNR = font.toLowerCase() === 'times new roman'
            return isRecommended || isChinese || isTNR
        })

        // 合并推荐字体和系统筛选后的字体，并去重
        const allFonts = Array.from(new Set([...recommendedFonts, ...validFonts]))

        // 搜索过滤
        if (!searchText) return allFonts
        return allFonts.filter(f => f.toLowerCase().includes(searchText.toLowerCase()))
    }, [systemFonts, recommendedFonts, searchText])

    return (
        <Modal
            title="选择字体"
            visible={visible}
            onCancel={onCancel}
            footer={null}
            style={{ width: 800 }}
        >
            <div className="h-[500px] flex flex-col">
                <div className="mb-4 flex justify-between items-center">
                    <Input
                        prefix={<IconSearch />}
                        placeholder="搜索字体名称..."
                        style={{ width: 300 }}
                        value={searchText}
                        onChange={setSearchText}
                        allowClear
                    />
                    <span className="text-gray-500 text-sm">
                        共找到 {filteredFonts.length} 个字体 <span className="text-xs text-gray-400 ml-2">(已自动过滤非必要英文字体)</span>
                    </span>
                </div>

                <div className="flex-1 overflow-y-auto border rounded-lg bg-gray-50 p-2">
                    {filteredFonts.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-gray-400">未找到匹配的字体</div>
                    ) : (
                        <div className="grid grid-cols-3 gap-2">
                            {filteredFonts.map((font, idx) => (
                                <div
                                    key={idx}
                                    className="bg-white p-3 rounded border text-sm hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all cursor-pointer truncate text-center"
                                    title={font}
                                    onClick={() => {
                                        onSelect(font)
                                        onCancel()
                                    }}
                                >
                                    {font}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    )
}
