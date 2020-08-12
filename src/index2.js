import { RunTab } from './run-tab'

export * from './run-tab'
export * from './make-udapp'

import { buildIframeClient, PluginClient } from 'remix-plugin'
import { makeUdapp } from './make-udapp'

const Blockchain = require('./blockchain/blockchain.js')
const PluginUDapp = require('./blockchain/pluginUDapp.js')
const registry = require('./global/registry')
const httpServer = require('http-server')
const path = require('path')
const merge = require('merge')
const colors = require('colors')

const DEFAULT_OPTIONS = {
  protocol: 'http',
  host: 'localhost',
  port: '8088'
}

const client = buildIframeClient(new PluginClient({
  // devMode: getPluginDevMode()
}))

client.onload(async () => {


  initPlugin(client)
    .catch((e) => console.error('Error initializing plugin', e))
  // If you want your app to work offline and load faster, you can change
  // unregister() to register() below. Note this comes with some pitfalls.
  // Learn more about service workers: https://bit.ly/CRA-PWA
  serviceWorker.unregister();
});


// we only want to subscribe to these once, so we do it outside of components
async function initPlugin (client, dispatch) {
  try {
    // test setting a value to find out if localStorage is blocked
    window.localStorage.initialized = 'true'

    const blockchain = new Blockchain(registry.get('config').api)
    const pluginUdapp = new PluginUDapp(blockchain)

    makeUdapp(blockchain, compilersArtefacts, (domEl) => alert(domEl))

    const run = new RunTab(
      blockchain,
      pluginUdapp,
      registry.get('config').api,
      registry.get('filemanager').api,
      registry.get('editor').api,
      filePanel,
      registry.get('compilersartefacts').api,
      networkModule,
      mainview,
      registry.get('fileproviders/browser').api,
    )


    // const savedNetwork = JSON.parse(loadFromLocalStorage('network') || '{}')
    // dispatch(connectToNetwork(savedNetwork.endpoint))
    //
    // const savedPublicKeys = JSON.parse(loadFromLocalStorage('keysFromUser') || '[]')
    // savedPublicKeys.forEach((key) => dispatch(addPublicKey(key)))

    const wallet = window.klaytn._kaikas

    if (wallet) {
      const approved = await wallet.isApproved()
      const unlocked = await wallet.isUnlocked()

      if (approved && unlocked) {
        // dispatch(addKaikasConnection())
      }
    }
  } catch (e) {
    // dispatch(setError('Warning: Could not access local storage. You can still use all the features of the plugin, but network urls will not be remembered between reloads. To fix, allow 3rd party cookies in the browser settings. The Quorum plugin does not use cookies, however this setting also blocks the plugin from using local storage to remember settings.'))
  }

  // dispatch(fetchCompilationResult(client))
  client.solidity.on('compilationFinished',
    (fileName, source, languageVersion, data) => {
      // just refetching every time for now
      // dispatch(fetchCompilationResult(client))
    })
}
