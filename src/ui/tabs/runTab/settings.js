import React from 'react'
import CopyToClipboard from '../../copy-to-clipboard'
import { Dispatch } from 'redux'
import { newContractInstance as newInstanceAction } from '../../../redux/actions/contract'
import { connect } from 'react-redux'
import * as globalRegistry from '../../../global/registry'

const $ = require('jquery')
const yo = require('yo-yo')
const remixLib = require('remix-lib')
const EventManager = remixLib.EventManager
const css = require('../styles/run-tab-styles')
const modalDialogCustom = require('../../modal-dialog-custom')
const addTooltip = require('../../tooltip')
const helper = require('../../../lib/helper.js')

function EnvironmentEl(props) {
  const { onUpdate, self } = props
  const { providers } = self.state

  return <div className={css.crow}>
    <label id="selectExEnv" className={css.settingsLabel}>Environment</label>
    <div className={css.environment}>
      <select id="selectExEnvOptions" data-id="settingsSelectEnvOptions" onChange={ onUpdate } ref={ ref => self.selectExEnvOptions = ref }
              className={`form-control ${css.select} custom-select`}>
        {/*<option id="vm-mode"*/}
        {/*        title="Execution environment does not connect to any node, everything is local and in memory only."*/}
        {/*        value="vm" name="executionContext"> JavaScript VM*/}
        {/*</option>*/}
        <option id="injected-mode"
                title="Execution environment has been provided by Kaikas or similar provider."
                value="injected" name="executionContext"> Injected Caver
        </option>
        <option id="web3-mode" data-id="settingsWeb3Mode"
                title="Execution environment connects to node at localhost (or via IPC if available), transactions will be sent to the network and can cause loss of money or worse!
              If this page is served via https and you access your node via http, it might not work. In this case, try cloning the repository and serving it via http."
                value="web3" name="executionContext"> Caver Provider
        </option>
        {
          providers.map(provider => {
            return (
              <option
                title={`Manually added environment: ${provider.url}`}
                value={provider.name}
                name={self.executionContext}
              >
                ${provider.name}
              </option>
            )
          })
        }
      </select>
      <a href="https://remix-ide.readthedocs.io/en/latest/run.html#run-setup" target="_blank">
        <i className={`${css.infoDeployAction} ml-2 fas fa-info" title="check out docs to setup Environment`} />
      </a>
    </div>
  </div>
}

function NetworkEl(props) {
  const { status } = props

  return <div className={css.crow}>
    <div className={css.settingsLabel}>
    </div>
    <div className={css.environment} data-id="settingsNetworkEnv">
      <span className={`${css.network} badge badge-secondary`}>{status}</span>
    </div>
  </div>
}

function AccountEl (props) {
  const { self } = props

  return <div className={css.crow} ref={ ref => self.el = ref }>
    <label className={css.settingsLabel}>
      Account
      <span id="remixRunPlusWraper" title="Create a new account" onLoad={self.updatePlusButton }>
            <i id="remixRunPlus" className={`fas fa-plus-circle ${css.icon}`} aria-hidden="true" onClick={self.newAccount } />
          </span>
    </label>
    <div className={css.account}>
      <select data-id="runTabSelectAccount" ref={ref => self.txOrigin = ref } name="txorigin" className={`form-control ${css.select} custom-select pr-4`} id="txorigin">
        {
          self.state.loadedAccounts.map(address => <option value={ address }>{ address }</option> )
        }
      </select>
      <div style={{
        marginLeft: -5
      }}>
        <CopyToClipboard getContent={ () => self.txOrigin.value } />
      </div>
        <i id="remixRunSignMsg" data-id="settingsRemixRunSignMsg" className={`mx-1 fas fa-edit ${css.icon}`} aria-hidden="true" onClick={ self.signMessage } title="Sign a message using this account key" />
    </div>
  </div>
}

function GasPriceEl () {
  return <div className={css.crow}>
    <label className={css.settingsLabel}>Gas limit</label>
    <input type="number" className={`form-control ${css.gasNval} ${css.col2}`} id="gasLimit" value="3000000" />
  </div>
}

function ValueEl(props) {
  return <div className={css.crow}>
    <label className={css.settingsLabel}>Value</label>
    <div className={css.gasValueContainer}>
      <input type="text" className={`form-control ${css.gasNval} ${css.col2}`} id="value" value="0" ref={ ref => props.this.valueField = ref }
             title="Enter the value and choose the unit" />
      <select name="unit" className={`form-control p-1 ${css.gasNvalUnit} ${css.col2_2} custom-select`} id="unit">
        <option value="peb">peb</option>
        <option value="gpeb">Gpeb</option>
        <option value="mklay">mKLAY</option>
        <option value="klay">KLAY</option>
      </select>
    </div>
  </div>
}

