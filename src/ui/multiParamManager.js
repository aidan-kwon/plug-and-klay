import React from 'react'
import CopyToClipboard from './copy-to-clipboard'
var css = require('../universal-dapp-styles')
var remixLib = require('remix-lib')
var txFormat = remixLib.execution.txFormat

class MultiParamManager extends React.Component {

  /**
   *
   * @param {bool} lookupOnly
   * @param {Object} funABI
   * @param {Function} clickMultiCallBack
   * @param {string} inputs
   * @param {string} title
   * @param {string} evmBC
   *
   */
  constructor (props) {
    super(props)

    // const { lookupOnly, funABI, clickCallBack, inputs, title, evmBC, isDeploy } = props

    this.state = {
      ...props
    }

    this.multiFields = {}
  }

  switchMethodViewOn = () => {
    this.contractActionsContainerSingle.style.display = 'none'
    this.contractActionsContainerMulti.style.display = 'flex'
    this.makeMultiVal()
  }

  switchMethodViewOff = () => {
    this.contractActionsContainerSingle.style.display = 'flex'
    this.contractActionsContainerMulti.style.display = 'none'
    var multiValString = this.getMultiValsString()
    if (multiValString) this.basicInputField.value = multiValString
  }

  getValue (item, index) {
    var valStr = item.value.join('')
    return valStr
  }

  getMultiValsString = () => {
    if (!this.multiFields.children) return ''

    var valArray = Array.from(this.multiFields.children).filter(it=> it.class === 'input')
    var ret = ''
    var valArrayTest = []

    for (var j = 0; j < valArray.length; j++) {
      if (ret !== '') ret += ','
      var elVal = valArray[j].value
      valArrayTest.push(elVal)
      elVal = elVal.replace(/(^|,\s+|,)(\d+)(\s+,|,|$)/g, '$1"$2"$3') // replace non quoted number by quoted number
      elVal = elVal.replace(/(^|,\s+|,)(0[xX][0-9a-fA-F]+)(\s+,|,|$)/g, '$1"$2"$3') // replace non quoted hex string by quoted hex string
      try {
        JSON.parse(elVal)
      } catch (e) {
        elVal = '"' + elVal + '"'
      }
      ret += elVal
    }
    var valStringTest = valArrayTest.join('')
    if (valStringTest) {
      return ret
    } else {
      return ''
    }
  }

  emptyInputs = () => {
    var valArray = this.multiFields.querySelectorAll('input')
    for (var k = 0; k < valArray.length; k++) {
      valArray[k].value = ''
    }
    this.basicInputField.value = ''
  }

  makeMultiVal = () => {
    var inputString = this.basicInputField.value
    if (inputString) {
      inputString = inputString.replace(/(^|,\s+|,)(\d+)(\s+,|,|$)/g, '$1"$2"$3') // replace non quoted number by quoted number
      inputString = inputString.replace(/(^|,\s+|,)(0[xX][0-9a-fA-F]+)(\s+,|,|$)/g, '$1"$2"$3') // replace non quoted hex string by quoted hex string
      var inputJSON = JSON.parse('[' + inputString + ']')
      var multiInputs = this.multiFields.querySelectorAll('input')
      for (var k = 0; k < multiInputs.length; k++) {
        if (inputJSON[k]) {
          multiInputs[k].value = JSON.stringify(inputJSON[k])
        }
      }
    }
  }

  makeTitle = (title, funABI) => {
    if (title) {
      return title
    }

    if (funABI.name) {
      return funABI.name
    }

    return funABI.type === 'receive' ? '(receive)' : '(fallback)'
  }

  getCopiableContent = () => {
    var multiString = this.getMultiValsString()
    var multiJSON = JSON.parse('[' + multiString + ']')
    var encodeObj
    if (this.evmBC) {
      encodeObj = txFormat.encodeData(this.funABI, multiJSON, this.evmBC)
    } else {
      encodeObj = txFormat.encodeData(this.funABI, multiJSON)
    }
    if (encodeObj.error) {
      throw new Error(encodeObj.error)
    } else {
      return encodeObj.data
    }
  }

  responseCallBack = (cb, abi) => {
      cb(abi.inputs, this.basicInputField.value)
  }

  responseMultiClick = (cb, abi) => {
    var valsString = this.getMultiValsString()

    if (valsString) {
      return cb(abi.inputs, valsString)
    }

    cb(abi.inputs, '')
  }

  abiStatus = (abi) => {
    if (abi.inputs && abi.inputs.length > 0) {
      return true
    }

    if (abi.type === 'fallback' || abi.type === 'receive') {
      return false
    }

    return undefined
  }

  txPayable = () => {
    const { lookupOnly, funABI } = this.state

    if (lookupOnly) {
      return undefined
    }

    return !!(funABI.stateMutability === 'payable' || funABI.payable);
  }

