'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'card' | 'notify'>('card')
  
  // 卡密表单
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [price, setPrice] = useState(199)
  const [uploading, setUploading] = useState(false)
  
  // 推送配置
  const [serverChanKey, setServerChanKey] = useState('')
  const [emailHost, setEmailHost] = useState('')
  const [emailPort, setEmailPort] = useState(465)
  const [emailUser, setEmailUser] = useState('')
  const [emailPass, setEmailPass] = useState('')
  const [emailTo, setEmailTo] = useState('')
  const [notifyOnCreate, setNotifyOnCreate] = useState(false)
  const [notifyOnPaid, setNotifyOnPaid] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)
  
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check')
        const data = await response.json()
        if (data.authenticated) {
          setAuthenticated(true)
          loadSettings()
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

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/settings')
      const data = await res.json()
      if (data) {
        setServerChanKey(data.serverChanKey || '')
        setEmailHost(data.emailHost || '')
        setEmailPort(data.emailPort || 465)
        setEmailUser(data.emailUser || '')
        setEmailPass(data.emailPass || '')
        setEmailTo(data.emailTo || '')
        setNotifyOnCreate(data.notifyOnCreate || false)
        setNotifyOnPaid(data.notifyOnPaid || false)
      }
    } catch (e) {
      console.error('加载配置失败:', e)
    }
  }

  const handleSaveSettings = async () => {
    setSavingSettings(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverChanKey,
          emailHost,
          emailPort,
          emailUser,
          emailPass,
          emailTo,
          notifyOnCreate,
          notifyOnPaid,
        })
      })
      if (res.ok) {
        alert('配置保存成功')
      } else {
        alert('保存失败')
      }
    } catch (e) {
      alert('保存失败')
    } finally {
      setSavingSettings(false)
    }
  }

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

  if (!authenticated) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)
    try {
      const cardCodes = content.split('\n').filter(line => line.trim())
      const response = await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content: cardCodes, price }),
      })
      if (response.ok) {
        alert('卡密上传成功')
        setTitle('')
        setContent('')
        setPrice(199)
      } else {
        const error = await response.json()
        alert(`上传失败: ${error.error}`)
      }
    } catch (error) {
      alert('上传失败，请检查网络连接')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">管理员后台</h1>
        </div>

        {/* Tab 切换 */}
        <div className="flex mb-6 bg-white rounded-lg p-1 shadow">
          <button
            onClick={() => setActiveTab('card')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'card' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            卡密管理
          </button>
          <button
            onClick={() => setActiveTab('notify')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'notify' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            推送配置
          </button>
        </div>

        <div className="bg-white py-8 px-6 shadow-xl rounded-lg border border-gray-200">
          {activeTab === 'card' ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">卡密标题</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="例如：新彩虹群发器解压密码"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  卡密内容 <span className="text-xs text-gray-500">(一行一个)</span>
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                  placeholder={`输入卡密，每行一个:\npassword1\npassword2`}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  当前卡密数量: {content.split('\n').filter(line => line.trim()).length}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">价格 (USDT)</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={uploading}
                className="w-full py-3 px-4 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 font-medium"
              >
                {uploading ? '上传中...' : '上传卡密'}
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              {/* 推送开关 */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <h3 className="font-medium text-gray-900">推送开关</h3>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-gray-700">订单创建成功后推送</span>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={notifyOnCreate}
                      onChange={(e) => setNotifyOnCreate(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-11 h-6 rounded-full transition-colors ${notifyOnCreate ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                      <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${notifyOnCreate ? 'translate-x-5' : ''}`}></div>
                    </div>
                  </div>
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-gray-700">支付成功后推送</span>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={notifyOnPaid}
                      onChange={(e) => setNotifyOnPaid(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-11 h-6 rounded-full transition-colors ${notifyOnPaid ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                      <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${notifyOnPaid ? 'translate-x-5' : ''}`}></div>
                    </div>
                  </div>
                </label>
              </div>

              {/* Server酱配置 */}
              <div className="border-t pt-6">
                <h3 className="font-medium text-gray-900 mb-4">Server酱配置</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SendKey</label>
                  <input
                    type="text"
                    value={serverChanKey}
                    onChange={(e) => setServerChanKey(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="SCT..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    从 <a href="https://sct.ftqq.com" target="_blank" className="text-indigo-600">sct.ftqq.com</a> 获取
                  </p>
                </div>
              </div>

              {/* 邮箱配置 */}
              <div className="border-t pt-6">
                <h3 className="font-medium text-gray-900 mb-4">邮箱推送配置</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">SMTP服务器</label>
                    <input
                      type="text"
                      value={emailHost}
                      onChange={(e) => setEmailHost(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="smtp.qq.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">端口</label>
                    <input
                      type="number"
                      value={emailPort}
                      onChange={(e) => setEmailPort(Number(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="465"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">发件邮箱</label>
                  <input
                    type="email"
                    value={emailUser}
                    onChange={(e) => setEmailUser(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="your@qq.com"
                  />
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">授权码/密码</label>
                  <input
                    type="password"
                    value={emailPass}
                    onChange={(e) => setEmailPass(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="邮箱授权码"
                  />
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">收件邮箱</label>
                  <input
                    type="email"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="receive@example.com"
                  />
                </div>
              </div>

              <button
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="w-full py-3 px-4 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 font-medium"
              >
                {savingSettings ? '保存中...' : '保存配置'}
              </button>
            </div>
          )}

          <div className="mt-6 text-center">
            <a href="/" className="text-indigo-600 hover:text-indigo-500 text-sm font-medium">
              返回首页
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
