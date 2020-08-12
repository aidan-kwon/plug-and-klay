import { LibraryPlugin } from '@remixproject/engine'
import { Engine } from '@remixproject/engine'
import * as packageJson from '../package.json'
import React from 'react'
import SettingsUI from './ui/tabs/runTab/settings'
import ContractDropdownUI from './ui/tabs/runTab/contractDropdown'
import DropdownLogic from './ui/tabs/runTab/model/dropdownlogic'
import CompilerMetadata from './compiler/compiler-metadata'
import InstanceContainer from './ui/tabs/runTab/instanceContainer'
import { Dispatch } from 'redux'
import { clearContractInstance as clearAction } from './redux/actions/contract'
import { connect } from 'react-redux'
import Popup from './ui/Popup'

const $ = require('jquery')
const yo = require('yo-yo')
const ethJSUtil = require('ethereumjs-util')
const Caver = require('caver-js')
const EventManager = require('./lib/events')
const Card = require('./ui/card')

const css = require('./ui/tabs/styles/run-tab-styles')
const Recorder = require('./ui/tabs/runTab/model/recorder.js')
const RecorderUI = require('./ui/tabs/runTab/recorder.js')

const UniversalDAppUI = require('./ui/universal-dapp-ui')


const profile = {
  name: 'udapp',
  displayName: 'Deploy & run transactions',
  icon: 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjwhLS0gR2VuZXJhdG9yOiBBZG9iZSBJbGx1c3RyYXRvciAxNi4wLjAsIFNWRyBFeHBvcnQgUGx1Zy1JbiAuIFNWRyBWZXJzaW9uOiA2LjAwIEJ1aWxkIDApICAtLT4NCjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+DQo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzFfY29weSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgeD0iMHB4Ig0KCSB5PSIwcHgiIHdpZHRoPSI3NDIuNTQ1cHgiIGhlaWdodD0iNjc2Ljg4NnB4IiB2aWV3Qm94PSIwIC0wLjIwNCA3NDIuNTQ1IDY3Ni44ODYiDQoJIGVuYWJsZS1iYWNrZ3JvdW5kPSJuZXcgMCAtMC4yMDQgNzQyLjU0NSA2NzYuODg2IiB4bWw6c3BhY2U9InByZXNlcnZlIj4NCjxnPg0KCTxwb2x5Z29uIHN0cm9rZT0iI0ZGRkZGRiIgc3Ryb2tlLW1pdGVybGltaXQ9IjEwIiBwb2ludHM9IjI5NS45MTEsMC43MTEgNDg4LjkxMSwzMDQuMTg2IDQ4OC45MTEsMzk3LjE4MSAyOTMuOTExLDY3Ni41NTYgDQoJCTc0MS43ODYsMzQ5Ljk0MyAJIi8+DQoJPHBvbHlnb24gc3Ryb2tlPSIjRkZGRkZGIiBzdHJva2UtbWl0ZXJsaW1pdD0iMTAiIHBvaW50cz0iNDE3LjA4Myw0MDYuNTg5IDIwOS43OTEsNTE5LjQ5NCAxLjg0Niw0MDYuMjM0IDIwOS43OTEsNjc1Ljg2MyAJIi8+DQoJPHBvbHlnb24gc3Ryb2tlPSIjRkZGRkZGIiBzdHJva2UtbWl0ZXJsaW1pdD0iMTAiIHBvaW50cz0iNDE3LjA4MywzMTguNzA3IDIwOS43OTEsMC43MTEgMS44NDYsMzE4LjQyOCAyMDkuNzkxLDQzMS42ODkgCSIvPg0KPC9nPg0KPC9zdmc+DQo=',
  description: 'execute and save transactions',
  kind: 'udapp',
  location: 'sidePanel',
  documentation: 'https://remix-ide.readthedocs.io/en/latest/run.html',
  version: packageJson.version,
  permission: true,
  events: ['newTransaction'],
  methods: ['createVMAccount', 'sendTransaction', 'getAccounts', 'pendingTransactionsCount']
}

class LibraryExecutor extends LibraryPlugin {
  constructor (pluginUDapp) {
    super(pluginUDapp, profile)
  }

  render() {
    return <div />
  }
}

