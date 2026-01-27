'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Card {
  id: number
  title: string
  price: number
  availableCount: number
  createdAt: string
}

export default function Home() {
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCards()
  }, [])

  const fetchCards = async () => {
    try {
      const response = await fetch('/api/cards')
      if (response.ok) {
        const data = await response.json()
        setCards(data)
      }
    } catch (error) {
      console.error('Error fetching cards:', error)
    } finally {
      setLoading(false)
    }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
            自动发卡系统
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            安全、快速的数字商品自动交付平台
          </p>
          <Link
            href="/telegram"
            className="mt-6 inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18.717-.962 4.084-1.362 5.411-.168.56-.505 1.473-.884 1.573-.38.1-.633.066-.917-.146-.21-.157-.433-.399-.607-.593l-.862-.88c-.505-.517-1.108-.888-1.108-.888s-.172-.078-.157-.205c.01-.074.054-.126.054-.126l.848-.809c.505-.483 1.071-1.004 1.435-1.371.364-.368.725-.766.725-1.005 0-.24-.136-.35-.315-.35-.18 0-.458.132-.726.274l-2.055 1.074c-.505.263-1.001.523-1.001.523s-.505.263-.883.35c-.379.087-.758.087-.758.087s-.631-.044-.947-.175c-.316-.13-.631-.262-.631-.262s-.315-.13-.44-.262c-.126-.131-.063-.328-.063-.328s.063-.131.315-.35l6.12-5.89c.252-.241.631-.372 1.01-.372.379 0 .884.218 1.01.567.125.35.125.655-.126 1.353z"/>
            </svg>
            Telegram 监听转发服务
          </Link>
        </div>

        {cards.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🎫</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">暂无可用的卡密</h3>
            <p className="text-gray-500">请稍后再来查看</p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => (
              <div key={card.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-gray-200">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      可用
                    </span>
                    <span className="text-sm text-gray-500">
                      剩余 {card.availableCount} 个
                    </span>
                  </div>

                  <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                    {card.title}
                  </h2>

                  <div className="flex items-center justify-between mb-6">
                    <div className="text-3xl font-bold text-indigo-600">
                      ¥{card.price}
                    </div>
                    <div className="text-sm text-gray-500">
                      USDT支付
                    </div>
                  </div>

                  <Link
                    href={`/buy/${card.id}`}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 font-medium text-center block transform hover:scale-105"
                  >
                    立即购买
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
