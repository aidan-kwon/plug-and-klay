// @flow
import React, {Component} from 'react'
import type {Dispatch} from "redux";
import {dismissPopup as dismissAction} from "./../redux/actions/popup";
import {connect} from "react-redux";

type Props = {
}

class Popup extends Component<Props> {
  constructor(props) {
    super(props)

    this.state = {
      display: props.enabled,
      Component: props.component,
      name: props.name,
      closable: true
    }
  }

  componentDidMount() {
    window.addEventListener('keydown', this.handleKeyDownToClose);
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.handleKeyDownToClose);
  }

  componentDidUpdate(prevProps: Props, prevState: State, prevContext: *): * {
    const {
      enabled
    } = prevProps

    if (this.props.enabled !== enabled) {
      this.setState({
        closable: this.props.closable,
        display: this.props.enabled,
        Component: this.props.component,
        name: this.props.name
      }, () => {
        if (this.refs.overlay) {
          this.refs.overlay.focus()
        }
      })
    }
  }

  handleKeyDownToClose = (e) => {
    const isESC = e.keyCode === 27
    const isEnter = e.keyCode === 13

    if ((isESC) && this.props.closable) {
      this.handleClose()
    }
  }

  handleClose = () => {
    this.setState({
      display: false,
    })

    this.props.dismiss(this.props.name)
    this.props.onCanceled && setTimeout(this.props.onCanceled, 100)
  }

  handleClickDismiss = (e) => {
    if (!this.props.closable) {
      return
    }

    this.handleClose()
  }

  render() {
    // console.log(`changing popup state: [display: ${this.state.display} / closable: ${this.state.closable}]`)
    if (!this.state.display) {
      return null
    }

    const { Component } = this.state;

    return (
      <div className="modal-overlay" onClick={this.handleClickDismiss} ref={"overlay"}>
        <Component />
      </div>
    )
  }
}

const mapStateToProps = ({ popup }: ReduxState) => ({
  onCanceled: popup.params.onCanceled,
  component: popup.component,
  closable: popup.closable,
  enabled: popup.enabled,
  name: popup.name
})

const mapDispatchToProps = (dispatch: Dispatch) => ({
  dismiss: (name) => dispatch(dismissAction(name)),
})

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Popup)
