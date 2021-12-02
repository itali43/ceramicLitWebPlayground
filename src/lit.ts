// import LitJsSdk from 'lit-js-sdk'
import * as LitJsSdk from 'lit-js-sdk'
import { TileDocument } from '@ceramicnetwork/stream-tile'

export async function say_hi(hi: String) {
  console.log(hi)
}
//var blob = new Blob(['Welcome to <b>base64.guru</b>!'], {type: 'text/html'});

export async function encodeb64(blob: any) {
  // let b64 = '-x-'
  console.log('encode to b64')
  // Define the FileReader which is able to read the contents of Blob
  // var reader = new FileReader()
  // // The magic always begins after the Blob is successfully loaded
  // reader.onload = function () {
  //   // Since it contains the Data URI, we should remove the prefix and keep only Base64 string
  //   // @ts-ignore
  //   b64 = reader.result.replace(/^data:.+;base64,/, '')
  //   console.log('=============> encoded to b64 (V2VsY29tZSB0byA8Yj5iYXNlNjQuZ3VydTwvYj4h): ')
  //   console.log(b64) //-> "V2VsY29tZSB0byA8Yj5iYXNlNjQuZ3VydTwvYj4h"
  // }
  const b64 = btoa(blob)
  console.log(b64)
  // Since everything is set up, let’s read the Blob and store the result as Data URI
  // await reader.readAsDataURL(blob)
  return b64
}

export async function decodeb64(b64String: any) {
  console.log('decode from b64: ', b64String)
  // Define the FileReader which is able to read the contents of Blob
  // var reader = new FileReader()
  // The magic always begins after the Blob is successfully loaded
  // Decode the Base64 string and show result just to make sure that everything is OK

  console.log('@@@@@@@@@@@@@@@@@@@@')
  var html = atob(b64String)
  console.log('===> decoded to b64 (Welcome to <b>base64.guru</b>!): ')
  console.log(html)

  const htmlwbrack = `[${html}]`
  console.log(htmlwbrack)
  return htmlwbrack
  // Since everything is set up, let’s read the Blob and store the result as Data URI
  // reader.readAsDataURL(blob)
}

// -----
// -----
// Encrypt and Write to Ceramic
// -----
export async function encryptAndWrite(auth: any[], stringToEncrypt: String) {
  console.log('encrypt w/ Lit and write to ceramic, string: ', stringToEncrypt)
  console.log('~~--------------------------------~~')
  const encrypted = encryptWithLit(auth, stringToEncrypt)
  console.log(encrypted)
  // writeToCeramic(auth, encrypted)
}

// -----
// -----
// Decrypt and Read
// -----

// -----
// -----
// Lit Encrypt / Decrypt
// -----

const encryptWithLit = async (
  auth: any[],
  aStringThatYouWishToEncrypt: String
): Promise<Array<any>> => {
  // using eth here b/c fortmatic
  const chain = 'ethereum'
  console.log('eth encryptions... ', auth)
  console.log('secret to encrypt')
  console.log(aStringThatYouWishToEncrypt)
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

  // console.log('**********TESTING**********')
  console.log('Conditions!  A.C.C. is ', accessControlConditions)
  // console.log('symkey!  SymKey is ', symmetricKey)
  console.log('Auth!  AuthSig is ', authSign)
  // console.log('Chain!  chain is ', chain)
  // console.log('Encrypted Zip!  EncryptedZip is ', encryptedZip)

  console.log('TODO: It seems litNodeClient.saveEncryptionKey is malfunctioning')
  console.log('Troubleshoot why, seems to be on SDK side?---------------')
  // const encryptedSymmetricKey = await window.litNodeClient.saveEncryptionKey({
  //   accessControlConditions,
  //   symmetricKey,
  //   authSign,
  //   chain,
  // })

  // encryptedSymmetricKey.then((value: any) => {
  //   console.log('here!')
  //   console.log('encrypt sym key!  encrypted sym key is ', value)
  // })

  console.log('passing encryptedZip, symmetricKey for now---')
  return [encryptedZip, symmetricKey]
}

// -----
// -----
// Ceramic
// -----

export async function writeToCeramic(auth: any[], encryptedString: String) {
  if (auth) {
    console.log('write ceramic.. ', auth)
    const authReturn = auth
    // const id = authReturn[0]
    const ceramic = authReturn[1]

    const doc = await TileDocument.create(
      ceramic,
      { foo: encryptedString },
      {
        // controllers: [concatId],
        family: 'doc simpsonss family',
      }
    )
    return doc.id.toString()
  } else {
    console.error('Failed to authenticate in ceramic read')
    // updateAlert('danger', 'danger in reading of ceramic')
    return 'whoopsies'
  }

  // return writeCeramic
}
// -----

// -----

// -----

// ----- to be deleted below when doing scrap cleanup

// -----

// -----

// -----

// -----

// -----

// -----

// -----

// -----

// -----

// -----

// -----

export async function encrypt_string() {
  // using eth here b/c fortmatic
  const chain = 'ethereum'
  console.log('eth encryptions ')
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
