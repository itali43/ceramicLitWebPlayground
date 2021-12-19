import { DID } from 'dids'
import { createCeramic, authenticateCeramic, writeCeramic, readCeramic } from './ceramic'
import { decodeb64, decryptWithLit, encryptWithLit } from './lit'
import { startLitClient } from './client'

// To Do:
// - Access Control Conditions should not be hardcoded
// - IMPLEMENT DOCUMENTATION.JS! and start documenting
// - Blogpost
// - Allow for Lit Node (and Ceramic Node?) to be editable

declare global {
  interface Window {
    did?: DID
  }
}

const ceramicPromise = createCeramic()
let streamID = 'kjzl6cwe1jw148rh8j6jkmg34ndeqtfexbdhglald95gn7xm7iflsjb815nhx7c' // dummy data

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
