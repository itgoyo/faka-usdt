'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import * as QRCode from 'qrcode'

function PayContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const orderId = searchParams.get('orderId')

  const [paymentData, setPaymentData] = useState<any>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [success, setSuccess] = useState(false)
  const [copied, setCopied] = useState(false)
  const [timeLeft, setTimeLeft] = useState<number>(10 * 60)
  const [orderExpired, setOrderExpired] = useState(false)
  const [error, setError] = useState<string>('')
  const [testLoading, setTestLoading] = useState(false)

  useEffect(() => {
    if (orderId) {
      fetchOrder()
    } else {
      setError('订单不存在')
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null
    if (timeLeft > 0 && !success && !orderExpired) {
      timer = setTimeout(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setOrderExpired(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => { if (timer) clearTimeout(timer) }
  }, [timeLeft, success, orderExpired])

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/telegram/${orderId}`)
      const data = await response.json()

      if (response.ok && data.order) {
        setPaymentData(data.order)
        const qrUrl = await QRCode.toDataURL(data.order.walletAddress)
        setQrCodeUrl(qrUrl)

        // 计算剩余时间
        const orderTime = new Date(data.order.createdAt)
        const currentTime = new Date()
        const elapsedSeconds = Math.floor((currentTime.getTime() - orderTime.getTime()) / 1000)
        const remainingSeconds = Math.max(0, (10 * 60) - elapsedSeconds)

        if (remainingSeconds > 0) {
          setTimeLeft(remainingSeconds)
          checkPayment()
        } else {
          setOrderExpired(true)
        }
      } else {
        setError(data.error || '订单不存在')
      }
    } catch (err) {
      setError('网络错误')
    } finally {
      setLoading(false)
    }
  }

  const checkPayment = async () => {
    if (!orderId) return
    setChecking(true)
    try {
      const response = await fetch(`/api/telegram/${orderId}/check`)
      const data = await response.json()
      if (data.success) {
        setSuccess(true)
        return
      }
    } catch (err) {
      console.error('检查支付状态失败:', err)
    }

    if (!success && !orderExpired) {
      setTimeout(checkPayment, 15000)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // 测试支付（仅开发环境）
  const handleTestPay = async () => {
    if (!orderId) return
    setTestLoading(true)
    try {
      const res = await fetch(`/api/telegram/${orderId}/test-pay`, { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setSuccess(true)
      } else {
        alert(data.error || '测试支付失败')
      }
    } catch (err) {
      alert('测试支付请求失败')
    } finally {
      setTestLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full border border-red-200">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-red-800 mb-2">出错了</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link
              href="/telegram"
              className="inline-block py-3 px-6 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
            >
              返回重试
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-xl shadow-xl p-8 border border-green-200">
            <div className="text-center mb-6">
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-4">
                <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-green-800 mb-2">
                支付成功！
              </h1>
              <p className="text-gray-600">
                您的转发服务已成功开通
              </p>
            </div>

            <div className="bg-green-50 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-green-800 mb-3">服务已激活</h3>
              <div className="text-sm text-green-700 space-y-2">
                <p>您的配置已保存，转发服务将很快生效。</p>
                <p>请确保Bot已正确添加到您的频道并拥有管理员权限。</p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <svg className="h-5 w-5 text-yellow-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                </svg>
                <div>
                  <p className="text-sm text-yellow-800 font-medium">再次提醒</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    请确保 @xntb02bot 和 @xntb09 已添加到您的频道并拥有管理员权限
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Link
                href="/telegram"
                className="block w-full text-center py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
              >
                继续添加新的监听
              </Link>

              <a
                href="https://t.me/tgxiunv"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center py-3 px-4 bg-white border-2 border-green-600 text-green-600 font-medium rounded-lg hover:bg-green-50 transition-all"
              >
                <span className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18.717-.962 4.084-1.362 5.411-.168.56-.505 1.473-.884 1.573-.38.1-.633.066-.917-.146-.21-.157-.433-.399-.607-.593l-.862-.88c-.505-.517-1.108-.888-1.108-.888s-.172-.078-.157-.205c.01-.074.054-.126.054-.126l.848-.809c.505-.483 1.071-1.004 1.435-1.371.364-.368.725-.766.725-1.005 0-.24-.136-.35-.315-.35-.18 0-.458.132-.726.274l-2.055 1.074c-.505.263-1.001.523-1.001.523s-.505.263-.883.35c-.379.087-.758.087-.758.087s-.631-.044-.947-.175c-.316-.13-.631-.262-.631-.262s-.315-.13-.44-.262c-.126-.131-.063-.328-.063-.328s.063-.131.315-.35l6.12-5.89c.252-.241.631-.372 1.01-.372.379 0 .884.218 1.01.567.125.35.125.655-.126 1.353z"/>
                  </svg>
                  联系客服
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!paymentData) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-xl shadow-xl p-8 border border-gray-200">
          <div className="text-center mb-8">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-purple-100 mb-4">
              <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              USDT支付
            </h1>
            <p className="text-gray-600">
              完成支付后服务将自动开通
            </p>
          </div>

          <div className={`bg-gradient-to-r rounded-lg p-6 text-white text-center mb-6 ${orderExpired ? 'from-red-500 to-pink-600' : 'from-purple-500 to-blue-600'}`}>
            <p className="text-sm opacity-90 mb-1">支付金额</p>
            <p className="text-3xl font-bold">{paymentData.amount} USDT</p>
            {orderExpired ? (
              <p className="text-xl opacity-90 mt-2">
                <span className="font-bold text-yellow-300">订单已过期</span>
              </p>
            ) : (
              <p className="text-xl opacity-90 mt-2">
                剩余时间: <span className="font-bold text-yellow-300 text-2xl">{formatTime(timeLeft)}</span>
              </p>
            )}
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-gray-700">订单号</span>
              <span className="text-sm text-gray-900 font-mono">{paymentData.id}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">网络</span>
              <span className="text-sm text-gray-900">TRC20</span>
            </div>
          </div>

          <div className="text-center mb-6">
            <p className="text-sm text-gray-600 mb-4 font-medium">
              扫描二维码或复制地址进行转账
            </p>

            {qrCodeUrl && (
              <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block mb-4">
                <img
                  src={qrCodeUrl}
                  alt="USDT Payment QR Code"
                  className="w-48 h-48"
                />
              </div>
            )}

            <div className="bg-gray-100 rounded-lg p-4 mb-4 relative">
              <p className="text-xs text-gray-500 mb-2">钱包地址</p>
              <p className="text-xs font-mono break-all text-gray-800">
                {paymentData.walletAddress}
              </p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(paymentData.walletAddress)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2000)
                }}
                className="mt-2 text-xs bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded transition-colors"
              >
                复制地址
              </button>
              {copied && (
                <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                  已复制！
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3 mb-6">
            {paymentData.paymentUrl && (
              <a
                href={paymentData.paymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex justify-center items-center py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                </svg>
                前往官方支付页面
              </a>
            )}

            {orderExpired ? (
              <div className="text-center py-2 px-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800 font-medium">
                  订单已过期，请重新下单
                </p>
              </div>
            ) : checking ? (
              <div className="flex items-center justify-center py-2 px-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm text-yellow-800">正在检查支付状态...</span>
              </div>
            ) : (
              <div className="text-center py-2 px-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  支付完成后将自动开通服务，请勿关闭此页面
                </p>
              </div>
            )}

            {/* 测试模式按钮 - 通过 .env 中的 NEXT_PUBLIC_TEST_MODE 控制 */}
            {process.env.NEXT_PUBLIC_TEST_MODE === 'true' && !orderExpired && (
              <button
                onClick={handleTestPay}
                disabled={testLoading}
                className="w-full py-3 px-4 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                {testLoading ? '处理中...' : '[测试] 模拟支付成功'}
              </button>
            )}
          </div>

          <div className="border-t border-gray-200 pt-4">
            <div className="text-center">
              <Link
                href="/telegram"
                className="text-purple-600 hover:text-purple-500 text-sm font-medium transition-colors"
              >
                返回上一页
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TelegramPayPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    }>
      <PayContent />
    </Suspense>
  )
}
