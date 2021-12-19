// import LitJsSdk from 'lit-js-sdk'
import * as LitJsSdk from 'lit-js-sdk'
import { TileDocument } from '@ceramicnetwork/stream-tile'
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'

/**
 * This function encodes into base 64.
 * it's useful for storing symkeys and files in ceramic
 * @param {Uint8Array} input a file or any data
 * @returns {string} returns a string of b64
 */
export function encodeb64(uintarray: any) {
  console.log('encode to b64')
  const b64 = Buffer.from(uintarray).toString('base64')
  return b64
}

function blobToBase64(blob: Blob) {
  return new Promise((resolve, _) => {
    const reader = new FileReader()
    reader.onloadend = () =>
      // @ts-ignore
      resolve(reader.result.replace('data:application/octet-stream;base64,', ''))
    reader.readAsDataURL(blob)
  })
}

/**
 * This function decodes from base 64.
 * it's useful for decrypting symkeys and files in ceramic
 * @param {blob} input a b64 string
 * @returns {string} returns the data as a string
 */
export function decodeb64(b64String: any) {
  return new Uint8Array(Buffer.from(b64String, 'base64'))
}

// // -----
// // -----
// // Encrypt and Write to Ceramic
// // -----
// export async function encryptAndWrite(auth: any[], stringToEncrypt: String) {
//   console.log('encrypt w/ Lit and write to ceramic, string: ', stringToEncrypt)
//   console.log('~~--------------------------------~~')
//   const encrypted = encryptWithLit(auth, stringToEncrypt)
//   console.log(encrypted)
//   // writeToCeramic(auth, encrypted)
// }

export async function encryptWithLit(
  auth: any[],
  aStringThatYouWishToEncrypt: String
): Promise<Array<any>> {
  const chain = 'ethereum'
  let authSign = await LitJsSdk.checkAndSignAuthMessage({
    chain: chain,
  })
  const { encryptedZip, symmetricKey } = await LitJsSdk.zipAndEncryptString(
    aStringThatYouWishToEncrypt
  )
  console.log('use this for ACC softcoded: ', auth)
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

  const encryptedSymmetricKey = await window.litNodeClient.saveEncryptionKey({
    accessControlConditions,
    symmetricKey,
    authSig: authSign,
    chain,
  })

  const encryptedZipBase64 = await blobToBase64(encryptedZip)
  const encryptedSymmetricKeyBase64 = encodeb64(encryptedSymmetricKey)

  return [encryptedZipBase64, encryptedSymmetricKeyBase64, accessControlConditions, chain]
}

/**
 * decrypt using the lit protocol
 * @param {any} auth is the authentication passed via the persons wallet
 * @param {Promise<String>} promise with the encrypted files and symmetric key
 * @returns {Promise<string>} promise with the decrypted string
 */

export async function decryptWithLit(
  encryptedZip: Uint8Array,
  encryptedSymmKey: Uint8Array,
  accessControlConditions: Array<any>,
  chain: string
): Promise<String> {
  let authSig = await LitJsSdk.checkAndSignAuthMessage({
    chain: chain,
  })
  // encrypted blob, sym key
  console.log('encryptedSymKey', encryptedSymmKey)
  const toDecrypt = uint8ArrayToString(encryptedSymmKey, 'base16')
  console.log('toDecrypt', toDecrypt)
  // decrypt the symmetric key
  const decryptedSymmKey = await window.litNodeClient.getEncryptionKey({
    accessControlConditions,
    toDecrypt,
    chain,
    authSig,
  })
  console.log('decryptedSymKey', decryptedSymmKey)

  // decrypt the files
  const decryptedFiles = await LitJsSdk.decryptZip(new Blob([encryptedZip]), decryptedSymmKey)
  const decryptedString = await decryptedFiles['string.txt'].async('text')
  return decryptedString
}

// -----
// -----
// Ceramic
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
