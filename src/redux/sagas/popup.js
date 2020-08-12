// @flow
import {put, select, takeLatest,} from 'redux-saga/effects'
import type {Saga} from 'redux-saga'

import {DISMISS_POPUP, DISPLAY_ALERT_MODAL, DISPLAY_CONFIRM_MODAL, DISPLAY_POPUP} from '../actions/actionTypes'

import {dismissPopupFailed, dismissPopupSuccess, displayPopupFailed, displayPopupSuccess} from '../actions/popup'

const CURRENT = state => state.popup.name

function* displayPopup(action: Action) {
  if (action.payload) {
    const current = yield select(CURRENT)
    const { name, closable } = action.payload

    // console.log('trying to display popup: ' + JSON.stringify(action.payload))

    if (current.payload) {
      return yield put(displayPopupFailed())
    }

    const comp = require(`../../ui/components/popups/${name}`).default
    yield put(displayPopupSuccess({
      ...action.payload,
      component: comp,
      closable: closable === undefined ? true : closable
    }))
  }
}

function* dismissPopup(action: Action) {
  const current = yield select(CURRENT)

  // console.log('trying to dismiss popup: ' + action.payload, ' / ', current)
  if (!current.length) {
    return yield put(dismissPopupFailed())
  }

  if (action.payload.length && current !== action.payload) {
    return
  }

  yield put(dismissPopupSuccess(action.payload))
}

function* displayAlert(action: Action) {
  const { message } = action.payload

  if (!message) {
    return
  }

  yield displayPopup({
    type: DISPLAY_POPUP,
    payload: {
      params: action.payload,
      name: 'AlertModal'
    }
  })
}

function* displayConfirm(action: Action) {
  const { message } = action.payload

  if (!message) {
    return
  }

  try {
    yield displayPopup({
      type: DISPLAY_POPUP,
      payload: {
        name: 'AlertModal',
        params: {
          ...action.payload,
          showNegativeButton: true
        }
      }
    })
  } catch (e) {
  }
}

function* watchDisplayPopup(): Saga<void> {
  yield takeLatest(DISPLAY_POPUP, displayPopup)
}

function* watchDismissPopup(): Saga<void> {
  yield takeLatest(DISMISS_POPUP, dismissPopup)
}

function* watchDisplayConfirm(): Saga<void> {
  yield takeLatest(DISPLAY_CONFIRM_MODAL, displayConfirm)
}

function* watchDisplayAlert(): Saga<void> {
  yield takeLatest(DISPLAY_ALERT_MODAL, displayAlert)
}

export const popupSagas = [
  watchDisplayPopup(),
  watchDismissPopup(),
  watchDisplayAlert(),
  watchDisplayConfirm()
]