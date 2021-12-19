import * as LitJsSdk from 'lit-js-sdk'

export async function say_hi(hi: String) {
  console.log(hi)
}

export async function startLitClient() {
  console.log('Starting Lit Client...')
  const client = new LitJsSdk.LitNodeClient()
  client.connect()
  window.litNodeClient = client
}