class RunTab extends React.Component {
  constructor (props) {
    super(props)
    const { blockchain, pluginUDapp, config = {}, fileManager = {}, editor = {}, networkModule, fileProvider = {}, artefacts } = props

    // super(pluginUDapp, profile)
    console.log(props)
    this.event = new EventManager()
    this.config = config
    this.blockchain = blockchain
    this.fileManager = fileManager
    this.editor = editor
    this.logCallback = (msg) => { alert(msg) }
    this.compilersArtefacts = artefacts
    this.networkModule = networkModule
    this.fileProvider = fileProvider

    this.plugin = new LibraryExecutor(pluginUDapp)

    console.log(this.activate)
    this.state = {
      contracts: []
    }

    blockchain.resetAndInit(config, {
      getAddress: (cb) => {
        console.log(this.settings.txOrigin.value)
        cb(null, this.settings.txOrigin.value)
      },
      getValue: (cb) => {
        try {
          const number = document.querySelector('#value').value
          const select = document.getElementById('unit')
          const index = select.selectedIndex
          const selectedUnit = select.querySelectorAll('option')[index].dataset.unit
          let unit = 'KLAY' // default
          if (['klay', 'mklay', 'gpeb', 'peb'].indexOf(selectedUnit) >= 0) {
            unit = selectedUnit
          }
          cb(null, Caver.utils.toPeb(number, unit))
        } catch (e) {
          cb(e)
        }
      },
      getGasLimit: (cb) => {
        try {
          cb(null, '0x' + new ethJSUtil.BN($('#gasLimit').val(), 10).toString(16))
        } catch (e) {
          cb(e.message)
        }
      }
    })

    this.dropdownLogic = new DropdownLogic(artefacts, config, editor, this.plugin)

    global.client.fileManager.on('currentFileChanged', function () {
      console.log(this.contractDropdownUI)
      this.contractDropdownUI.changeCurrentFile.bind(this.contractDropdownUI)
    })

    // global.terminal.logHtml(<span>aaa</span>)
    // ----------------- compilation metadata generation servive ---------
    // this.compilerMetadata = new CompilerMetadata(blockchain, () => {  })


    // (async () => {
    //   // APP_MANAGER
    //   const engine = new Engine({})
    //   await engine.onload()
    //
    //   engine.register([
    //     this.compilerMetadata
    //   ])
    // })()
    // this.contractDropdownUI.event.register('clearInstance', () => {
    //   const noInstancesText = this.noInstancesText || ''
    //   if (noInstancesText.parentNode) { noInstancesText.parentNode.removeChild(noInstancesText) }
    // })
    // this.contractDropdownUI.event.register('newContractABIAdded', (abi, address) => {
    //   this.instanceContainer.appendChild(this.udappUI.renderInstanceFromABI(abi, address, '<at address>'))
    // })

  }
  //
  // render () {
  //   return <div className="run-tab" id="runTabView" data-id="runTabView">
  //     <div className="list-group list-group-flush">
  //       <SettingsUI />
  //       ${this.contractDropdownUI.render()}
  //       ${this.recorderCard.render()}
  //       ${this.instanceContainer}
  //     </div>
  //   </div>
  // }

  InstanceContainer = () => {
    // this.event.register('clearInstance', () => {
    //   this.instanceContainer.innerHTML = '' // clear the instances list
    //   this.instanceContainer.appendChild(instanceContainerTitle)
    //   this.instanceContainer.appendChild(this.noInstancesText)
    // })

    return <div className={`${css.instanceContainer} border-0 list-group-item`}>
      <div className="d-flex justify-content-between align-items-center pl-2 ml-1 mb-2"
           title="Autogenerated generic user interfaces for interaction with deployed contracts">
        Deployed Contracts
        <i className={`mr-2 ${css.icon} far fa-trash-alt`} data-id="deployAndRunClearInstances"
           onClick={() => this.event.trigger('clearInstance', [])}
           title="Clear instances list and reset recorder" aria-hidden="true">
        </i>
      </div>
      {
        this.state.contracts.map(contract => {
          return <UniversalDAppUI abi={ contract.abi } address={ contract.address } contractName={ contract.name } />
        })
      }
      {
        this.state.contracts.length < 1 && <span className="mx-2 mt-3 alert alert-warning" data-id="deployAndRunNoInstanceText" role="alert">
        Currently you have no contract instances to interact with.
      </span>
      }
    </div>
  }

