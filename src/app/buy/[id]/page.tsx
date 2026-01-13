'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import QRCode from 'qrcode'

export default function BuyPage() {
  const params = useParams()
  const cardId = params.id as string

  const [paymentData, setPaymentData] = useState<any>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [cardCode, setCardCode] = useState<string | null>(null)
  const [copied, setCopied] = useState<'address' | 'card' | null>(null)
  const [timeLeft, setTimeLeft] = useState<number>(10 * 60)
  const [countdownActive, setCountdownActive] = useState(false)
  const [orderExpired, setOrderExpired] = useState(false)

  useEffect(() => {
    if (cardId) {
      initOrder()
    }
  }, [cardId])

  const initOrder = async () => {
    try {
      const sessionId = localStorage.getItem('sessionId') || generateSessionId()
      localStorage.setItem('sessionId', sessionId)

      // 查询现有订单
      const response = await fetch(`/api/orders?sessionId=${encodeURIComponent(sessionId)}`)
      const data = await response.json()

      if (data.order && data.order.status === 'pending') {
        const order = data.order

        const orderTime = new Date(order.createdAt)
        const currentTime = new Date()
        const elapsedSeconds = Math.floor((currentTime.getTime() - orderTime.getTime()) / 1000)
        const remainingSeconds = Math.max(0, (10 * 60) - elapsedSeconds)

        if (remainingSeconds > 0) {
          setTimeLeft(remainingSeconds)
          setCountdownActive(true)

          // 直接使用API返回的订单数据
          const payment = {
            orderId: order.id,
            amount: order.amount,
            walletAddress: order.walletAddress,
            paymentUrl: order.paymentUrl
          }
          setPaymentData(payment)
          const qrUrl = await QRCode.toDataURL(order.walletAddress)
          setQrCodeUrl(qrUrl)
          checkPayment(order.id)
        } else {
          setTimeLeft(0)
          setOrderExpired(true)
        }
      } else {
        createOrder()
      }
    } catch (error) {
      console.error('Error loading order:', error)
      createOrder()
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null

    if (countdownActive && timeLeft > 0) {
      timer = setTimeout(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setOrderExpired(true)
            setCountdownActive(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (timer) {
        clearTimeout(timer)
      }
    }
  }, [countdownActive, timeLeft])

  const createOrder = async () => {
    try {
      const sessionId = localStorage.getItem('sessionId') || generateSessionId()
      localStorage.setItem('sessionId', sessionId)

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cardId: parseInt(cardId),
          sessionId,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setPaymentData(data)

        const qrUrl = await QRCode.toDataURL(data.walletAddress)
        setQrCodeUrl(qrUrl)

        setTimeLeft(10 * 60)
        setCountdownActive(true)
        checkPayment(data.orderId)
      }
    } catch (error) {
      console.error('Error creating order:', error)
    }
  }

  const checkPayment = async (orderId: string) => {
    setChecking(true)
    try {
      const response = await fetch(`/api/orders/${orderId}/check`)
      if (response.ok) {
        const data = await response.json()
        if (data.cardCode) {
          setCardCode(data.cardCode)
          setCountdownActive(false)
          return
        }
      }
    } catch (error) {
      console.error('Error checking payment:', error)
    }

    if (!cardCode && !orderExpired) {
      setTimeout(() => checkPayment(orderId), 15000)
    }
  }

  const generateSessionId = () => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  if (cardCode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-xl shadow-xl p-8 border border-green-200">
            <div className="text-center mb-6">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-green-800 mb-2">
                支付成功！
              </h1>
              <p className="text-gray-600">
                商品已成功交付到您的账户
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <p className="text-gray-700 font-medium mb-3">您的卡密：</p>
              <div className="bg-white border-2 border-dashed border-gray-300 p-4 rounded-md">
                <code className="text-lg font-mono text-gray-800 break-all">{cardCode}</code>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <svg className="h-5 w-5 text-yellow-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                </svg>
                <div>
                  <p className="text-sm text-yellow-800 font-medium">重要提醒</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    请立即复制并安全保存此卡密。一旦离开此页面，您将无法再次查看。
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(cardCode)
                  setCopied('card')
                  setTimeout(() => setCopied(null), 2000)
                }}
                className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors mr-3"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                </svg>
                {copied === 'card' ? '已复制！' : '复制卡密'}
              </button>
              <Link
                href="/"
                className="inline-flex items-center px-6 py-3 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
              >
                返回首页
              </Link>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-xl shadow-xl p-8 border border-gray-200">
          <div className="text-center mb-8">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
              <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              USDT支付
            </h1>
            <p className="text-gray-600">
              请完成USDT转账以获取商品
            </p>
          </div>

          <div className={`bg-gradient-to-r rounded-lg p-6 text-white text-center mb-6 ${orderExpired ? 'from-red-500 to-pink-600' : 'from-indigo-500 to-purple-600'}`}>
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
              <span className="text-sm text-gray-900 font-mono">{paymentData.orderId}</span>
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
                  setCopied('address')
                  setTimeout(() => setCopied(null), 2000)
                }}
                className="mt-2 text-xs bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded transition-colors"
              >
                复制地址
              </button>
              {copied === 'address' && (
                <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                  已复制！
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3 mb-6">
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

            {orderExpired ? (
              <div className="text-center py-2 px-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800 font-medium">
                  订单已过期，请重新购买
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
                  支付完成后将自动显示卡密，请勿关闭此页面
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 pt-4">
            <div className="text-center">
              <Link
                href="/"
                className="text-indigo-600 hover:text-indigo-500 text-sm font-medium transition-colors"
              >
                ← 返回首页
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