  render () {
    const { inputs, title, clickCallBack, funABI, lookupOnly, isDeploy  } = this.state
    const txPayable = this.txPayable()

    let paramsTitle = this.makeTitle(title, funABI)
    const payableText = `${paramsTitle} - ${txPayable ? `transact (payable)` : (txPayable === false ? `transact (not payable)` : `call`)}`
    const btnClass = txPayable ? 'btn-danger' : (txPayable === false ? 'btn-warning' : 'btn-info')

    return <div className={`${css.contractProperty}`}>
      <div className={`${css.contractActionsContainerSingle} pt-2`} ref={ ref => this.contractActionsContainerSingle = ref }>
        <button ref={ ref => this.funcButton = ref } onClick={ () => this.responseCallBack(clickCallBack, funABI) } className={`${css.instanceButton} ${isDeploy ? '' : 'w-50'} ${btnClass} btn btn-sm`}
        title={ payableText } data-id={ payableText }>{paramsTitle}</button>
        <input ref={ ref => this.basicInputField = ref } className="form-control" placeholder={inputs} title={ this.abiStatus(funABI) ? paramsTitle : funABI.type} data-id={ this.abiStatus(funABI) ? inputs : funABI.type } hidden={ this.abiStatus(funABI) === undefined }/>
        <i className={`fas fa-angle-down ${css.methCaret}`} onClick={ this.switchMethodViewOn } title={paramsTitle} hidden={ !this.abiStatus(funABI) }/>
      </div>
      <div className={`${css.contractActionsContainerMulti}`} ref={ ref => this.contractActionsContainerMulti = ref }>
        <div className={`${css.contractActionsContainerMultiInner} text-dark`} >
          <div onClick={ this.switchMethodViewOff } className={`${css.multiHeader}`}>
            <div className={`${css.multiTitle} run-instance-multi-title`}>{paramsTitle}</div>
            <i className={`fas fa-angle-up ${css.methCaret}`} />
          </div>
          {
            funABI.inputs.length > 0 && <div ref={ ref => this.multiFields = ref }>
              {
                funABI.inputs.map(function (inp) {
                  return <div className={css.multiArg}>
                    <label htmlFor={inp.name}> {inp.name}: </label>
                    <input className="form-control" placeholder={inp.type} title={inp.name} data-id={`multiParamManagerInput${inp.name}`} />
                  </div>
                })}
            </div>
          }
          <div className={`${css.group} ${css.multiArg}`}>
            <CopyToClipboard getContent={ this.getCopiableContent } tip={ 'Encode values of input fields & copy to clipboard' } icon={ 'fa-clipboard' } />
            <button ref={ ref => this.expandedButton = ref } onClick={ () => this.responseMultiClick(clickCallBack, funABI) } className={`${css.instanceButton} ${btnClass}`}
            data-id={ payableText } title={ payableText }>{ lookupOnly ? 'call' : 'transact' }</button>
          </div>
        </div>
      </div>
    </div>

    // if (this.lookupOnly) {
    //   // call. stateMutability is either pure or view
    //   expandedButton.setAttribute('title', (title + ' - call'))
    //   expandedButton.innerHTML = 'call'
    //   expandedButton.classList.add('btn-info')
    //   expandedButton.setAttribute('data-id', (title + ' - call'))
    //   funcButton.setAttribute('title', (title + ' - call'))
    //   funcButton.classList.add('btn-info')
    //   funcButton.setAttribute('data-id', (title + ' - call'))
    // } else if (this.funABI.stateMutability === 'payable' || this.funABI.payable) {
    //   // transact. stateMutability = payable
    //   expandedButton.setAttribute('title', (title + ' - transact (payable)'))
    //   expandedButton.innerHTML = 'transact'
    //   expandedButton.classList.add('btn-danger')
    //   expandedButton.setAttribute('data-id', (title + ' - transact (payable)'))
    //   funcButton.setAttribute('title', (title + ' - transact (payable)'))
    //   funcButton.classList.add('btn-danger')
    //   funcButton.setAttribute('data-id', (title + ' - transact (payable)'))
    // } else {
    //   // transact. stateMutability = nonpayable
    //   expandedButton.setAttribute('title', (title + ' - transact (not payable)'))
    //   expandedButton.innerHTML = 'transact'
    //   expandedButton.classList.add('btn-warning')
    //   expandedButton.setAttribute('data-id', (title + ' - transact (not payable)'))
    //   funcButton.classList.add('btn-warning')
    //   funcButton.setAttribute('title', (title + ' - transact (not payable)'))
    //   funcButton.setAttribute('data-id', (title + ' - transact (not payable)'))
    // }
    //
    // if (this.funABI.inputs && this.funABI.inputs.length > 0) {
    //   contractProperty.classList.add(css.hasArgs)
    // } else if (this.funABI.type === 'fallback' || this.funABI.type === 'receive') {
    //   contractProperty.classList.add(css.hasArgs)
    //   this.basicInputField.setAttribute('title', `'(${this.funABI.type}')`) // probably should pass name instead
    //   this.contractActionsContainerSingle.querySelector('i').style.visibility = 'hidden'
    //   this.basicInputField.setAttribute('data-id', `'(${this.funABI.type}')`)
    // } else {
    //   this.contractActionsContainerSingle.querySelector('i').style.visibility = 'hidden'
    //   this.basicInputField.style.visibility = 'hidden'
    // }
    //
    // return contractProperty
  }
}

export default MultiParamManager
