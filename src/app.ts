import { DID } from 'dids'
import ThreeIdResolver from '@ceramicnetwork/3id-did-resolver'
import KeyDidResolver from 'key-did-resolver'

import { createCeramic } from './ceramic'
import { createIDX } from './idx'
import { getProvider } from './wallet'
import type { ResolverRegistry } from 'did-resolver'
// import { encrypt_string } from 'lit-js-sdk'
import { TileDocument } from '@ceramicnetwork/stream-tile'

import * as LitJsSdk from 'lit-js-sdk'

// To Do:
// - XXXXXXXXX Fix Metamask connection
// - XXXXXXXXX Connect Read and Write, such that user can do both on the same stream
// - fix up Encrypt and Decrypt to work in typescript and in this format
// - decrypt error regarding type (AAC isn't typed correctly iirc)
// - [low priority] enable input in WEB PLAYGROUND
// - XXXXXXXXX clean up write so it's given back
// - Allow for Lit Node (and Ceramic Node?) to be editable

// Expectation:
// Cleanup and Lit through the week
// NPMing of this weekend and early next week
// Next week clean up and finalize
// next weekend documentation and blog post (tho also done concurrently throughout)
declare global {
  interface Window {
    did?: DID
  }
}

const ceramicPromise = createCeramic()
let streamID = ''
let encryptedZipG: any
let symmetricKeyG: any

const encryptWithLit = async (auth: any[]): Promise<Array<any>> => {
  // using eth here b/c fortmatic
  const chain = 'ethereum'
  console.log('eth encryptions... ', auth)
  // @ts-ignore
  const aStringThatYouWishToEncrypt = document.getElementById('secret').value
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
  // console.log('Conditions!  A.C.C. is ', accessControlConditions)
  // console.log('symkey!  SymKey is ', symmetricKey)
  // console.log('Auth!  AuthSig is ', authSign)
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

const decryptWithLit = async (auth: any[]): Promise<String> => {
  // using eth here b/c fortmatic
  const chain = 'ethereum'
  console.log('eth encryptions... ', auth)
  console.log('decryptor~~~~~~~~~~~~~~~~~~~~~~~~~')
  const decryptedFiles = await LitJsSdk.decryptZip(encryptedZipG, symmetricKeyG)
  const decryptedString = await decryptedFiles['string.txt'].async('text')
  return decryptedString
}

const writeCeramic = async (auth: any[]): Promise<String> => {
  if (auth) {
    console.log('write ceramic.. ', auth)
    const authReturn = auth
    // const id = authReturn[0]
    const ceramic = authReturn[1]

    const doc = await TileDocument.create(
      ceramic,
      { foo: 'el barto is here' },
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

    // const streamId = 'kjzl6cwe1jw146fgws1ijke5i3m2c9jqtz4cmirj3cepebj2tn1q884db5xi2fx'
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

document.getElementById('activate_ceramic')?.addEventListener('click', () => {
  const ceramicIframe = document.getElementById('ceramic_docs')
  if (ceramicIframe?.classList.contains('show')) {
    ceramicIframe?.classList.remove('show')
    document.getElementById('activate_ceramic')?.classList.remove('active')
  } else {
    document.getElementById('activate_ceramic')?.classList.add('active')
    ceramicIframe?.classList.add('show')
  }
})

document.getElementById('activate_idx')?.addEventListener('click', () => {
  const idxIframe = document.getElementById('idx_docs')
  if (idxIframe?.classList.contains('show')) {
    idxIframe?.classList.remove('show')
    document.getElementById('activate_idx')?.classList.remove('active')
  } else {
    document.getElementById('activate_idx')?.classList.add('active')
    idxIframe?.classList.add('show')
  }
})

// =============================================

document.getElementById('writeCeramic')?.addEventListener('click', () => {
  authenticate().then((authReturn) => {
    console.log('writing to ceramic and creating tiledoc..')

    const itIsWritten = writeCeramic(authReturn).then(function (response) {
      // console.log('written to this streamID: ')
      // console.log(response.toString())
      streamID = response.toString()
      updateAlert('success', `Successful Write to streamID: ${response.toString()}`)
      // @ts-ignore
      document.getElementById('stream').innerText = response.toString()
      return response.toString()
    })
    console.log(itIsWritten)
  })
})

document.getElementById('readCeramic')?.addEventListener('click', () => {
  authenticate().then((authReturn) => {
    if (streamID === '') {
      console.log(streamID)
      updateAlert('danger', `Error, please write to ceramic first so a stream can be read`)
    } else {
      console.log('stream ID to read: ', streamID)
      const read = readCeramic(authReturn, streamID).then(function (resp) {
        console.log('reading streamID, got this: ')
        console.log(resp.toString())
        // @ts-ignore
        document.getElementById('stream').innerText = JSON.stringify(resp)
        updateAlert('success', `Successful Read of Stream: ${JSON.stringify(resp.toString())}`)
        return resp.toString()
      })
      console.log(read)
    }
  })
})

document.getElementById('encryptLit')?.addEventListener('click', () => {
  authenticate().then((authReturn) => {
    console.log('+=+=+=+=+=+=+=+=+=encrypt+=+=+=+=+=+=+=+=+=+=+=')

    const itIsEncrypted = encryptWithLit(authReturn).then(function (response) {
      encryptedZipG = response[0]
      symmetricKeyG = response[1]
      updateAlert('success', `Successfully Encrypted`)

      // @ts-ignore
      // document.getElementById('stream').innerText = response.toString()
      return response
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