class SettingsUI extends React.Component {
  constructor (props) {
    super(props)

    const { blockchain, networkModule } = props

    this.blockchain = blockchain
    this.event = new EventManager()
    this._components = {}

    this.blockchain.event.register('transactionExecuted', (error, from, to, data, lookupOnly, txResult) => {
      if (error) return
      if (!lookupOnly) this.valueField.value = '0'
      this.updateAccountBalances()
    })
    this._components = {
      registry: globalRegistry,
      networkModule: networkModule
    }
    this._components.registry = globalRegistry
    // this._deps = {
    //   config: this._components.registry.get('config').api
    // }
    //
    // this._deps.config.events.on('settings/personal-mode_changed', this.onPersonalChange.bind(this))

    setInterval(() => {
      try {
        this.updateAccountBalances()
      } catch (e) {
        console.log(e)
      }
    }, 10 * 1000)

    this.accountListCallId = 0

    this.setDropdown(this.selectExEnvOptions)

    this.blockchain.event.register('contextChanged', (context, silent) => {
      this.setFinalContext()
    })

    setInterval(() => {
      this.updateNetwork()
    }, 5000)

    this.state = {
      networkStatus: '',
      address: '',
      providers: [],
      loadedAccounts: []
    }

    this.fillAccountsList()
  }

  updateAccountBalances = () => {
    if (!(this.el && this.txOrigin)) return

    try {
      var accounts = $(this.txOrigin).children('option')
    } catch (e) {
      return
    }

    if (!accounts) return
    accounts.each((index, account) => {
      this.blockchain.getBalanceInKlay(account.value, (err, balance) => {
        if (err) return
        account.innerText = helper.shortenAddress(account.value, balance)
      })
    })
  }




  render () {
    return <div className={ css.settings }>
      <EnvironmentEl onUpdate={ this.updateNetwork } self={ this } />
      <NetworkEl status={ this.state.networkStatus } />
      <AccountEl self={ this } />
      <GasPriceEl />
      <ValueEl this={ this } />
    </div>
  }

  setDropdown = (selectExEnv) => {
    if (!selectExEnv) {
      return
    }

    this.blockchain.event.register('addProvider', (network) => {
      this.setState({
        providers: [
          ...this.state.providers,
          network
        ]
      })
      addTooltip(`${network.name} [${network.url}] added`)
    })

    this.blockchain.event.register('removeProvider', (name) => {
      this.setState({
        providers: this.state.providers.filter(it => it.name !== name)
      })
      addTooltip(`${name} removed`)
    })

    selectExEnv.addEventListener('change', (event) => {
      let context = selectExEnv.options[selectExEnv.selectedIndex].value
      this.blockchain.changeExecutionContext(context, () => {
        modalDialogCustom.prompt('External node request', this.web3ProviderDialogBody(), 'http://127.0.0.1:8545', (target) => {
          this.blockchain.setProviderFromEndpoint(target, context, (alertMsg) => {
            if (alertMsg) addTooltip(alertMsg)
            this.setFinalContext()
          })
        }, this.setFinalContext.bind(this))
      }, (alertMsg) => {
        addTooltip(alertMsg)
      }, this.setFinalContext.bind(this))
    })

    selectExEnv.value = this.blockchain.getProvider()
  }

