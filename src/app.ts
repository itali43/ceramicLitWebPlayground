import { DID } from 'dids'
import { Integration } from '@litelliott/lit-ceramic-integration'

declare global {
  interface Window {
    did?: DID
  }
}

let litCeramicIntegration = new Integration()

// const ceramicPromise = litCeramicIntegration._createCeramic()
let streamID = 'kjzl6cwe1jw1479rnblkk5u43ivxkuo29i4efdx1e7hk94qrhjl0d4u0dyys1au' // test data

// const updateAlert = (status: string, message: string) => {
//   const alert = document.getElementById('alerts')

//   if (alert !== null) {
//     alert.textContent = message
//     alert.classList.add(`alert-${status}`)
//     alert.classList.remove('hide')
//     setTimeout(() => {
//       alert.classList.add('hide')
//     }, 5000)
//   }
// }

document.addEventListener('DOMContentLoaded', function () {
  console.log('DOMContent.........')
  litCeramicIntegration.startLitClient(window)
})

document.getElementById('readCeramic')?.addEventListener('click', () => {
  console.log('doing decrypt')
  const decryp = litCeramicIntegration.readAndDecrypt(streamID)
  console.log('done decrypt: ', decryp)
  // @ts-ignore
  document.getElementById('decryption').innerText = decryp
})

// encrypt with Lit and write to ceramic

document.getElementById('encryptLit')?.addEventListener('click', function () {
  // @ts-ignore
  const stringToEncrypt = document.getElementById('secret').value
  console.log('hold on, its coming')
  const response = litCeramicIntegration.ewAsync(stringToEncrypt).then(
    (value) =>
      // @ts-ignore
      (document.getElementById('stream').innerText = value)
  )
  //.encryptAndWrite(stringToEncrypt)
  console.log('ok here it is?', response)
})
