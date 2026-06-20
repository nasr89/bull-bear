import amqplib from 'amqplib'

let channel = null
let connecting = null

export async function getChannel() {
  if (channel) return channel
  if (!process.env.RABBITMQ_URL) {
    console.warn('⚠️  RABBITMQ_URL not set — queue disabled')
    return null
  }
  if (connecting) return connecting

  connecting = (async () => {
    try {
      const conn = await amqplib.connect(process.env.RABBITMQ_URL)
      conn.on('close', () => {
        console.warn('⚠️  RabbitMQ connection closed')
        channel = null
      })
      conn.on('error', (err) => {
        console.warn('⚠️  RabbitMQ error:', err.message)
      })
      channel = await conn.createChannel()
      console.log('✅ RabbitMQ connected')
      return channel
    } catch (err) {
      console.warn(`⚠️  RabbitMQ unreachable (${err.message}) — continuing without queue`)
      channel = null
      return null
    } finally {
      connecting = null
    }
  })()

  return connecting
}
