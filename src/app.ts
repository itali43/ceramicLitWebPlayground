import { DID } from 'dids'
import ThreeIdResolver from '@ceramicnetwork/3id-did-resolver'
import KeyDidResolver from 'key-did-resolver'

import { createCeramic } from './ceramic'
import { createIDX } from './idx'
import { getProvider } from './wallet'
import type { ResolverRegistry } from 'did-resolver'
// import { encrypt_string } from 'lit-js-sdk'
// writeceramic
import { TileDocument } from '@ceramicnetwork/stream-tile'

import * as LitJsSdk from 'lit-js-sdk'

import { encodeb64, decodeb64 } from './lit'

// To Do:
// - Make Encrypt and Decrypt the only commands. (promises and some commentting out)
// - Modulize
// - Address litNodeClient.saveEncryptionKey malfunction
// - Documentation + Blogpost
// - Notes on good improvements that can be made
// - Allow for Lit Node (and Ceramic Node?) to be editable

// Cleanup:
// - clean up auth processes
// - saveencrypt fix up
// - clean up input/output

// Expectation:
// Cleanup and Lit through the week
// NPMing of this weekend and early next week
// Next week clean up and finalize
// next weekend documentation and blog post (tho also done concurrently throughout)

// DONE:
// - XXXXXXXXX Fix Metamask connection
// - XXXXXXXXX Connect Read and Write, such that user can do both on the same stream
// - XXXXXXXXX fix up Encrypt and Decrypt to work in typescript and in this format
// - XXXXXXXXX [low priority] enable input in WEB PLAYGROUND
// - XXXXXXXXX clean up write so it's given back
//[59, 58, 88, 59, 193, 252, 18, 90, 198, 84, 60, 232, 98, 79, 210, 183, 67, 200, 178, 134, 225, 143, 3, 251, 77, 184, 127, 100, 178, 111, 223, 210, buffer: ArrayBuffer(32), byteLength: 32, byteOffset: 0, length: 32]
declare global {
  interface Window {
    did?: DID
  }
}

const ceramicPromise = createCeramic()
let streamID = 'kjzl6cwe1jw148rh8j6jkmg34ndeqtfexbdhglald95gn7xm7iflsjb815nhx7c' // two
let encryptedZipG: any
let symmetricKeyG: any

const encryptWithLit = async (
  auth: any[],
  aStringThatYouWishToEncrypt: String
): Promise<Array<any>> => {
  // using eth here b/c fortmatic
  const chain = 'ethereum'
  console.log('eth encryptions... ', auth)
  // @ts-ignore
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

  // console.log('TODO: It seems litNodeClient.saveEncryptionKey is malfunctioning')
  // console.log('Troubleshoot why, seems to be on SDK side?---------------')
  // const encryptedSymmetricKey = await window.litNodeClient.saveEncryptionKey({
  //   accessControlConditions,
  //   symmetricKey,
  //   authSign,
  //   chain,
  // })

  // promise then + await 
  // encryptedSymmetricKey.then((value: any) => {
  //   console.log('encrypt sym key!  encrypted sym key is ', value)
  // })

  console.log('RIGHT HERE RIGHT HERE RIGHT HERE RIGHT HERE RIGHT HERE ')
  console.log(encryptedZip)
  console.log(symmetricKey)
  console.log('passing encryptedZip, symmetricKey for now---')
  return [encryptedZip, symmetricKey]
}

const decryptWithLit = async (auth: any[], toDecrypt: any[]): Promise<String> => {
  // using eth here b/c fortmatic
  console.log('eth encryptions... ', auth)
  console.log('decryptor~~~~~~~~~~~~~~~~~~~~~~~~~')
  // const decryptedFiles = await LitJsSdk.decryptZip(encryptedZipG, symmetricKeyG)
  const decryptedFiles = await LitJsSdk.decryptZip(toDecrypt[0], toDecrypt[1])

  const decryptedString = await decryptedFiles['string.txt'].async('text')
  return decryptedString
}

const encoded = async (toEncode: any): Promise<String> => {
  // using eth here b/c fortmatic
  const encode = await encodeb64(toEncode)
  console.log(encode)
  return encode
}

const decoded = async (toDecode: String): Promise<String> => {
  const decode = await decodeb64(toDecode)
  return decode
}

