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
  window.ceramic = ceramic
  window.TileDocument = TileDocument
  window.Caip10Link = Caip10Link
  return Promise.resolve(ceramic as CeramicApi)
}

// export async functino

export async function authenticateCeramic(ceramicPromise: CeramicApi): Promise<Array<any>> {
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
