import { DID } from 'dids'
import ThreeIdResolver from '@ceramicnetwork/3id-did-resolver'
import KeyDidResolver from 'key-did-resolver'

import { createCeramic } from './ceramic'
import { createIDX } from './idx'
import { getProvider } from './wallet'
import type { ResolverRegistry } from 'did-resolver'
// import { encrypt_string } from 'lit-js-sdk'
import { TileDocument } from '@ceramicnetwork/stream-tile'

// To Do:
// - Connect Read and Write, such that user can do both on the same stream
// - fix up Encrypt and Decrypt to work in typescript and in this format
// - decrypt error regarding type

declare global {
  interface Window {
    did?: DID
  }
}

const ceramicPromise = createCeramic()

const writeCeramic = async (auth: any[]): Promise<String> => {
  if (auth) {
    console.log('write ceramic.. ', auth)
    const authReturn = auth
    // const id = authReturn[0]
    const ceramic = authReturn[1]

    const doc = await TileDocument.create(
      ceramic,
      { foo: 'barto' },
      {
        // controllers: [concatId],
        family: 'doc family',
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

  const doc = TileDocument.create(
    ceramic,
    { foo: 'el barto' },
    {
      // controllers: [concatId],
      family: 'doc family',
    }
  )
  // const streamId = doc.id.toString()
  // console.log(streamId)
  updateAlert('success', `Successfully connected, now written to nothing`)
  console.log('halp')
  console.log(doc)
  await did.authenticate()
  await ceramic.setDID(did)
  const idx = createIDX(ceramic)
  window.did = ceramic.did
  return [idx.id, ceramic]
}

const readCeramic = async (auth: any[]): Promise<string> => {
  if (auth) {
    console.log('reading ceramic.. ', auth)
    const authReturn = auth
    const ceramic = authReturn[1]

    const streamId = 'kjzl6cwe1jw146fgws1ijke5i3m2c9jqtz4cmirj3cepebj2tn1q884db5xi2fx'
    const stream = await ceramic.loadStream(streamId)

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

document.getElementById('writeCeramic')?.addEventListener('click', () => {
  authenticate().then(
    (authReturn) => {
      const id = authReturn[0]
      console.log(authReturn[0])
      console.log(authReturn)
      const ceramic = authReturn[1]
      console.log(ceramic)
      const userDid = document.getElementById('userDID')
      const concatId = id.split('did:3:')[1]
      if (userDid !== null) {
        userDid.textContent = `${concatId.slice(0, 4)}...${concatId.slice(
          concatId.length - 4,
          concatId.length
        )}`
      }
      console.log(concatId)
      // const [ceramic, provider] = await Promise.all([ceramicPromise, getProvider()])

      updateAlert('success', `Successfully connected with ${id}`)
    },
    (err) => {
      console.error('Failed to authenticate:', err)
      updateAlert('danger', err)
    }
  )
})

document.getElementById('writeCeramic')?.addEventListener('click', () => {
  authenticate().then((authReturn) => {
    console.log('writing to ceramic and creating tiledoc..')

    const itIsWritten = writeCeramic(authReturn)
    console.log('what was written: ', itIsWritten)
    updateAlert('success', `Successful Read of Stream: ${itIsWritten}`)
  })
})

document.getElementById('encryptLit')?.addEventListener('click', () => {
  console.log('we are here..')

  // encrypt_string()
  console.log('+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=')

  updateAlert('success', `Successfully Ecrypted`)
})

document.getElementById('readCeramic')?.addEventListener('click', () => {
  authenticate().then((authReturn) => {
    console.log('reading ceramic stream..')

    const read = readCeramic(authReturn)
    updateAlert('success', `Successful Read of Stream: ${read}`)
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
      updateAlert('success', `!!!!!!!!Connected with ${id}`)

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
