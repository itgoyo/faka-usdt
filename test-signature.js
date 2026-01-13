// 测试签名生成
const crypto = require('crypto')
const { URLSearchParams } = require('url')

function generateSignature(params, token) {
  const sortedKeys = Object.keys(params)
    .filter(key => params[key] !== '' && params[key] !== null && params[key] !== undefined)
    .sort()

  // 使用URL编码，就像form-data会做的那样
  const paramString = sortedKeys.map(key => `${key}=${encodeURIComponent(params[key])}`).join('&')
  const signString = paramString + token

  console.log('Param string (URL encoded):', paramString)
  console.log('Sign string:', signString)

  return crypto.createHash('md5').update(signString).digest('hex')
}

// 测试form-urlencoded编码
function testFormEncoding(params) {
  const formData = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    formData.append(key, String(value))
  })
  console.log('Form encoded:', formData.toString())
}

// 测试实际使用的参数
const currentParams = {
  order_id: "1700000000000",
  amount: "199.01",
  notify_url: "http://pay.tg10000.com",
  redirect_url: "http://pay.tg10000.com"
}

console.log('=== 测试当前参数 ===')
const signature1 = generateSignature(currentParams, "Abc.12345")
console.log('Generated signature:', signature1)
testFormEncoding({...currentParams, signature: signature1})

// 测试成功参数
const testParams = {
  order_id: "202504091744168651183595",
  amount: 100.01,
  notify_url: "http://pay.tg10000.com",
  redirect_url: "http://pay.tg10000.com"
}

console.log('\n=== 测试成功参数 ===')
const signature2 = generateSignature(testParams, "Abc.12345")
console.log('Generated signature:', signature2)
console.log('Expected signature: 1392e3678b54ef3af240d0a9dbe77a05')
console.log('Match:', signature2 === '1392e3678b54ef3af240d0a9dbe77a05')