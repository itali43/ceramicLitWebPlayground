import type { CeramicApi } from '@ceramicnetwork/common'
import Ceramic from '@ceramicnetwork/http-client'
import { Caip10Link } from '@ceramicnetwork/stream-caip10-link'
import { TileDocument } from '@ceramicnetwork/stream-tile'
import { DID } from 'dids'
import ThreeIdResolver from '@ceramicnetwork/3id-did-resolver'
import KeyDidResolver from 'key-did-resolver'
import { createCeramic } from './ceramic'
import { createIDX } from './idx'
import { getProvider, getAddress } from './wallet'
import type { CeramicApi } from '@ceramicnetwork/common'
import { ResolverRegistry } from 'did-resolver'

declare global {
  interface Window {
    ceramic?: CeramicApi
    [index: string]: any
  }
}

export async function createCeramic(): Promise<CeramicApi> {
  const ceramic = new Ceramic('https://ceramic-clay.3boxlabs.com')
  console.log('creating... creating...')
  window.ceramic = ceramic
  console.log(window.ceramic)
  window.TileDocument = TileDocument
  window.Caip10Link = Caip10Link

  return Promise.resolve(ceramic as CeramicApi)
}

export async function authenticateCeramic(ceramicPromise: CeramicApi): Promise<Array<any>> {
  console.log('authenticate Ceramic!')
  const [ceramic, provider, address] = await Promise.all([
    ceramicPromise,
    getProvider(),
    getAddress(),
  ])

  console.log('get address: ', address)

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

  await did.authenticate()
  await ceramic.setDID(did)
  const idx = createIDX(ceramic)
  window.did = ceramic.did
  return Promise.resolve([idx.id, ceramic, address])
}

/**
 * Write to Ceramic // TODO: FINISH PARAMS ETC
 * @param {any} auth is the authentication passed via the persons wallet
 * @param {Promise<String>} promise with the encrypted files and symmetric key
 * @returns {Promise<string>} promise with the decrypted string
 */
export async function writeCeramic(auth: any[], toBeWritten: any[]): Promise<String> {
  if (auth) {
    const authReturn = auth
    const ceramic = authReturn[1]
    const toStore = {
      encryptedZip: toBeWritten[0],
      symKey: toBeWritten[1],
      accessControlConditions: toBeWritten[2],
      chain: toBeWritten[3],
    }
    console.log('storing to ceramic', toStore)

    const doc = await TileDocument.create(ceramic, toStore, {
      // controllers: [concatId],
      family: 'doc family',
    })
    return doc.id.toString()
  } else {
    console.error('Failed to authenticate in ceramic WRITE')
    return 'error'
  }
}

export async function readCeramic(auth: any[], streamId: String): Promise<string> {
  if (auth) {
    const authReturn = auth
    const ceramic = authReturn[1]
    const stream = await ceramic.loadStream(streamId)
    return stream.content
  } else {
    console.error('Failed to authenticate in ceramic READ')
    return 'error'
  }
}