const writeCeramic = async (auth: any[], toBeWritten: any[]): Promise<String> => {
  if (auth) {
    // console.log('write ceramic.. ', auth)
    const authReturn = auth
    // const id = authReturn[0]
    const ceramic = authReturn[1]
    // console.log('!!!!!!!!!!!!!!!!!!')
    const [zip, sym] = await Promise.all([toBeWritten[0], toBeWritten[1]])
    // console.log(zip)
    // console.log(sym)
    // console.log('!!!!!!!!!!!!!!!!!!')

    const doc = await TileDocument.create(
      ceramic,
      { encryptedZip: zip, symKey: sym },
      {
        // controllers: [concatId],
        family: 'doc simpsonss family',
      }
    )
    return doc.id.toString()
  } else {
    console.error('Failed to authenticate in ceramic read')
    updateAlert('danger', 'danger in reading of ceramic')
    return 'whoopsies'
  }
}

// const authSig = await LitJsSdk.checkAndSignAuthMessage({ chain: 'ethereum' })

const authenticate = async (): Promise<Array<any>> => {
  const [ceramic, provider] = await Promise.all([ceramicPromise, getProvider()])
  const keyDidResolver = KeyDidResolver.getResolver()
  const threeIdResolver = ThreeIdResolver.getResolver(ceramic)
  const resolverRegistry: ResolverRegistry = {
    ...threeIdResolver,
    ...keyDidResolver,
  }
  const did = new DID({
    provider: provider,
    resolver: resolverRegistry,
  })

  // const streamId = doc.id.toString()
  // console.log(streamId)
  updateAlert('success', `Successfully connected to wallet`)
  await did.authenticate()
  await ceramic.setDID(did)
  const idx = createIDX(ceramic)
  window.did = ceramic.did
  return [idx.id, ceramic]
}

