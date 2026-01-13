curl -X POST https://pay.tg10000.com/api/v1/order/create-transaction \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "test123456",
    "amount": "100.01",
    "notify_url": "http://pay.tg10000.com",
    "redirect_url": "http://pay.tg10000.com",
    "signature": "1392e3678b54ef3af240d0a9dbe77a05"
  }'