  renderRecorder (udappUI, fileManager, config, logCallback) {
    this.recorderCount = yo`<span>0</span>`

    const recorder = new Recorder(this.blockchain, fileManager, config)
    recorder.event.register('recorderCountChange', (count) => {
      this.recorderCount.innerText = count
    })
    this.event.register('clearInstance', recorder.clearAll.bind(recorder))

    this.recorderInterface = new RecorderUI(this.blockchain, recorder, logCallback, config)

    this.recorderInterface.event.register('newScenario', (abi, address, contractName) => {
      var noInstancesText = this.noInstancesText
      if (noInstancesText.parentNode) { noInstancesText.parentNode.removeChild(noInstancesText) }
      this.instanceContainer.appendChild(udappUI.renderInstanceFromABI(abi, address, contractName))
    })

    this.recorderInterface.render()
  }

  renderRecorderCard () {
    const collapsedView = yo`
      <div class="d-flex flex-column">
        <div class="ml-2 badge badge-pill badge-primary" title="The number of recorded transactions">${this.recorderCount}</div>
      </div>`

    const expandedView = yo`
      <div class="d-flex flex-column">
        <div class="${css.recorderDescription} mt-2">
          All transactions (deployed contracts and function executions) in this environment can be saved and replayed in
          another environment. e.g Transactions created in Javascript VM can be replayed in the Injected Web3.
        </div>
        <div class="${css.transactionActions}">
          ${this.recorderInterface.recordButton}
          ${this.recorderInterface.runButton}
          </div>
        </div>
      </div>`

    this.recorderCard = new Card({}, {}, { title: 'Transactions recorded', collapsedView: collapsedView })
    this.recorderCard.event.register('expandCollapseCard', (arrow, body, status) => {
      body.innerHTML = ''
      status.innerHTML = ''
      if (arrow === 'down') {
        status.appendChild(collapsedView)
        body.appendChild(expandedView)
      } else if (arrow === 'up') {
        status.appendChild(collapsedView)
      }
    })
  }

  registerEvents = () => {
    this.contractDropdownUI.event.register('newContractInstanceAdded', (contractObject, address, value) => {
      console.log('newContract')
      // this.instanceContainer.appendChild(this.udappUI.renderInstance(contractObject, address, value))
    })
  }

  render() {
    // this.udappUI = new UniversalDAppUI(this.blockchain, this.logCallback)

    return (
      <div className="run-tab" id="runTabView" data-id="runTabView">
        <Popup
          enabled={this.props.enabled}
        />
        <div className="list-group list-group-flush">
          <SettingsUI ref={ ref => this.settings = ref } blockchain={ this.blockchain } networkModule={ this.networkModule } />
          <ContractDropdownUI onLoad={ this.registerEvents } blockchain={ this.blockchain } dropdownLogic={ this.dropdownLogic } runView={ this } ref={ ref => this.contractDropdownUI = ref } />
          {/*${this.recorderCard.render()}*/}
          <InstanceContainer blockchain={ this.blockchain } />
        </div>
      </div>
    )
  }
  render2 () {
    this.udappUI = new UniversalDAppUI(this.blockchain, this.logCallback)
    this.blockchain.resetAndInit(this.config, {
      getAddress: (cb) => {
        cb(null, $('#txorigin').val())
      },
      getValue: (cb) => {
        try {
          const number = document.querySelector('#value').value
          const select = document.getElementById('unit')
          const index = select.selectedIndex
          const selectedUnit = select.querySelectorAll('option')[index].dataset.unit
          let unit = 'ether' // default
          if (['ether', 'finney', 'gwei', 'wei'].indexOf(selectedUnit) >= 0) {
            unit = selectedUnit
          }
          cb(null, Caver.utils.peb(number, unit))
        } catch (e) {
          cb(e)
        }
      },
      getGasLimit: (cb) => {
        try {
          cb(null, '0x' + new ethJSUtil.BN($('#gasLimit').val(), 10).toString(16))
        } catch (e) {
          cb(e.message)
        }
      }
    })
    this.renderInstanceContainer()
    this.renderSettings()
    this.renderDropdown(this.udappUI, this.fileManager, this.compilersArtefacts, this.config, this.editor, this.logCallback)
    this.renderRecorder(this.udappUI, this.fileManager, this.config, this.logCallback)
    this.renderRecorderCard()
    return this.renderContainer()
  }
}

const mapStateToProps = ({ popup }: ReduxState) => ({
  enabled: popup.enabled
})

export default connect(
  mapStateToProps,
  null
)(RunTab)