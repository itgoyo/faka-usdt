'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [price, setPrice] = useState(199)
  const [uploading, setUploading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check')
        const data = await response.json()
        if (data.authenticated) {
          setAuthenticated(true)
        } else {
          router.push('/admin/login')
        }
      } catch (error) {
        console.error('Auth check error:', error)
        router.push('/admin/login')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">验证中...</p>
        </div>
      </div>
    )
  }

  if (!authenticated) {
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)

    try {
      // Split content by newlines and filter empty lines
      const cardCodes = content.split('\n').filter(line => line.trim())

      const response = await fetch('/api/cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content: cardCodes,
          price,
        }),
      })

      if (response.ok) {
        alert('卡密上传成功！')
        setTitle('')
        setContent('')
        setPrice(199)
      } else {
        const error = await response.json()
        alert(`上传失败: ${error.error}`)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('上传失败，请检查网络连接')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
            管理员后台
          </h1>
          <p className="text-gray-600">
            上传新的卡密商品
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow-xl rounded-lg border border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                卡密标题
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="例如：新彩虹群发器解压密码"
                required
              />
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                卡密内容
                <span className="text-xs text-gray-500 ml-2">(一行一个，或多行)</span>
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors font-mono text-sm"
                placeholder={`输入卡密，每行一个：\npassword1\npassword2\npassword3`}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                当前卡密数量: {content.split('\n').filter(line => line.trim()).length}
              </p>
            </div>

            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                价格 (CNY)
              </label>
              <input
                id="price"
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                min="0"
                step="0.01"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                required
              />
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {uploading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  上传中...
                </div>
              ) : (
                '上传卡密'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a
              href="/"
              className="text-indigo-600 hover:text-indigo-500 text-sm font-medium transition-colors"
            >
              ← 返回首页
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}