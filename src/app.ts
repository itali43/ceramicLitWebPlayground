import { DID } from 'dids'

import { createCeramic, authenticateCeramic, writeCeramic, readCeramic } from './ceramic'
import { TileDocument } from '@ceramicnetwork/stream-tile'
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'

import * as LitJsSdk from 'lit-js-sdk'
import { encodeb64, decodeb64, blobToBase64 } from './lit'
import { startLitClient } from './client'

// To Do:
// - Modulize
// - Access Control Conditions should not be hardcoded
// - IMPLEMENT DOCUMENTATION.JS! and start documenting
// - Decryption bug
// - Documentation + Blogpost
// - Notes on good improvements that can be made
// - Allow for Lit Node (and Ceramic Node?) to be editable

// Cleanup:
// - clean up auth processes
// - saveencrypt fix up
// - clean up input/output

declare global {
  interface Window {
    did?: DID
  }
}

const ceramicPromise = createCeramic()
let streamID = 'kjzl6cwe1jw148rh8j6jkmg34ndeqtfexbdhglald95gn7xm7iflsjb815nhx7c' // dummy data

const encryptWithLit = async (
  auth: any[],
  aStringThatYouWishToEncrypt: String
): Promise<Array<any>> => {
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

const decryptWithLit = async (
  encryptedZip: Uint8Array,
  encryptedSymmKey: Uint8Array,
  accessControlConditions: Array<any>,
  chain: string
): Promise<String> => {
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

const updateAlert = (status: string, message: string) => {
  const alert = document.getElementById('alerts')

  if (alert !== null) {
    alert.textContent = message
    alert.classList.add(`alert-${status}`)
    alert.classList.remove('hide')
    setTimeout(() => {
      alert.classList.add('hide')
    }, 5000)
  }
}

document.addEventListener('DOMContentLoaded', function () {
  console.log('DOMContent.........')
  startLitClient()
})

document.getElementById('readCeramic')?.addEventListener('click', () => {
  authenticateCeramic(ceramicPromise)
    .then((authReturn) => {
      if (streamID === '') {
        console.log(streamID)
        updateAlert('danger', `Error, please write to ceramic first so a stream can be read`)
      } else {
        return readCeramic(authReturn, streamID)
      }
    })
    .then(function (response) {
      updateAlert('success', `Successful Read of Stream: ${JSON.stringify(response)}`)

      const jason = JSON.stringify(response)
      // @ts-ignore
      document.getElementById('stream').innerText = jason
      const enZip = response['encryptedZip']
      // decoded, not decrypted.. yet
      const deZip = decodeb64(enZip)

      const enSym = response['symKey']
      const deSym = decodeb64(enSym)

      const accessControlConditions = response['accessControlConditions']
      const chain = response['chain']

      return decryptWithLit(deZip, deSym, accessControlConditions, chain)
    })
    .then(function (response) {
      // @ts-ignore
      document.getElementById('decryption').innerText = response.toString()
      updateAlert('success', `Successfully Decrypted`)
      return response.toString()
    })
    .then((itIsDecrypted) => {
      console.log('itIsDecrypted', itIsDecrypted)
    })
})

// encrypt with Lit and write to ceramic
document.getElementById('encryptLit')?.addEventListener('click', () => {
  authenticateCeramic(ceramicPromise).then((authReturn) => {
    // get secret that is to be encrypted
    // @ts-ignore
    const stringToEncrypt = document.getElementById('secret').value

    encryptWithLit(authReturn, stringToEncrypt)
      .then((zipAndSymKeyN64) => {
        updateAlert('success', `Successfully Encrypted`)
        // write encoded data to ceramic
        writeCeramic(authReturn, zipAndSymKeyN64).then(function (response) {
          streamID = response.toString()
          updateAlert('success', `Successful Write to streamID: ${response.toString()}`)
          // @ts-ignore
          document.getElementById('stream').innerText = response.toString()
          return response.toString()
        })
      })
      .then((itIsEncrypted) => {
        console.log(itIsEncrypted)
      })
  })
})
