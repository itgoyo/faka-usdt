'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface TextReplace {
  id: number
  from: string
  to: string
}

export default function TelegramPage() {
  const router = useRouter()
  const [sourceChannel, setSourceChannel] = useState('')
  const [targetChannel, setTargetChannel] = useState('')
  const [textReplaces, setTextReplaces] = useState<TextReplace[]>([{ id: 1, from: '', to: '' }])
  const [keywords, setKeywords] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const addTextReplace = () => {
    setTextReplaces([...textReplaces, { id: Date.now(), from: '', to: '' }])
  }

  const removeTextReplace = (id: number) => {
    if (textReplaces.length > 1) {
      setTextReplaces(textReplaces.filter(item => item.id !== id))
    }
  }

  const updateTextReplace = (id: number, field: 'from' | 'to', value: string) => {
    setTextReplaces(textReplaces.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const handleSubmit = async () => {
    if (!sourceChannel.trim()) {
      setError('请输入监听的频道/群组地址')
      return
    }
    if (!targetChannel.trim()) {
      setError('请输入转发到的频道地址')
      return
    }

    setLoading(true)
    setError('')

    try {
      // 过滤掉空的文本替换规则
      const validReplaces = textReplaces.filter(item => item.from.trim() || item.to.trim())
      
      const formData = {
        sourceChannel: sourceChannel.trim(),
        targetChannel: targetChannel.trim(),
        textReplaces: validReplaces.map(item => ({ from: item.from, to: item.to })),
        keywords: keywords.trim()
      }

      // 保存到sessionStorage以便支付页面使用
      sessionStorage.setItem('telegramFormData', JSON.stringify(formData))
      
      // 创建订单
      const response = await fetch('/api/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        router.push(`/telegram/pay?orderId=${data.orderId}`)
      } else {
        setError(data.error || '订单创建失败')
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
            Telegram 监听转发服务
          </h1>
          <p className="text-xl text-gray-600">
            自动监听频道/群组消息并转发到您的频道
          </p>
        </div>

        {/* 重要提醒 */}
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6 mb-8">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-xl font-bold text-red-800 mb-2">
                重要提醒 - 请务必完成以下步骤
              </h3>
              <div className="text-red-700 space-y-2">
                <p className="font-semibold text-lg">
                  必须将以下两个Bot拉入您的频道，并给予管理员所有权限：
                </p>
                <div className="bg-red-100 rounded-lg p-4 mt-3">
                  <p className="text-xl font-mono font-bold text-red-900 mb-2">@xntb02bot</p>
                  <p className="text-xl font-mono font-bold text-red-900">@xntb09</p>
                </div>
                <p className="mt-3 text-sm">
                  如未正确添加Bot并授权管理员权限，转发服务将无法正常工作！
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-xl p-8 border border-gray-200">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* 监听频道 */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              监听的频道/群组地址 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={sourceChannel}
              onChange={(e) => setSourceChannel(e.target.value)}
              placeholder="例如: @channel_name 或 https://t.me/channel_name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
            <p className="mt-1 text-sm text-gray-500">输入您要监听的Telegram频道或群组地址</p>
          </div>

          {/* 转发到的频道 */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              转发到的频道地址 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={targetChannel}
              onChange={(e) => setTargetChannel(e.target.value)}
              placeholder="例如: @your_channel 或 https://t.me/your_channel"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
            <p className="mt-1 text-sm text-gray-500">输入您自己的频道地址，消息将转发到这里</p>
          </div>

          {/* 文本替换 */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-gray-700">
                文本替换规则 <span className="text-gray-400">(可选)</span>
              </label>
              <button
                type="button"
                onClick={addTextReplace}
                className="text-sm text-purple-600 hover:text-purple-800 font-medium flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                添加规则
              </button>
            </div>
            <div className="space-y-3">
              {textReplaces.map((item, index) => (
                <div key={item.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={item.from}
                    onChange={(e) => updateTextReplace(item.id, 'from', e.target.value)}
                    placeholder="原文本"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  />
                  <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                  <input
                    type="text"
                    value={item.to}
                    onChange={(e) => updateTextReplace(item.id, 'to', e.target.value)}
                    placeholder="替换为"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  />
                  {textReplaces.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTextReplace(item.id)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="mt-2 text-sm text-gray-500">转发时自动将原文本替换为新文本</p>
          </div>

          {/* 关键字过滤 */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              关键字过滤 <span className="text-gray-400">(可选)</span>
            </label>
            <textarea
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="广告 搬砖 赚钱"
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
            />
            <p className="mt-1 text-sm text-gray-500">
              包含这些关键字的消息将不会被转发，多个关键字用空格隔开
            </p>
          </div>

          {/* 价格说明 */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">服务费用</p>
                <p className="text-3xl font-bold text-purple-700">19.9 USDT</p>
              </div>
              <div className="text-right text-sm text-gray-500">
                <p>支付方式: TRC20</p>
                <p>有效期: 永久</p>
              </div>
            </div>
          </div>

          {/* 提交按钮 */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 px-6 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-bold text-lg transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                处理中...
              </span>
            ) : (
              '立即购买 - 前往支付'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