  web3ProviderDialogBody = () => {
    return <div className="">
      Note: To use Geth & https://remix.ethereum.org, configure it to allow requests from Remix:(see <a
      href="https://geth.ethereum.org/docs/rpc/server" target="_blank">Geth Docs on rpc server</a>)
      <div className="border p-1">geth --rpc --rpccorsdomain https://remix.ethereum.org</div>
      <br/>
      To run Remix & a local Geth test node, use this command: (see <a
      href="https://geth.ethereum.org/getting-started/dev-mode" target="_blank">Geth Docs on Dev mode</a>)
      <div className="border p-1">{`geth --rpc --rpccorsdomain="${window.origin}" --rpcapi web3,eth,debug,personal,net
          --vmdebug --datadir ${`<\path/to/local/folder/for/test/chain>`} --dev console`}</div>
      <br/>
      <br/>
      <b>WARNING:</b> It is not safe to use the --rpccorsdomain flag with a wildcard: <b>--rpccorsdomain *</b>
      <br/>
      <br/>For more info: <a href="https://remix-ide.readthedocs.io/en/latest/run.html#more-about-web3-provider"
                             target="_blank">Remix Docs on Web3 Provider</a>
      <br/>
      <br/>
      Web3 Provider Endpoint
    </div>
  }

  setFinalContext = () => {
    // set the final context. Cause it is possible that this is not the one we've originaly selected
    this.selectExEnvOptions.value = this.blockchain.getProvider()
    this.event.trigger('clearInstance', [])
    this.updateNetwork()
    this.updatePlusButton()
  }

  updatePlusButton = () => {
    // enable/disable + button
    let plusBtn = document.getElementById('remixRunPlus')
    let plusTitle = document.getElementById('remixRunPlusWraper')
    switch (this.selectExEnvOptions.value) {
      case 'injected': {
        plusBtn.classList.add(css.disableMouseEvents)
        plusTitle.title = "Unfortunately it's not possible to create an account using injected web3. Please create the account directly from your provider (i.e metamask or other of the same type)."
      }
        break
      case 'vm': {
        plusBtn.classList.remove(css.disableMouseEvents)
        plusTitle.title = 'Create a new account'
      }
        break
      case 'web3': {
        this.onPersonalChange()
      }
        break
      default:
    }
  }

  onPersonalChange = () => {
    let plusBtn = document.getElementById('remixRunPlus')
    let plusTitle = document.getElementById('remixRunPlusWraper')
    if (!this._deps.config.get('settings/personal-mode')) {
      plusBtn.classList.add(css.disableMouseEvents)
      plusTitle.title = 'Creating an account is possible only in Personal mode. Please go to Settings to enable it.'
    } else {
      plusBtn.classList.remove(css.disableMouseEvents)
      plusTitle.title = 'Create a new account'
    }
  }

  newAccount = () => {
    this.blockchain.newAccount(
      '',
      (cb) => {
        modalDialogCustom.promptPassphraseCreation((error, passphrase) => {
          if (error) {
            return modalDialogCustom.alert(error)
          }
          cb(passphrase)
        }, () => {})
      },
      (error, address) => {
        if (error) {
          return addTooltip('Cannot create an account: ' + error)
        }
        addTooltip(`account ${address} created`)
      }
    )
  }

  signMessage = () => {
    this.blockchain.getAccounts((err, accounts) => {
      if (err) {
        return addTooltip(`Cannot get account list: ${err}`)
      }

      var signMessageDialog = { 'title': 'Sign a message', 'text': 'Enter a message to sign', 'inputvalue': 'Message to sign' }
      var $txOrigin = this.txOrigin
      if (!$txOrigin.selectedOptions[0] && (this.blockchain.isInjectedWeb3() || this.blockchain.isWeb3Provider())) {
        return addTooltip(`Account list is empty, please make sure the current provider is properly connected to remix`)
      }

      var account = $txOrigin.selectedOptions[0].value

      var promptCb = (passphrase) => {
        const modal = modalDialogCustom.promptMulti(signMessageDialog, (message) => {
          this.blockchain.signMessage(message, account, passphrase, (err, msgHash, signedData) => {
            if (err) {
              return addTooltip(err)
            }
            modal.hide()
            modalDialogCustom.alert(yo`
              <div>
                <b>hash:</b><br>
                <span id="remixRunSignMsgHash" data-id="settingsRemixRunSignMsgHash">${msgHash}</span>
                <br><b>signature:</b><br>
                <span id="remixRunSignMsgSignature" data-id="settingsRemixRunSignMsgSignature">${signedData}</span>
              </div>
            `)
          })
        }, false)
      }

      if (this.blockchain.isCaverProvider()) {
        return modalDialogCustom.promptPassphrase(
          'Passphrase to sign a message',
          'Enter your passphrase for this account to sign the message',
          '',
          promptCb,
          false
        )
      }
      promptCb()
    })
  }

  updateNetwork = async () => {
    this.blockchain.updateNetwork(async (err, {id, name} = {}) => {
      if (err) {
        await this.setState({
          networkStatus: 'can\'t detect network'
        })
        return
      }
      let network = this._components.networkModule.getNetworkProvider.bind(this._components.networkModule)
      await this.setState({
        networkStatus: (network() !== 'vm') ? `${name} (${id || '-'}) network` : ''
      })
    })
    this.fillAccountsList()
  }

  // TODO: unclear what's the goal of accountListCallId, feels like it can be simplified
  fillAccountsList = () => {
    this.accountListCallId++
    var callid = this.accountListCallId
    var txOrigin = this.txOrigin
    var loadedAccounts = this.state.loadedAccounts
    this.blockchain.getAccounts(async (err, accounts) => {
      if (this.accountListCallId > callid) return
      this.accountListCallId++
      if (err) { addTooltip(`Cannot get account list: ${err}`) }

      await this.setState({
        loadedAccounts: Array.from(
          new Set([
            ...accounts.filter(it => loadedAccounts.indexOf(it) === -1),
            ...loadedAccounts.filter(it => accounts.indexOf(it) !== -1)
          ])
        ),
        // address
      })

      // for (var i in accounts) {
      //   var address = accounts[i]
      //   if (!loadedAccounts[address]) {
      //     await this.setState({
      //       loadedAccounts: Array.from(
      //         new Set([
      //             ...accounts.filter(it => loadedAccounts.indexOf(it) === -1),
      //           ...loadedAccounts.filter(it => accounts.indexOf(it) !== -1)
      //         ])
      //       ),
      //       address
      //     })
      //   }
      // }

      if (txOrigin && accounts && accounts.length) {
        txOrigin.setAttribute('value', accounts[0])
      }
    })
  }
}


const mapStateToProps = ({ contract, network }: ReduxState) => ({
  list: contract.contracts,
  compFails: contract.newlyCompiled.success === false,
  updatedAt: contract.updatedAt.contracts,
  provider: network.provider
})


const mapDispatchToProps = (dispatch: Dispatch) => ({
  newInstance: (contract) => dispatch(newInstanceAction(contract))
  // change: (pin, newPin) => dispatch(changeAction(pin, newPin)),
  // dismiss: (name) => dispatch(dismissAction(name)),
})

export default connect(
  mapStateToProps,
  mapDispatchToProps,
  null,
  { forwardRef: true }
)(SettingsUI)
