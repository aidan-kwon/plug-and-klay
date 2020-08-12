import {all} from 'redux-saga/effects'
import { contractSagas } from './contract'
import { popupSagas } from './popup'

export default function* rootSaga() {
  yield all([
    ...contractSagas,
    ...popupSagas
  ])
}
