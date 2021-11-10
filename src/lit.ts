// import LitJsSdk from 'lit-js-sdk'
import * as LitJsSdk from 'lit-js-sdk'

export async function encrypt_string() {
  const chain = 'fantom'
  console.log('fantom encryptions ')
  const aStringThatYouWishToEncrypt = 'this is my secret, hold if for me please'
  let authSign = await LitJsSdk.checkAndSignAuthMessage({
    chain: chain,
  })
  const { encryptedZip, symmetricKey } = await LitJsSdk.zipAndEncryptString(
    aStringThatYouWishToEncrypt
  )

  const accessControlConditions = [
    {
      contractAddress: '0x20598860Da775F63ae75E1CD2cE0D462B8CEe4C7',
      standardContractType: '',
      chain: 'ethereum',
      method: 'eth_getBalance',
      parameters: [':userAddress', 'latest'],
      returnValueTest: {
        comparator: '>=',
        value: '10000000000000',
      },
    },
  ]

  //   const { txHash, tokenId, tokenAddress, mintingAddress, authSign } = await LitJsSdk.mintLIT({
  //     chain: window.chain,
  //     quantity: 1,
  //   })

  //   console.log('Success!  Tx hash is ', txHash)
  console.log('Success!  A.C.C. is ', accessControlConditions)
  console.log('Success!  EncryptedZip is ', encryptedZip)
  console.log('Success!  SymKey is ', symmetricKey)
  console.log('Auth!  AuthSig is ', authSign)
}