const readCeramic = async (auth: any[], streamId: String): Promise<string> => {
  if (auth) {
    console.log('reading ceramic.. ', auth)
    const authReturn = auth
    const ceramic = authReturn[1]
    // has two items: kjzl6cwe1jw1499giqt59wloczrez9brtyobeyotst9nnlwtf4y27h76jk96ira
    const stream = await ceramic.loadStream(streamId)
    console.log('this is your content:----->')
    console.log(stream.content)
    return stream.content
  } else {
    console.error('Failed to authenticate in ceramic read')
    updateAlert('danger', 'danger in reading of ceramic')
    return 'error'
  }
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

// document.getElementById('writeCeramic')?.addEventListener('click', () => {
//   console.log('saying hi')
//   say_hi('whats going on')
// })

// // good one below
// document.getElementById('writeCeramic')?.addEventListener('click', () => {
//   authenticate().then((authReturn) => {
//     console.log('writing to ceramic and creating tiledoc..')

//     const itIsWritten = writeCeramic(authReturn).then(function (response) {
//       // console.log('written to this streamID: ')
//       // console.log(response.toString())
//       streamID = response.toString()
//       updateAlert('success', `Successful Write to streamID: ${response.toString()}`)
//       // @ts-ignore
//       document.getElementById('stream').innerText = response.toString()
//       return response.toString()
//     })
//     console.log(itIsWritten)
//   })
// })

document.getElementById('readCeramic')?.addEventListener('click', () => {
  authenticate().then((authReturn) => {
    if (streamID === '') {
      console.log(streamID)
      updateAlert('danger', `Error, please write to ceramic first so a stream can be read`)
    } else {
      console.log('stream ID to read: ', streamID)
      const read = readCeramic(authReturn, streamID)
        .then(function (resp) {
          console.log('reading streamID, got this: ')
          console.log(resp.toString())
          // @ts-ignore
          // document.getElementById('stream').innerText = JSON.stringify(resp)

          updateAlert('success', `Successful Read of Stream: ${JSON.stringify(resp.toString())}`)
          return resp
        })
        .then(function (response) {
          console.log('%%%%%%%%%%%%%%%Grab from JSON and Decode%%%%%%%%%%%%%%%%%')
          const jason = JSON.stringify(response)

          // @ts-ignore
          document.getElementById('stream').innerText = jason
          console.log('--(unencrypted sym )--')
          const enZip = response['symKey']
          console.log(enZip)
          const deZip = decoded(enZip)
          console.log(deZip)

          console.log('--(unencrypted zip )--')
          const enSym = response['encryptedZip']
          console.log(enSym)
          const deSym = decoded(enSym)
          console.log(deSym)
          return [deZip, deSym]
        })
        .then(function (decryptThis) {
          const itIsDecrypted = decryptWithLit(authReturn, decryptThis).then(function (response) {
            // @ts-ignore
            document.getElementById('decryption').innerText = response.toString()
            updateAlert('success', `Successfully Decrypted`)

            return response.toString()
          })
          console.log('+++++++++++decrypted below++++++++++')
          console.log(itIsDecrypted.toString())
          console.log('+++++++++++decrypted above++++++++++')
        })

      console.log(read)
    }
  })
})

document.getElementById('encryptLit')?.addEventListener('click', () => {
  authenticate().then((authReturn) => {
    console.log('+=+=+=+=+=+=+=+=+=encrypt+=+=+=+=+=+=+=+=+=+=+=')
    // @ts-ignore
    const stringToEncrypt = document.getElementById('secret').value

    const itIsEncrypted = encryptWithLit(authReturn, stringToEncrypt)
      .then(function (response) {
        encryptedZipG = response[0]
        symmetricKeyG = response[1]
        updateAlert('success', `Successfully Encrypted`)
        return response
      })
      .then(function (zipAndSymKey) {
        const enZip = encoded(zipAndSymKey[0])
        const enSymKey = encoded(zipAndSymKey[1])

        // const de = decoded(en)
        console.log('+=+=+=+=+=+=+=+=+=base64 the Zip and Sim Keys+=+=+=+=+=+=+=+=+=+=+=')
        console.log(enZip)
        console.log(enSymKey)
        console.log('+=+=+=+=+=+=+=+=+=base64 the Zip and Sim Keys+=+=+=+=+=+=+=+=+=+=+=')

        return [enZip, enSymKey]
      })
      .then((zipAndSymKeyN64) => {
        console.log('+=+=+=+=+=+=+=+=+=write to ceramic+=+=+=+=+=+=+=+=+=+=+=')
        console.log('both in 64: ', zipAndSymKeyN64[0], zipAndSymKeyN64[1])

        writeCeramic(authReturn, zipAndSymKeyN64).then(function (response) {
          // console.log('written to this streamID: ')
          // console.log(response.toString())
          streamID = response.toString()
          updateAlert('success', `Successful Write to streamID: ${response.toString()}`)
          // @ts-ignore
          document.getElementById('stream').innerText = response.toString()
          return response.toString()
        })
      })
    console.log(itIsEncrypted)
  })
})

document.getElementById('decryptLit')?.addEventListener('click', () => {
  authenticate().then((authReturn) => {
    if (encryptedZipG === undefined) {
      updateAlert('danger', `Encrypt something first please`)
    } else {
      const itIsDecrypted = decryptWithLit(authReturn).then(function (response) {
        // @ts-ignore
        document.getElementById('decryption').innerText = response.toString()
        updateAlert('success', `Successfully Decrypted`)

        return response.toString()
      })
      console.log('+++++++++++decrypted below++++++++++')
      console.log(itIsDecrypted.toString())
      console.log('+++++++++++decrypted above++++++++++')
    }
  })
})

document.getElementById('bauth')?.addEventListener('click', () => {
  document.getElementById('loader')?.classList.remove('hide')
  authenticate().then(
    (authReturn) => {
      const id = authReturn[0] as String
      console.log(id)

      console.log('b auth is a thing')
      const userDid = document.getElementById('userDID')
      const concatId = id.split('did:3:')[1]
      if (userDid !== null) {
        userDid.textContent = `${concatId.slice(0, 4)}...${concatId.slice(
          concatId.length - 4,
          concatId.length
        )}`
      }
      updateAlert('success', `Connected with ${id}`)

      document.getElementById('loader')?.classList.add('hide')
      document.getElementById('bauth')?.classList.add('hide')
      document.getElementById('instructions')?.classList.remove('hide')
    },
    (err) => {
      console.error('Failed to authenticate:', err)
      updateAlert('danger', err)
      document.getElementById('loader')?.classList.add('hide')
    }
  )
})
