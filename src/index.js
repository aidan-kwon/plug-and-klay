import { buildIframeClient, checkOrigin } from "remix-plugin/projects/client-iframe"
import { PluginClient } from "remix-plugin/projects/client"
import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import * as serviceWorker from './serviceWorker'
import '@fortawesome/fontawesome-free/css/all.min.css';
import { Provider } from 'react-redux'
import { addKaikasConnection, addPublicKey, connectToNetwork, fetchCompilationResult, setError } from './actions'
import { getPluginDevMode, isDevelopment, loadFromLocalStorage } from './utils/EnvUtils'
// import { RunTab } from './run-tab'
// import Blockchain from './blockchain/blockchain'
// import Blockchain from './blockchain/bc'
import PluginUDapp from './blockchain/pluginUDapp'
import NetworkModule from './ui/tabs/network-module'
import store from './redux/store'
import { makeUdapp } from './make-udapp'
var yo = require('yo-yo')

const RunTab = require('./run-tab').default
require("amd-loader");

let Blockchain = require('./blockchain/bc').default
let blockchain = {}
let pluginUDapp = {}
let networkModule = {}
let { CompilerArtefacts } = require('./compiler/compiler-artefacts')
let compilerArtefacts = new CompilerArtefacts()

// console.log = () => {}

const client = buildIframeClient(new PluginClient({
  devMode: getPluginDevMode({
    origins:
      [
        'http://localhost',
        'https://kide.ozys.net',
      'http://ide.ozys.net'
    ],
    port: 8080
  })
}))

// engine.__set__('checkOrigin', async () => { return true })
//
// // checkOrigin.prototype = async function () {
// //   return true
// // }
//
// engine.checkOrigin = async function() {
//   return true
// }
//
// module.exports = engine
//
// console.log({
//   check: checkOrigin('asdfasdf', {})
// })

async function setupDefaults() {
  blockchain = new Blockchain({})
  pluginUDapp = new PluginUDapp(blockchain)
  networkModule = new NetworkModule(blockchain)

  const Artefacts = require('./compiler/compiler-artefacts').CompilerArtefacts
  const artefacts = new Artefacts()

  global.artefacts = artefacts
  makeUdapp(blockchain, artefacts.compilersArtefacts, global.terminal.logHtml)

  initPlugin(client, store.dispatch)
    .catch((e) => console.error('Error initializing plugin', e))
}

const getMethods = (obj) => Object.getOwnPropertyNames(obj).filter(item => typeof obj[item] === 'function')
// client.call('aa',' dd')
try {
  client.onload(async () => {
    global.terminal = client.terminal
    await setupDefaults()

    ReactDOM.render(
      <Provider store={store}>
        <RunTab blockchain={ blockchain} pluginUDapp={ pluginUDapp } networkModule={ networkModule } artefacts={ compilerArtefacts } />
      </Provider>,
      document.getElementById('root'))

    // If you want your app to work offline and load faster, you can change
    // unregister() to register() below. Note this comes with some pitfalls.
    // Learn more about service workers: https://bit.ly/CRA-PWA
    serviceWorker.unregister();
  }).catch(e => console.log({ err: e}));
} catch (e) {
  console.log({
    e
  })
}



if (module.hot) {
  console.log('is hot')
  module.hot.accept('./run-tab', () => {
    // const NextRunTab = require('./run-tab').default

    ReactDOM.render(
      <Provider store={store}>
        <RunTab blockchain={ blockchain} pluginUDapp={ pluginUDapp } networkModule={ networkModule } artefacts={ compilerArtefacts } />
      </Provider>,
      document.getElementById('root')
    )
  })
  // module.hot.accept('./reducers', () => {
  //   const nextRootReducer = require('./reducers').default
  //   store.replaceReducer(nextRootReducer)
  // })
}

// we only want to subscribe to these once, so we do it outside of components
async function initPlugin (client, dispatch) {
  console.log('initPlugin')
  if(isDevelopment()) {
    await initDev(client, dispatch)
  }

  console.log(client)
  global.client = client

  try {
    // test setting a value to find out if localStorage is blocked
    window.localStorage.initialized = 'true'

    const savedNetwork = JSON.parse(loadFromLocalStorage('network') || '{}')
    dispatch(connectToNetwork(savedNetwork.endpoint))

    const savedPublicKeys = JSON.parse(loadFromLocalStorage('keysFromUser') || '[]')
    savedPublicKeys.forEach((key) => dispatch(addPublicKey(key)))

    const wallet = window.klaytn._kaikas

    if (wallet) {
      const approved = await wallet.isApproved()
      const unlocked = await wallet.isUnlocked()

      if (approved && unlocked) {
        dispatch(addKaikasConnection())
      }
    }
  } catch (e) {
    dispatch(setError('Warning: Could not access local storage. You can still use all the features of the plugin, but network urls will not be remembered between reloads. To fix, allow 3rd party cookies in the browser settings. The Klaytn plugin does not use cookies, however this setting also blocks the plugin from using local storage to remember settings.'))
  }

  dispatch(fetchCompilationResult(client))
  client.solidity.on('compilationFinished',
    (fileName, source, languageVersion, data) => {
      // just refetching every time for now
      dispatch(fetchCompilationResult(client))
    })
}

async function initDev (client) {
}
